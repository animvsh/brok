/**
 * Structured Grading Module
 * Handles grading for MCQ, drill sets, and other structured question types
 */

/**
 * Grade a response based on the unit type and grading spec
 *
 * @param {Object} unit - The learning unit
 * @param {Object} response - User's response
 * @returns {Object} Grading result
 */
export function gradeStructured(unit, response) {
  const { grading_spec } = unit;

  switch (grading_spec.type) {
    case 'mcq':
      return gradeMCQ(grading_spec, response);
    case 'drill_set':
      return gradeDrillSet(grading_spec, response);
    case 'short_answer':
      return gradeShortAnswer(grading_spec, response);
    default:
      throw new Error(`Unknown structured grading type: ${grading_spec.type}`);
  }
}

/**
 * Grade a multiple choice question
 */
function gradeMCQ(spec, response) {
  const { selectedIndex } = response;
  const correct = selectedIndex === spec.correctIndex;

  // Check for misconceptions in wrong answers
  const misconceptionsDetected = [];
  if (!correct && spec.distractorMisconceptions) {
    const misconception = spec.distractorMisconceptions[selectedIndex];
    if (misconception) {
      misconceptionsDetected.push(misconception);
    }
  }

  return {
    score: correct ? 1.0 : 0.0,
    partial_scores: {},
    correct,
    misconceptions_detected: misconceptionsDetected,
    feedback: correct
      ? 'Correct!'
      : spec.distractorFeedback?.[selectedIndex] ||
        `Incorrect. The correct answer was option ${spec.correctIndex + 1}.`,
  };
}

/**
 * Grade a drill set (multiple items)
 */
function gradeDrillSet(spec, response) {
  const { answers } = response;
  const items = spec.items || [];

  let totalScore = 0;
  const partialScores = {};
  const misconceptionsDetected = [];
  const itemResults = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const answer = answers?.[i];

    const result = gradeItem(item, answer);
    partialScores[i] = result.score;
    totalScore += result.score;

    if (result.misconception) {
      misconceptionsDetected.push(result.misconception);
    }

    itemResults.push({
      index: i,
      correct: result.score >= 0.8,
      score: result.score,
      feedback: result.feedback,
    });
  }

  const averageScore = items.length > 0 ? totalScore / items.length : 0;

  return {
    score: averageScore,
    partial_scores: partialScores,
    item_results: itemResults,
    correct_count: itemResults.filter((r) => r.correct).length,
    total_count: items.length,
    misconceptions_detected: [...new Set(misconceptionsDetected)],
    feedback: generateDrillFeedback(averageScore, itemResults),
  };
}

/**
 * Grade a single drill item
 */
function gradeItem(item, answer) {
  if (answer === undefined || answer === null || answer === '') {
    return { score: 0, feedback: 'No answer provided', misconception: null };
  }

  switch (item.type) {
    case 'multiple_choice':
      return gradeMCQItem(item, answer);
    case 'fill_blank':
    case 'short_answer':
      return gradeTextItem(item, answer);
    default:
      return gradeTextItem(item, answer);
  }
}

/**
 * Grade a MCQ item within a drill set
 */
function gradeMCQItem(item, answer) {
  // Answer could be an index or the actual text
  let isCorrect = false;

  if (typeof answer === 'number') {
    isCorrect = item.options?.[answer] === item.answer;
  } else {
    isCorrect = normalizeAnswer(answer) === normalizeAnswer(item.answer);
  }

  return {
    score: isCorrect ? 1.0 : 0.0,
    feedback: isCorrect ? 'Correct!' : `The correct answer was: ${item.answer}`,
    misconception: isCorrect ? null : item.misconception,
  };
}

/**
 * Grade a text-based item (fill in blank, short answer)
 */
function gradeTextItem(item, answer) {
  const normalizedAnswer = normalizeAnswer(answer);
  const normalizedExpected = normalizeAnswer(item.answer);

  // Exact match
  if (normalizedAnswer === normalizedExpected) {
    return { score: 1.0, feedback: 'Correct!', misconception: null };
  }

  // Check for partial credit
  if (item.partialCredit) {
    for (const [partialAnswer, credit] of Object.entries(item.partialCredit)) {
      if (normalizedAnswer === normalizeAnswer(partialAnswer)) {
        return {
          score: credit,
          feedback: `Partially correct. The expected answer was: ${item.answer}`,
          misconception: null,
        };
      }
    }
  }

  // Check for acceptable variations
  if (item.acceptableVariations) {
    for (const variation of item.acceptableVariations) {
      if (normalizedAnswer === normalizeAnswer(variation)) {
        return { score: 1.0, feedback: 'Correct!', misconception: null };
      }
    }
  }

  // Fuzzy match for close answers (Levenshtein distance)
  const similarity = calculateSimilarity(normalizedAnswer, normalizedExpected);
  if (similarity > 0.8) {
    return {
      score: 0.8,
      feedback: `Close! The expected answer was: ${item.answer}`,
      misconception: null,
    };
  }

  return {
    score: 0.0,
    feedback: `Incorrect. The expected answer was: ${item.answer}`,
    misconception: item.misconception,
  };
}

/**
 * Grade a short answer question
 */
function gradeShortAnswer(spec, response) {
  const { text } = response;
  const normalizedResponse = normalizeAnswer(text);
  const normalizedExpected = normalizeAnswer(spec.expectedAnswer);

  // Exact match
  if (normalizedResponse === normalizedExpected) {
    return {
      score: 1.0,
      correct: true,
      misconceptions_detected: [],
      feedback: 'Correct!',
    };
  }

  // Check acceptable variations
  if (spec.acceptableVariations) {
    for (const variation of spec.acceptableVariations) {
      if (normalizedResponse === normalizeAnswer(variation)) {
        return {
          score: 1.0,
          correct: true,
          misconceptions_detected: [],
          feedback: 'Correct!',
        };
      }
    }
  }

  // Fuzzy match
  const similarity = calculateSimilarity(normalizedResponse, normalizedExpected);
  if (similarity > 0.8) {
    return {
      score: 0.8,
      correct: false,
      misconceptions_detected: [],
      feedback: `Close! The expected answer was: ${spec.expectedAnswer}`,
    };
  }

  return {
    score: 0.0,
    correct: false,
    misconceptions_detected: [],
    feedback: `The expected answer was: ${spec.expectedAnswer}`,
  };
}

/**
 * Normalize an answer for comparison
 */
export function normalizeAnswer(answer) {
  if (answer === null || answer === undefined) return '';
  return String(answer)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Calculate similarity between two strings (simple Levenshtein-based)
 */
function calculateSimilarity(str1, str2) {
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;

  const maxLen = Math.max(str1.length, str2.length);
  const distance = levenshteinDistance(str1, str2);

  return 1 - distance / maxLen;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(dp[i - 1][j - 1] + 1, dp[i - 1][j] + 1, dp[i][j - 1] + 1);
      }
    }
  }

  return dp[m][n];
}

/**
 * Generate feedback for a drill set
 */
function generateDrillFeedback(score, itemResults) {
  const correctCount = itemResults.filter((r) => r.correct).length;
  const totalCount = itemResults.length;

  if (score >= 0.9) {
    return `Excellent! You got ${correctCount}/${totalCount} correct.`;
  } else if (score >= 0.7) {
    return `Good job! You got ${correctCount}/${totalCount} correct. Review the ones you missed.`;
  } else if (score >= 0.5) {
    return `You got ${correctCount}/${totalCount} correct. More practice needed.`;
  } else {
    return `You got ${correctCount}/${totalCount} correct. Let's review the concepts.`;
  }
}

export default gradeStructured;
