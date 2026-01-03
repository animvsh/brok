import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

interface Question {
  type: "multiple_choice" | "true_false" | "fill_blank";
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

interface Concept {
  name: string;
  questions: Question[];
}

interface Module {
  title: string;
  description: string;
  concepts: Concept[];
}

interface CourseData {
  title: string;
  description: string;
  goal: string;
  modules: Module[];
}

// Constants
const SIMILARITY_THRESHOLD = 0.75; // 75% similarity required to reuse course
const SUBSTRING_MATCH_THRESHOLD = 0.7; // 70% length match for substring similarity
const MAX_MODULES = 40; // Increased for multi-day learning plans
const MAX_CONCEPTS_PER_MODULE = 8;
const MAX_QUESTIONS_PER_CONCEPT = 6;

// Calculate similarity between two strings (0-1, where 1 is identical)
function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.trim().toLowerCase();
  const s2 = str2.trim().toLowerCase();
  
  // Exact match
  if (s1 === s2) return 1.0;
  
  // Normalize strings (remove common words, punctuation)
  const normalize = (s: string) => s
    .replace(/[.,!?;:()]/g, '')
    .replace(/\b(the|a|an|and|or|of|in|on|at|to|for|with|from)\b/gi, '')
    .trim()
    .replace(/\s+/g, ' ');
  
  const norm1 = normalize(s1);
  const norm2 = normalize(s2);
  
  // Normalized exact match
  if (norm1 === norm2) return 0.95;
  
  // Check if one contains the other (for variations like "derivative" vs "derivatives")
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    const shorter = norm1.length < norm2.length ? norm1 : norm2;
    const longer = norm1.length >= norm2.length ? norm1 : norm2;
    // If shorter is at least threshold% of longer, consider it a match
    if (shorter.length / longer.length >= SUBSTRING_MATCH_THRESHOLD) {
      return 0.85;
    }
  }
  
  // Word-based similarity
  const words1 = new Set(norm1.split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(norm2.split(/\s+/).filter(w => w.length > 2));
  
  if (words1.size === 0 || words2.size === 0) {
    // Fallback to character-based similarity
    return levenshteinSimilarity(norm1, norm2);
  }
  
  // Calculate Jaccard similarity (intersection over union)
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  const jaccard = intersection.size / union.size;
  
  // Also check character-based similarity
  const charSimilarity = levenshteinSimilarity(norm1, norm2);
  
  // Combine both metrics
  return Math.max(jaccard, charSimilarity);
}

function levenshteinSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Get first module for a course
async function getFirstModule(supabase: any, courseId: string) {
  const { data: modules } = await supabase
    .from("modules")
    .select("id")
    .eq("course_id", courseId)
    .order("module_order", { ascending: true })
    .limit(1);
  return modules && modules.length > 0 ? modules[0] : null;
}

// Find similar existing course using OpenAI for semantic matching
async function findSimilarCourse(
  supabase: any,
  topic: string,
  user_id: string | undefined,
  openaiApiKey: string
): Promise<{ id: string; title: string; description: string; goal: string; total_modules: number; similarity: number } | null> {
  try {
    // Fetch ALL courses to check for similarity
    const { data: courses, error } = await supabase
      .from("courses")
      .select("id, title, description, goal, total_modules, user_id");
    
    if (error) {
      console.error("Error fetching courses for similarity check:", error);
      return null;
    }
    
    console.log(`Found ${courses?.length || 0} total courses in database`);
    
    if (!courses || courses.length === 0) {
      console.log("No courses found in database");
      return null;
    }
    
    // If only one course, check it directly
    if (courses.length === 1) {
      const course = courses[0];
      const isSimilar = await checkCourseSimilarityWithOpenAI(topic, course, openaiApiKey);
      if (isSimilar) {
        return { ...course, similarity: 0.9 };
      }
      return null;
    }
    
    // Use OpenAI to find the most similar course
    const courseList = courses.map((c: any, index: number) => ({
      index,
      id: c.id,
      title: c.title,
      description: c.description || "",
      isUserCourse: user_id && c.user_id === user_id,
    }));
    
    const similarCourseIndex = await findMostSimilarCourseWithOpenAI(topic, courseList, openaiApiKey);
    
    if (similarCourseIndex === null) {
      console.log("OpenAI found no similar course");
      return null;
    }
    
    const matchedCourse = courses[similarCourseIndex];
    console.log(`OpenAI matched course: "${matchedCourse.title}"`);
    
    return {
      ...matchedCourse,
      similarity: 0.9, // OpenAI found it similar, so we trust it
    };
  } catch (error) {
    console.error("Error in findSimilarCourse:", error);
    return null;
  }
}

// Use OpenAI to check if a single course is similar to the topic
async function checkCourseSimilarityWithOpenAI(
  topic: string,
  course: any,
  apiKey: string
): Promise<boolean> {
  try {
    const prompt = `Is the course "${course.title}" (description: "${course.description || 'No description'}") about the same topic as "${topic}"?

Respond with ONLY a JSON object: {"similar": true or false, "reason": "brief explanation"}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Use cheaper model for similarity check
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that determines if courses cover the same topic. Always respond with valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.error("OpenAI similarity check failed:", response.status);
      return false;
    }

    const data = await response.json();
    const result = JSON.parse(data.choices?.[0]?.message?.content || '{"similar": false}');
    return result.similar === true;
  } catch (error) {
    console.error("Error checking course similarity with OpenAI:", error);
    return false;
  }
}

// Use OpenAI to find the most similar course from a list
async function findMostSimilarCourseWithOpenAI(
  topic: string,
  courses: Array<{ index: number; id: string; title: string; description: string; isUserCourse: boolean }>,
  apiKey: string
): Promise<number | null> {
  try {
    const coursesJson = JSON.stringify(courses.map(c => ({
      index: c.index,
      title: c.title,
      description: c.description,
      isUserCourse: c.isUserCourse,
    })));

    const prompt = `Given the topic "${topic}", find the most similar course from this list:

${coursesJson}

Consider semantic similarity - for example, "derivatives" and "rate of change" are the same topic, "calculus derivatives" and "derivatives" are the same, etc.

If a course is marked as "isUserCourse: true", prioritize it if it's reasonably similar.

Respond with ONLY a JSON object: {"index": number of the most similar course, or null if none are similar enough, "confidence": "high/medium/low", "reason": "brief explanation"}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Use cheaper model for similarity check
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that finds the most similar course to a given topic. Always respond with valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 300,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.error("OpenAI similarity search failed:", response.status);
      return null;
    }

    const data = await response.json();
    const result = JSON.parse(data.choices?.[0]?.message?.content || '{"index": null}');
    
    console.log(`OpenAI similarity result:`, result);
    
    // Only return if confidence is medium or high
    if (result.index !== null && result.index !== undefined && (result.confidence === "high" || result.confidence === "medium")) {
      return result.index;
    }
    
    return null;
  } catch (error) {
    console.error("Error finding similar course with OpenAI:", error);
    return null;
  }
}

Deno.serve(async (req: Request) => {
  try {
    // Get OpenAI API key from Supabase secrets
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      console.error("OPENAI_API_KEY secret is not set in Supabase");
      return new Response(
        JSON.stringify({ 
          error: "OPENAI_API_KEY not found in environment",
          message: "Please set the OPENAI_API_KEY secret in your Supabase project settings"
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { topic, user_id, skill_level } = body;

    if (!topic || typeof topic !== "string" || topic.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: "Topic is required and must be at least 3 characters" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for existing similar courses before generating a new one
    const existingCourse = await findSimilarCourse(supabase, topic, user_id, openaiApiKey);
    
    if (existingCourse) {
      console.log(`Found similar existing course: ${existingCourse.title} (similarity: ${existingCourse.similarity})`);
      
      // If user_id provided, ensure it's set as active course
      if (user_id) {
        const firstModule = await getFirstModule(supabase, existingCourse.id);
        await supabase.from("user_progress").upsert(
          {
            user_id: user_id,
            active_course_id: existingCourse.id,
            current_module_id: firstModule?.id || null,
          },
          { onConflict: "user_id" }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          course: {
            id: existingCourse.id,
            title: existingCourse.title,
            description: existingCourse.description,
            goal: existingCourse.goal,
            total_modules: existingCourse.total_modules,
          },
          modules: existingCourse.total_modules,
          concepts: 0, // We don't need to count for existing courses
          reused: true,
          similarity: existingCourse.similarity,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // No similar course found, generate a new one
    console.log(`No similar course found for "${topic}", generating new course...`);
    const skillLevel = typeof skill_level === 'number' ? Math.max(0, Math.min(1, skill_level)) : undefined;
    const courseData = await generateComprehensiveCourse(topic, openaiApiKey, skillLevel);

    // Create course in database
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .insert({
        title: courseData.title,
        description: courseData.description,
        goal: courseData.goal,
        total_modules: courseData.modules.length,
        is_active: true,
        user_id: user_id || null, // Associate course with user if provided
      })
      .select()
      .single();

    if (courseError) {
      console.error("Error creating course:", courseError);
      return new Response(
        JSON.stringify({ error: "Failed to create course", details: courseError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create modules and concepts
    const moduleResults = [];
    for (let i = 0; i < courseData.modules.length; i++) {
      const moduleData = courseData.modules[i];

      const { data: module, error: moduleError } = await supabase
        .from("modules")
        .insert({
          course_id: course.id,
          module_order: i + 1,
          title: moduleData.title,
          description: moduleData.description,
        })
        .select()
        .single();

      if (moduleError) {
        console.error(`Error creating module ${i + 1}:`, moduleError);
        continue;
      }

      const conceptResults = [];
      for (const conceptData of moduleData.concepts) {
        const { data: concept, error: conceptError } = await supabase
          .from("concepts")
          .insert({
            module_id: module.id,
            concept_name: conceptData.name,
            concept_data: conceptData.questions,
          })
          .select()
          .single();

        if (conceptError) {
          console.error(`Error creating concept ${conceptData.name}:`, conceptError);
          continue;
        }

        conceptResults.push(concept);

        // Initialize user performance tracking if user_id provided
        if (user_id) {
          await supabase.from("user_performance").insert({
            user_id: user_id,
            concept_id: concept.id,
            mastery_level: 0.0,
            next_review: new Date().toISOString(),
          });
        }
      }

      moduleResults.push({
        ...module,
        concepts: conceptResults,
      });
    }

    // Set as active course for user if user_id provided
    if (user_id) {
      const firstModule = await getFirstModule(supabase, course.id);
      await supabase.from("user_progress").upsert(
        {
          user_id: user_id,
          active_course_id: course.id,
          current_module_id: firstModule?.id || null,
        },
        { onConflict: "user_id" }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        course: {
          id: course.id,
          title: course.title,
          description: course.description,
          goal: course.goal,
          total_modules: course.total_modules,
        },
        modules: moduleResults.length,
        concepts: moduleResults.reduce((sum, m) => sum + m.concepts.length, 0),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in generate-course function:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

async function generateComprehensiveCourse(
  topic: string,
  apiKey: string,
  skillLevel?: number
): Promise<CourseData> {
  // Determine skill level description
  let skillDescription = "absolute beginner (zero prior knowledge)";
  let moduleCount = "25-35";
  let depthDescription = "from absolute beginner to intermediate level";
  
  if (skillLevel !== undefined) {
    if (skillLevel < 0.3) {
      skillDescription = "complete beginner (zero prior knowledge)";
      moduleCount = "25-35";
      depthDescription = "from absolute beginner to intermediate level";
    } else if (skillLevel < 0.6) {
      skillDescription = "beginner with some basics (has heard of the topic but needs structured learning)";
      moduleCount = "20-30";
      depthDescription = "from basics to intermediate level, can skip very basic introductions";
    } else if (skillLevel < 0.8) {
      skillDescription = "intermediate learner (has studied this before but wants to strengthen understanding)";
      moduleCount = "15-25";
      depthDescription = "from intermediate to advanced level, can skip most basics";
    } else {
      skillDescription = "advanced learner (has extensive knowledge but wants comprehensive review and deeper insights)";
      moduleCount = "15-20";
      depthDescription = "advanced topics and mastery, can skip beginner content";
    }
  }

  const prompt = `You are an expert educator creating a comprehensive course about "${topic}".

The learner's skill level: ${skillDescription} (skill level: ${skillLevel !== undefined ? skillLevel.toFixed(2) : 'not specified'})

Your task is to create a complete, well-structured course that covers EVERYTHING this learner needs to know about this topic at their level. Break it down into digestible modules that build upon each other.

Return a JSON object with this exact structure:
{
  "title": "Complete Course Title",
  "description": "A comprehensive description of what this course covers",
  "goal": "What learners will be able to do after completing this course",
  "modules": [
    {
      "title": "Module Title",
      "description": "What this module covers",
      "concepts": [
        {
          "name": "Specific concept or subtopic name",
          "questions": [
            {
              "type": "multiple_choice",
              "question": "Clear, educational question",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correctAnswer": "Option A",
              "explanation": "Detailed explanation of why this is correct and what it teaches"
            }
          ]
        }
      ]
    }
  ]
}

CRITICAL REQUIREMENTS:
1. Create ${moduleCount} modules that comprehensively cover the topic ${depthDescription}
   - This should be a multi-day learning plan (approximately 2-5 weeks of daily learning depending on skill level)
   - Each module should represent roughly 1 day of focused learning (15-30 minutes)
   - Structure it as a progressive journey appropriate for the learner's level
   - ${skillLevel !== undefined && skillLevel >= 0.6 ? 'Skip very basic introductions and fundamentals - start where the learner is at.' : 'Start from the absolute basics and build up.'}
2. Each module should have 4-6 concepts that break down the topic into small, learnable pieces
3. Each concept should have 3-5 questions that test understanding
4. Start with fundamentals and basics, then progressively build complexity
5. Cover ALL important aspects, subtopics, and related concepts comprehensively
6. Make it beginner-friendly - assume zero prior knowledge
7. Questions should be educational, not just tests - they should teach through the options
8. QUESTION TYPE REQUIREMENTS:
   - 90% of questions MUST be "multiple_choice" with exactly 4 options
   - 10% can be "fill_blank" (use sparingly, only when fill-in-the-blank is pedagogically better)
   - For fill_blank questions, provide the correct answer as a string in "correctAnswer" field
   - For fill_blank, use "___" in the question text to indicate where the blank is
   - For multiple_choice, always provide exactly 4 options in the "options" array
9. Progress logically: Introduction → Fundamentals → Core Concepts → Applications → Advanced Topics → Mastery
10. ALL questions must have an "explanation" field that teaches why the answer is correct
11. Structure modules to build upon previous knowledge - each module should reference and reinforce concepts from earlier modules

Return ONLY valid JSON, no markdown formatting, no code blocks.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are an expert course designer. You create comprehensive, beginner-friendly educational courses. Always respond with valid JSON only, no markdown formatting, no code blocks, no explanations outside the JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 16000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const textContent = data.choices?.[0]?.message?.content;

    if (!textContent) {
      throw new Error("No content in OpenAI response");
    }

    // Parse JSON (handle potential markdown wrapping)
    let jsonStr = textContent.trim();
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.slice(7);
    }
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith("```")) {
      jsonStr = jsonStr.slice(0, -3);
    }

    const courseData: CourseData = JSON.parse(jsonStr.trim());

    // Validate structure
    if (!courseData.modules || !Array.isArray(courseData.modules)) {
      throw new Error("Invalid course structure: modules array missing");
    }

    // Ensure we have reasonable limits
    courseData.modules = courseData.modules.slice(0, MAX_MODULES);
    courseData.modules.forEach((module) => {
      if (module.concepts) {
        module.concepts = module.concepts.slice(0, MAX_CONCEPTS_PER_MODULE);
        module.concepts.forEach((concept) => {
          if (concept.questions) {
            concept.questions = concept.questions.slice(0, MAX_QUESTIONS_PER_CONCEPT);
          }
        });
      }
    });

    return courseData;
  } catch (error) {
    console.error("Error generating course with OpenAI:", error);
    throw error;
  }
}



