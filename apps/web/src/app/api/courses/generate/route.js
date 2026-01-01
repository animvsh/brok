import supabase from "@/app/api/utils/supabase";
import OpenAI from "openai";
import { getUserId, checkRateLimit, validateString, sanitizeString } from "@/app/api/utils/auth";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

// Constants for validation
const MAX_TOPIC_LENGTH = 200;
const MAX_MODULES = 10;
const MAX_CONCEPTS_PER_MODULE = 10;
const RATE_LIMIT_REQUESTS = 5; // 5 course generations
const RATE_LIMIT_WINDOW = 3600000; // per hour

export async function POST(request) {
  try {
    // Get and validate user
    const { userId, error: userError, status: userStatus } = await getUserId(request);
    if (userError) {
      return Response.json({ error: userError }, { status: userStatus });
    }

    // Rate limiting - course generation is expensive
    const rateCheck = checkRateLimit(userId, 'course_generate', RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW);
    if (!rateCheck.allowed) {
      return Response.json(
        { error: `Rate limit exceeded. Try again in ${rateCheck.retryAfter} seconds` },
        { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfter) } }
      );
    }

    // Parse and validate input
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { topic } = body;

    // Validate topic
    const topicError = validateString(topic, { minLength: 3, maxLength: MAX_TOPIC_LENGTH });
    if (topicError) {
      return Response.json({ error: `Invalid topic: ${topicError}` }, { status: 400 });
    }

    // Sanitize topic
    const sanitizedTopic = sanitizeString(topic);

    // Generate course structure using OpenAI
    let courseData;

    if (openai) {
      courseData = await generateCourseWithOpenAI(sanitizedTopic);
    } else {
      console.warn("No OpenAI API key, using mock course");
      courseData = generateMockCourse(sanitizedTopic);
    }

    // Validate generated course data
    if (!courseData || !courseData.modules || !Array.isArray(courseData.modules)) {
      console.error("Invalid course data generated");
      courseData = generateMockCourse(sanitizedTopic);
    }

    // Enforce limits on generated content
    courseData.modules = courseData.modules.slice(0, MAX_MODULES);
    courseData.modules.forEach(module => {
      if (module.concepts) {
        module.concepts = module.concepts.slice(0, MAX_CONCEPTS_PER_MODULE);
      }
    });

    // Create course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert({
        title: courseData.title,
        description: courseData.description,
        goal: courseData.goal,
        total_modules: courseData.modules.length,
        is_active: true
      })
      .select()
      .single();

    if (courseError) {
      console.error("Error creating course:", courseError);
      throw courseError;
    }

    // Create modules and concepts
    for (let i = 0; i < courseData.modules.length; i++) {
      const moduleData = courseData.modules[i];

      const { data: module, error: moduleError } = await supabase
        .from('modules')
        .insert({
          course_id: course.id,
          module_order: i + 1,
          title: moduleData.title,
          description: moduleData.description
        })
        .select()
        .single();

      if (moduleError) {
        console.error("Error creating module:", moduleError);
        throw moduleError;
      }

      // Create concepts for this module
      for (const conceptData of moduleData.concepts) {
        const { data: concept, error: conceptError } = await supabase
          .from('concepts')
          .insert({
            module_id: module.id,
            concept_name: conceptData.name,
            concept_data: conceptData.questions
          })
          .select()
          .single();

        if (conceptError) {
          console.error("Error creating concept:", conceptError);
          throw conceptError;
        }

        // Initialize performance tracking for this concept (if userId provided)
        if (userId) {
          await supabase
            .from('user_performance')
            .insert({
              user_id: userId,
              concept_id: concept.id,
              mastery_level: 0.0,
              next_review: new Date().toISOString()
            });
        }
      }
    }

    // Get first module
    const { data: firstModule } = await supabase
      .from('modules')
      .select('id')
      .eq('course_id', course.id)
      .order('module_order', { ascending: true })
      .limit(1)
      .single();

    // Set as active course for user (if userId provided)
    if (userId) {
      await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          active_course_id: course.id,
          current_module_id: firstModule?.id
        }, { onConflict: 'user_id' });
    }

    return Response.json({ success: true, course });
  } catch (error) {
    console.error("Error generating course:", error);
    // Don't expose internal error details in production
    return Response.json(
      { error: "Failed to generate course. Please try again." },
      { status: 500 },
    );
  }
}

// Generate course using OpenAI
async function generateCourseWithOpenAI(topic) {
  const prompt = `Create a comprehensive learning course about "${topic}".

Return a JSON object with this exact structure:
{
  "title": "Course title",
  "description": "Course description",
  "goal": "What learners will achieve",
  "modules": [
    {
      "title": "Module title",
      "description": "Module description",
      "concepts": [
        {
          "name": "Concept name",
          "questions": [
            {
              "type": "multiple_choice",
              "question": "Question text",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correctAnswer": "Option A",
              "explanation": "Why this is correct"
            }
          ]
        }
      ]
    }
  ]
}

Requirements:
- Create 5-8 modules that progressively build knowledge
- Each module should have 3-5 concepts
- Each concept should have 2-4 questions
- Question types can be: "multiple_choice", "true_false", or "fill_blank"
- For true_false, options should be ["True", "False"]
- For fill_blank, the question should have a blank indicated by "___"
- Make questions educational and progressively more challenging

Return ONLY the JSON object, no markdown or additional text.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert course designer. You create well-structured educational courses with clear learning objectives. Always respond with valid JSON only, no markdown formatting."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 8192,
      response_format: { type: "json_object" }
    });

    const textContent = response.choices?.[0]?.message?.content;

    if (!textContent) {
      throw new Error("No content in OpenAI response");
    }

    // Parse the JSON from the response
    let jsonStr = textContent.trim();
    // Handle potential markdown wrapping just in case
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }

    const courseData = JSON.parse(jsonStr.trim());
    return courseData;
  } catch (error) {
    console.error("Error generating course with OpenAI:", error);
    // Fall back to mock course
    return generateMockCourse(topic);
  }
}

// Mock course generator - fallback when API is unavailable
function generateMockCourse(topic) {
  return {
    title: `Master ${topic}`,
    description: `A comprehensive course to help you master ${topic} from the ground up.`,
    goal: `By the end of this course, you will have a solid understanding of ${topic} and be able to apply it in real-world scenarios.`,
    modules: [
      {
        title: `Introduction to ${topic}`,
        description: `Get started with the basics of ${topic}`,
        concepts: [
          {
            name: `What is ${topic}?`,
            questions: [
              {
                type: "multiple_choice",
                question: `What is the main purpose of learning ${topic}?`,
                options: ["To gain new skills", "To waste time", "To confuse yourself", "None of the above"],
                correctAnswer: "To gain new skills",
                explanation: `Learning ${topic} helps you develop valuable skills that can be applied in many areas.`
              },
              {
                type: "true_false",
                question: `${topic} is a valuable skill to learn.`,
                options: ["True", "False"],
                correctAnswer: "True",
                explanation: `Yes, ${topic} is indeed a valuable skill that many people benefit from learning.`
              }
            ]
          },
          {
            name: `History of ${topic}`,
            questions: [
              {
                type: "multiple_choice",
                question: `Why is it important to understand the history of ${topic}?`,
                options: ["It provides context", "It's not important", "It's boring", "None of the above"],
                correctAnswer: "It provides context",
                explanation: "Understanding history helps you appreciate how the field has evolved."
              }
            ]
          }
        ]
      },
      {
        title: `Core Concepts of ${topic}`,
        description: `Learn the fundamental concepts`,
        concepts: [
          {
            name: "Fundamental Principles",
            questions: [
              {
                type: "multiple_choice",
                question: "What makes a principle 'fundamental'?",
                options: ["It forms the foundation", "It's optional", "It's advanced", "It's not important"],
                correctAnswer: "It forms the foundation",
                explanation: "Fundamental principles are the building blocks upon which everything else is built."
              }
            ]
          }
        ]
      },
      {
        title: `Practical Applications`,
        description: `Apply what you've learned`,
        concepts: [
          {
            name: "Real-world Usage",
            questions: [
              {
                type: "true_false",
                question: "Practical application helps reinforce learning.",
                options: ["True", "False"],
                correctAnswer: "True",
                explanation: "Applying knowledge in practice helps solidify understanding."
              }
            ]
          }
        ]
      }
    ]
  };
}
