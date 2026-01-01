import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Rubric-based Grading Module
 * Handles grading for free-response questions using AI + rubrics
 */

/**
 * Grade a free-response answer using a rubric
 * Uses dual-pass grading for consistency
 *
 * @param {Object} unit - The learning unit
 * @param {Object} response - User's response
 * @returns {Object} Grading result
 */
export async function gradeWithRubric(unit, response) {
  const { grading_spec, content } = unit;

  if (!OPENAI_API_KEY) {
    return gradeFallbackRubric(unit, response);
  }

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  // First pass grading
  const firstPass = await runGradingPass(unit, response, openai, null);

  // Second pass grading (stricter, with first pass context)
  const secondPass = await runGradingPass(unit, response, openai, firstPass);

  // Reconcile the two passes
  const reconciled = reconcilePasses(firstPass, secondPass, grading_spec.rubric);

  return reconciled;
}

/**
 * Run a single grading pass
 */
async function runGradingPass(unit, response, openai, previousPass) {
  const { grading_spec, content } = unit;
  const rubric = grading_spec.rubric;

  const systemPrompt = `You are an expert educational grader. Grade student responses fairly but thoroughly.

${previousPass ? 'This is a verification pass. Review your previous grading and adjust if needed.' : 'This is the initial grading pass.'}

Important:
- Be consistent across criteria
- Justify each score
- Detect any misconceptions in the response
- Provide constructive feedback`;

  const userPrompt = `
SKILL: ${unit.node_id || 'Unknown'}

QUESTION/PROMPT:
${content.scenario || content.prompt || content.context || 'Apply the skill'}

${content.prompt ? `SPECIFIC TASK:\n${content.prompt}` : ''}

STUDENT RESPONSE:
${response.text || response.answer || JSON.stringify(response)}

RUBRIC:
${JSON.stringify(rubric, null, 2)}

${grading_spec.sampleSolution ? `REFERENCE SOLUTION:\n${grading_spec.sampleSolution}` : ''}

${previousPass ? `PREVIOUS GRADING:\n${JSON.stringify(previousPass, null, 2)}\n\nReview and verify or adjust.` : ''}

Return JSON:
{
  "criteria_scores": [
    {"criterion": "name", "score": 0-1, "justification": "why this score"}
  ],
  "overall_score": 0-1,
  "misconceptions_detected": ["tag1", "tag2"],
  "feedback": "Constructive feedback for the student",
  "strengths": ["what they did well"],
  "improvements": ["what to improve"]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: previousPass ? 0.2 : 0.3, // Lower temp for verification pass
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error('Rubric grading error:', error);
    return gradeFallbackRubric(unit, response);
  }
}

/**
 * Reconcile two grading passes
 * If there's high variance, use the stricter (lower) score
 */
function reconcilePasses(firstPass, secondPass, rubric) {
  const criteriaScores = {};
  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const criterion of rubric) {
    const name = criterion.criterion;
    const weight = criterion.weight || 1;

    const firstScore = firstPass.criteria_scores?.find((c) => c.criterion === name)?.score || 0;
    const secondScore = secondPass.criteria_scores?.find((c) => c.criterion === name)?.score || 0;

    // If variance is high (>0.2), use the stricter score
    const variance = Math.abs(firstScore - secondScore);
    const finalScore = variance > 0.2 ? Math.min(firstScore, secondScore) : (firstScore + secondScore) / 2;

    criteriaScores[name] = Math.round(finalScore * 100) / 100;
    totalWeightedScore += finalScore * weight;
    totalWeight += weight;
  }

  const overallScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

  // Combine misconceptions from both passes
  const misconceptions = [
    ...(firstPass.misconceptions_detected || []),
    ...(secondPass.misconceptions_detected || []),
  ];
  const uniqueMisconceptions = [...new Set(misconceptions)];

  // Use feedback from second pass (more refined)
  const feedback = secondPass.feedback || firstPass.feedback;
  const strengths = secondPass.strengths || firstPass.strengths || [];
  const improvements = secondPass.improvements || firstPass.improvements || [];

  return {
    score: Math.round(overallScore * 100) / 100,
    criteria_scores: criteriaScores,
    misconceptions_detected: uniqueMisconceptions,
    feedback,
    strengths,
    improvements,
    grading_metadata: {
      first_pass_score: firstPass.overall_score,
      second_pass_score: secondPass.overall_score,
      reconciled: true,
    },
  };
}

/**
 * Fallback rubric grading without AI
 * Uses simple heuristics
 */
function gradeFallbackRubric(unit, response) {
  const { grading_spec, content } = unit;
  const rubric = grading_spec.rubric || [];
  const responseText = response.text || response.answer || '';

  // Simple heuristics for grading
  const wordCount = responseText.split(/\s+/).filter((w) => w.length > 0).length;
  const hasContent = wordCount > 10;
  const isSubstantial = wordCount > 50;

  // Check for keywords from sample solution
  const sampleSolution = grading_spec.sampleSolution || '';
  const sampleKeywords = sampleSolution
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 4);
  const responseWords = responseText.toLowerCase().split(/\s+/);
  const keywordMatches = sampleKeywords.filter((k) => responseWords.includes(k)).length;
  const keywordScore = sampleKeywords.length > 0 ? keywordMatches / sampleKeywords.length : 0.5;

  // Generate criterion scores
  const criteriaScores = {};
  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const criterion of rubric) {
    const name = criterion.criterion;
    const weight = criterion.weight || 1;

    let score = 0.5; // Default middle score

    if (name.includes('correct')) {
      score = Math.min(0.8, keywordScore + 0.2);
    } else if (name.includes('reason') || name.includes('explain')) {
      score = isSubstantial ? 0.7 : hasContent ? 0.4 : 0.1;
    } else if (name.includes('clarity') || name.includes('clear')) {
      score = hasContent ? 0.6 : 0.2;
    } else {
      score = hasContent ? 0.5 : 0.2;
    }

    criteriaScores[name] = Math.round(score * 100) / 100;
    totalWeightedScore += score * weight;
    totalWeight += weight;
  }

  const overallScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

  return {
    score: Math.round(overallScore * 100) / 100,
    criteria_scores: criteriaScores,
    misconceptions_detected: [],
    feedback: generateFallbackFeedback(overallScore, hasContent, isSubstantial),
    strengths: hasContent ? ['Provided a response'] : [],
    improvements: isSubstantial ? [] : ['Add more detail to your response'],
    grading_metadata: {
      fallback: true,
      word_count: wordCount,
      keyword_score: keywordScore,
    },
  };
}

/**
 * Generate feedback for fallback grading
 */
function generateFallbackFeedback(score, hasContent, isSubstantial) {
  if (!hasContent) {
    return 'Please provide a more complete response.';
  }

  if (score >= 0.7) {
    return 'Good response! You demonstrated understanding of the concept.';
  } else if (score >= 0.5) {
    return 'Your response shows some understanding, but could be more complete.';
  } else {
    return 'Review the concept and try to provide a more detailed explanation.';
  }
}

/**
 * Grade an error reversal response
 * Special handling for misconception correction
 */
export async function gradeErrorReversal(unit, response) {
  const result = await gradeWithRubric(unit, response);
  const { grading_spec } = unit;

  // Check if misconception was successfully addressed
  const targetMisconception = grading_spec.targetMisconception;
  const misconceptionResolved = result.score >= 0.7;

  return {
    ...result,
    misconception_targeted: targetMisconception,
    misconception_resolved: misconceptionResolved,
    feedback: misconceptionResolved
      ? `Great job explaining the error! You've cleared up the misconception about ${targetMisconception}.`
      : `Good attempt, but let's review why this is incorrect. ${result.feedback}`,
  };
}

export default gradeWithRubric;
