// Grading Module
// Utilities for grading different types of responses

export { gradeStructured, normalizeAnswer } from './structuredGrading.js';
export { gradeWithRubric, gradeErrorReversal } from './rubricGrading.js';

/**
 * Main grading function - routes to appropriate grader
 *
 * @param {Object} unit - The learning unit
 * @param {Object} response - User's response
 * @returns {Object} Grading result
 */
export async function gradeResponse(unit, response) {
  const { grading_spec, unit_type } = unit;

  // Route to appropriate grader based on type
  switch (grading_spec.type) {
    case 'mcq':
    case 'drill_set':
    case 'short_answer':
      const { gradeStructured } = await import('./structuredGrading.js');
      return gradeStructured(unit, response);

    case 'rubric':
      if (unit_type === 'error_reversal') {
        const { gradeErrorReversal } = await import('./rubricGrading.js');
        return gradeErrorReversal(unit, response);
      }
      const { gradeWithRubric } = await import('./rubricGrading.js');
      return gradeWithRubric(unit, response);

    default:
      // Default to rubric grading for unknown types
      const { gradeWithRubric: defaultGrader } = await import('./rubricGrading.js');
      return defaultGrader(unit, response);
  }
}
