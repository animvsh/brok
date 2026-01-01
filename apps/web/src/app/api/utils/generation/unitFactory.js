import OpenAI from 'openai';
import { FORMAT_STRENGTHS } from '../mastery/constants.js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Generate a learning unit of the specified type
 *
 * @param {Object} skillNode - The skill node to generate for
 * @param {string} unitType - Type of unit to generate
 * @param {Object} masteryState - Current mastery state
 * @param {Object} options - Additional options
 * @returns {Object} Generated unit
 */
export async function generateUnit(skillNode, unitType, masteryState, options = {}) {
  // Calculate difficulty based on mastery
  const difficulty = calculateDifficulty(masteryState);

  const generators = {
    diagnostic_mcq: generateDiagnosticMCQ,
    micro_teach_then_check: generateMicroTeach,
    drill_set: generateDrillSet,
    applied_free_response: generateAppliedFreeResponse,
    error_reversal: generateErrorReversal,
  };

  const generator = generators[unitType];
  if (!generator) {
    throw new Error(`Unknown unit type: ${unitType}`);
  }

  const content = await generator(skillNode, difficulty, masteryState, options);

  return {
    node_id: skillNode.id || skillNode.node_id,
    unit_type: unitType,
    difficulty,
    content,
    grading_spec: content.grading_spec,
    format_strength: FORMAT_STRENGTHS[unitType],
    estimated_time_seconds: getEstimatedTime(unitType),
  };
}

/**
 * Calculate appropriate difficulty based on mastery state
 */
function calculateDifficulty(masteryState) {
  const { mastery_p = 0.5, uncertainty = 1.0 } = masteryState || {};

  // Start easier, scale with mastery
  let difficulty = 0.3 + mastery_p * 0.5;

  // If high uncertainty, use medium difficulty to calibrate
  if (uncertainty > 0.6) {
    difficulty = 0.5;
  }

  return Math.min(0.9, Math.max(0.2, difficulty));
}

/**
 * Get estimated time for unit type
 */
function getEstimatedTime(unitType) {
  const times = {
    diagnostic_mcq: 60,
    micro_teach_then_check: 180,
    drill_set: 240,
    applied_free_response: 300,
    error_reversal: 120,
  };
  return times[unitType] || 120;
}

/**
 * Generate a diagnostic MCQ unit
 */
async function generateDiagnosticMCQ(skillNode, difficulty, masteryState, options) {
  if (!OPENAI_API_KEY) {
    return generateFallbackMCQ(skillNode, difficulty);
  }

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  const misconceptions = skillNode.misconceptions_library || [];

  const prompt = `Create a diagnostic multiple choice question for the skill: "${skillNode.name}"

Description: ${skillNode.description || skillNode.name}
Difficulty: ${difficulty} (0=easy, 1=hard)
${misconceptions.length > 0 ? `Known misconceptions: ${JSON.stringify(misconceptions)}` : ''}

Return JSON:
{
  "question": "Clear question text",
  "options": ["A) Option A", "B) Option B", "C) Option C", "D) Option D"],
  "correctIndex": 0,
  "distractorMisconceptions": { "1": "mc_tag", "2": "mc_tag" },
  "explanation": "Why the correct answer is correct and common mistakes"
}

Make distractors reflect common misconceptions. Each wrong answer should target a specific mistake.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert educational content creator.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = JSON.parse(response.choices[0].message.content);
    return {
      ...content,
      grading_spec: {
        type: 'mcq',
        correctIndex: content.correctIndex,
        distractorMisconceptions: content.distractorMisconceptions,
      },
    };
  } catch (error) {
    console.error('MCQ generation error:', error);
    return generateFallbackMCQ(skillNode, difficulty);
  }
}

/**
 * Generate a micro-teach-then-check unit
 */
async function generateMicroTeach(skillNode, difficulty, masteryState, options) {
  if (!OPENAI_API_KEY) {
    return generateFallbackMicroTeach(skillNode, difficulty);
  }

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  const prompt = `Create a micro-teaching unit for the skill: "${skillNode.name}"

Description: ${skillNode.description || skillNode.name}
Difficulty: ${difficulty}

Return JSON:
{
  "explanation": {
    "content": "2-3 paragraph clear explanation with examples",
    "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
    "examples": [
      {"input": "Example input", "output": "Example output", "explanation": "Why"}
    ]
  },
  "checkQuestion": {
    "question": "A question to verify understanding",
    "type": "short_answer",
    "expectedAnswer": "The expected answer",
    "acceptableVariations": ["variation1", "variation2"],
    "rubric": [
      {"criterion": "correctness", "weight": 0.7, "description": "Is the answer correct?"},
      {"criterion": "understanding", "weight": 0.3, "description": "Shows understanding?"}
    ]
  }
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert teacher creating concise, effective lessons.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = JSON.parse(response.choices[0].message.content);
    return {
      ...content,
      grading_spec: {
        type: 'short_answer',
        expectedAnswer: content.checkQuestion.expectedAnswer,
        acceptableVariations: content.checkQuestion.acceptableVariations,
        rubric: content.checkQuestion.rubric,
      },
    };
  } catch (error) {
    console.error('Micro-teach generation error:', error);
    return generateFallbackMicroTeach(skillNode, difficulty);
  }
}

/**
 * Generate a drill set unit
 */
async function generateDrillSet(skillNode, difficulty, masteryState, options) {
  if (!OPENAI_API_KEY) {
    return generateFallbackDrillSet(skillNode, difficulty);
  }

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  const prompt = `Create a drill set (3-5 practice items) for the skill: "${skillNode.name}"

Description: ${skillNode.description || skillNode.name}
Difficulty: ${difficulty}

Return JSON:
{
  "items": [
    {
      "question": "Question text",
      "type": "fill_blank | short_answer | multiple_choice",
      "answer": "correct answer",
      "options": ["A", "B", "C", "D"],  // only for multiple_choice
      "partialCredit": { "partial_answer": 0.5 }  // optional
    }
  ],
  "timeLimit": 180
}

Mix question types for variety. Include 3-5 items.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert creating practice exercises.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });

    const content = JSON.parse(response.choices[0].message.content);
    return {
      ...content,
      grading_spec: {
        type: 'drill_set',
        items: content.items.map((item) => ({
          type: item.type,
          answer: item.answer,
          options: item.options,
          partialCredit: item.partialCredit,
        })),
      },
    };
  } catch (error) {
    console.error('Drill set generation error:', error);
    return generateFallbackDrillSet(skillNode, difficulty);
  }
}

/**
 * Generate an applied free-response unit
 */
async function generateAppliedFreeResponse(skillNode, difficulty, masteryState, options) {
  if (!OPENAI_API_KEY) {
    return generateFallbackApplied(skillNode, difficulty);
  }

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  const prompt = `Create an applied practice scenario for the skill: "${skillNode.name}"

Description: ${skillNode.description || skillNode.name}
Difficulty: ${difficulty}

This should be a realistic scenario where the learner applies the skill.

Return JSON:
{
  "scenario": "A realistic scenario description (2-3 sentences)",
  "prompt": "What the learner needs to do/answer",
  "rubric": [
    {"criterion": "correctness", "weight": 0.5, "levels": [
      {"score": 0, "description": "Incorrect or missing"},
      {"score": 0.5, "description": "Partially correct"},
      {"score": 1, "description": "Fully correct"}
    ]},
    {"criterion": "reasoning", "weight": 0.3, "levels": [...]},
    {"criterion": "clarity", "weight": 0.2, "levels": [...]}
  ],
  "sampleSolution": "A model answer for reference",
  "hints": ["Hint 1", "Hint 2", "Hint 3"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert creating real-world application exercises.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });

    const content = JSON.parse(response.choices[0].message.content);
    return {
      ...content,
      grading_spec: {
        type: 'rubric',
        rubric: content.rubric,
        sampleSolution: content.sampleSolution,
      },
    };
  } catch (error) {
    console.error('Applied generation error:', error);
    return generateFallbackApplied(skillNode, difficulty);
  }
}

/**
 * Generate an error reversal unit
 */
async function generateErrorReversal(skillNode, difficulty, masteryState, options) {
  const misconceptions = masteryState?.misconception_tags || [];
  const targetMisconception = misconceptions[0] || 'common_error';

  if (!OPENAI_API_KEY) {
    return generateFallbackErrorReversal(skillNode, targetMisconception);
  }

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  const prompt = `Create an error reversal exercise for the skill: "${skillNode.name}"

Target misconception: ${targetMisconception}
Description: ${skillNode.description || skillNode.name}

The learner needs to explain why a wrong answer is wrong.

Return JSON:
{
  "wrongAnswer": "A plausible but incorrect answer/solution",
  "targetMisconception": "${targetMisconception}",
  "context": "The question/problem that was asked",
  "prompt": "Why is this answer incorrect? Explain the mistake.",
  "expectedExplanation": "The correct explanation of why it's wrong",
  "rubric": [
    {"criterion": "identifies_error", "weight": 0.4, "levels": [...]},
    {"criterion": "explains_why", "weight": 0.4, "levels": [...]},
    {"criterion": "suggests_correct", "weight": 0.2, "levels": [...]}
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert at diagnosing and correcting learning mistakes.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = JSON.parse(response.choices[0].message.content);
    return {
      ...content,
      grading_spec: {
        type: 'rubric',
        rubric: content.rubric,
        expectedExplanation: content.expectedExplanation,
        targetMisconception: content.targetMisconception,
      },
    };
  } catch (error) {
    console.error('Error reversal generation error:', error);
    return generateFallbackErrorReversal(skillNode, targetMisconception);
  }
}

// Fallback generators for when OpenAI is unavailable

function generateFallbackMCQ(skillNode, difficulty) {
  return {
    question: `Which of the following best describes ${skillNode.name}?`,
    options: [
      `A) The correct understanding of ${skillNode.name}`,
      `B) A common misconception about ${skillNode.name}`,
      `C) An unrelated concept`,
      `D) Another misconception`,
    ],
    correctIndex: 0,
    distractorMisconceptions: { 1: 'general_misconception', 3: 'general_misconception' },
    explanation: `The correct answer demonstrates understanding of ${skillNode.name}.`,
    grading_spec: {
      type: 'mcq',
      correctIndex: 0,
      distractorMisconceptions: { 1: 'general_misconception', 3: 'general_misconception' },
    },
  };
}

function generateFallbackMicroTeach(skillNode, difficulty) {
  return {
    explanation: {
      content: `${skillNode.name} is an important concept to understand. It involves applying specific principles to achieve desired outcomes.`,
      keyPoints: [
        `Understanding the basics of ${skillNode.name}`,
        `Common applications`,
        `Best practices`,
      ],
      examples: [
        { input: 'Example scenario', output: 'Expected result', explanation: 'How it works' },
      ],
    },
    checkQuestion: {
      question: `In your own words, explain the key principle behind ${skillNode.name}.`,
      type: 'short_answer',
      expectedAnswer: `A clear explanation of ${skillNode.name}`,
      acceptableVariations: [],
      rubric: [
        { criterion: 'correctness', weight: 0.7, description: 'Is the answer correct?' },
        { criterion: 'understanding', weight: 0.3, description: 'Shows understanding?' },
      ],
    },
    grading_spec: {
      type: 'short_answer',
      expectedAnswer: `A clear explanation of ${skillNode.name}`,
      acceptableVariations: [],
      rubric: [
        { criterion: 'correctness', weight: 0.7, description: 'Is the answer correct?' },
        { criterion: 'understanding', weight: 0.3, description: 'Shows understanding?' },
      ],
    },
  };
}

function generateFallbackDrillSet(skillNode, difficulty) {
  return {
    items: [
      {
        question: `What is ${skillNode.name}?`,
        type: 'short_answer',
        answer: skillNode.name,
      },
      {
        question: `True or False: ${skillNode.name} is important for learning.`,
        type: 'multiple_choice',
        options: ['True', 'False'],
        answer: 'True',
      },
      {
        question: `Apply ${skillNode.name} to solve: [example problem]`,
        type: 'short_answer',
        answer: 'Expected solution',
      },
    ],
    timeLimit: 180,
    grading_spec: {
      type: 'drill_set',
      items: [
        { type: 'short_answer', answer: skillNode.name },
        { type: 'multiple_choice', answer: 'True', options: ['True', 'False'] },
        { type: 'short_answer', answer: 'Expected solution' },
      ],
    },
  };
}

function generateFallbackApplied(skillNode, difficulty) {
  return {
    scenario: `You are working on a project that requires applying ${skillNode.name}.`,
    prompt: `Describe how you would apply ${skillNode.name} in this situation.`,
    rubric: [
      {
        criterion: 'correctness',
        weight: 0.5,
        levels: [
          { score: 0, description: 'Incorrect' },
          { score: 0.5, description: 'Partially correct' },
          { score: 1, description: 'Fully correct' },
        ],
      },
      {
        criterion: 'reasoning',
        weight: 0.3,
        levels: [
          { score: 0, description: 'No reasoning' },
          { score: 0.5, description: 'Some reasoning' },
          { score: 1, description: 'Clear reasoning' },
        ],
      },
      {
        criterion: 'clarity',
        weight: 0.2,
        levels: [
          { score: 0, description: 'Unclear' },
          { score: 1, description: 'Clear' },
        ],
      },
    ],
    sampleSolution: `A clear application of ${skillNode.name} to solve the problem.`,
    hints: ['Consider the key principles', 'Think about common applications', 'Check your work'],
    grading_spec: {
      type: 'rubric',
      rubric: [
        { criterion: 'correctness', weight: 0.5 },
        { criterion: 'reasoning', weight: 0.3 },
        { criterion: 'clarity', weight: 0.2 },
      ],
      sampleSolution: `A clear application of ${skillNode.name} to solve the problem.`,
    },
  };
}

function generateFallbackErrorReversal(skillNode, targetMisconception) {
  return {
    wrongAnswer: `An incorrect application of ${skillNode.name}`,
    targetMisconception,
    context: `A problem involving ${skillNode.name}`,
    prompt: 'Why is this answer incorrect? Explain the mistake.',
    expectedExplanation: `The mistake is misunderstanding ${skillNode.name}. The correct approach is...`,
    rubric: [
      { criterion: 'identifies_error', weight: 0.4 },
      { criterion: 'explains_why', weight: 0.4 },
      { criterion: 'suggests_correct', weight: 0.2 },
    ],
    grading_spec: {
      type: 'rubric',
      rubric: [
        { criterion: 'identifies_error', weight: 0.4 },
        { criterion: 'explains_why', weight: 0.4 },
        { criterion: 'suggests_correct', weight: 0.2 },
      ],
      expectedExplanation: `The mistake is misunderstanding ${skillNode.name}. The correct approach is...`,
      targetMisconception,
    },
  };
}

export default generateUnit;
