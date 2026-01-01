import {
  P_MASTER,
  U_MAX,
  S_MIN,
  K_CONFIRMATIONS,
  MIN_UNIT_TYPES,
} from './constants.js';

/**
 * Check if a skill is MASTERED based on strict gating rules
 *
 * Mastery requires ALL of:
 * - mastery_p >= 0.90 (90% probability of reliable performance)
 * - uncertainty <= 0.25 (low uncertainty in estimate)
 * - stability >= 0.70 (consistent performance over time)
 * - confirmation_count >= 3 (multiple successful attempts)
 * - unit_types_used >= 2 (different question formats)
 * - has_applied_confirmation (at least one applied practice)
 * - no critical misconceptions
 *
 * @param {Object} state - Mastery state object
 * @param {string[]} criticalMisconceptions - List of critical misconception tags
 * @returns {Object} { isMastered: boolean, blockers: string[], progress: Object }
 */
export function checkMastery(state, criticalMisconceptions = []) {
  const {
    mastery_p = 0.5,
    uncertainty = 1.0,
    stability = 0.0,
    confirmation_count = 0,
    unit_types_used = [],
    has_applied_confirmation = false,
    misconception_tags = [],
  } = state;

  const blockers = [];

  // Check mastery probability
  if (mastery_p < P_MASTER) {
    const percent = Math.round(mastery_p * 100);
    blockers.push(`Mastery ${percent}% < 90% required`);
  }

  // Check uncertainty
  if (uncertainty > U_MAX) {
    blockers.push(`Need more practice to reduce uncertainty`);
  }

  // Check stability
  if (stability < S_MIN) {
    blockers.push(`Need more consistent performance`);
  }

  // Check confirmation count
  if (confirmation_count < K_CONFIRMATIONS) {
    blockers.push(`${confirmation_count}/${K_CONFIRMATIONS} confirmations`);
  }

  // Check unit types diversity
  const unitTypesCount = unit_types_used?.length || 0;
  if (unitTypesCount < MIN_UNIT_TYPES) {
    blockers.push(`Try ${MIN_UNIT_TYPES - unitTypesCount} more question types`);
  }

  // Check applied confirmation
  if (!has_applied_confirmation) {
    blockers.push(`Need applied practice`);
  }

  // Check for critical misconceptions
  const hasCritical = misconception_tags?.some((mc) =>
    criticalMisconceptions.includes(mc)
  );
  if (hasCritical) {
    blockers.push(`Clear misconceptions first`);
  }

  return {
    isMastered: blockers.length === 0,
    blockers,
    progress: {
      masteryP: mastery_p,
      masteryPercent: Math.round(mastery_p * 100),
      uncertainty,
      uncertaintyPercent: Math.round(uncertainty * 100),
      stability,
      stabilityPercent: Math.round(stability * 100),
      confirmations: confirmation_count,
      confirmationsRequired: K_CONFIRMATIONS,
      unitTypesUsed: unitTypesCount,
      unitTypesRequired: MIN_UNIT_TYPES,
      hasAppliedConfirmation: has_applied_confirmation,
      hasCriticalMisconception: hasCritical,
      misconceptionCount: misconception_tags?.length || 0,
    },
  };
}

/**
 * Check if prerequisites are met for a skill node
 *
 * @param {string} nodeId - The node to check
 * @param {string[]} prerequisites - Array of prerequisite node IDs
 * @param {Set<string>} masteredNodes - Set of mastered node IDs
 * @returns {Object} { canStart: boolean, unmetPrereqs: string[] }
 */
export function checkPrerequisites(nodeId, prerequisites, masteredNodes) {
  if (!prerequisites || prerequisites.length === 0) {
    return { canStart: true, unmetPrereqs: [] };
  }

  const unmetPrereqs = prerequisites.filter((prereq) => !masteredNodes.has(prereq));

  return {
    canStart: unmetPrereqs.length === 0,
    unmetPrereqs,
  };
}

/**
 * Get the mastery band for display purposes
 * Used for coloring nodes in the constellation view
 *
 * @param {number} masteryP - Mastery probability [0,1]
 * @returns {string} 'novice' | 'developing' | 'proficient' | 'mastered'
 */
export function getMasteryBand(masteryP, isMastered = false) {
  if (isMastered) return 'mastered';
  if (masteryP >= 0.80) return 'proficient';
  if (masteryP >= 0.50) return 'developing';
  return 'novice';
}

/**
 * Get the color for a mastery band
 * Used for constellation visualization
 *
 * @param {string} band - Mastery band
 * @returns {string} Hex color code
 */
export function getMasteryColor(band) {
  const colors = {
    novice: '#6B7280',      // Gray
    developing: '#F59E0B',  // Amber
    proficient: '#3B82F6',  // Blue
    mastered: '#10B981',    // Green
    locked: '#374151',      // Dark gray (for locked nodes)
  };
  return colors[band] || colors.novice;
}

/**
 * Calculate overall progress for a thread
 * @param {Object[]} masteryStates - Array of mastery states
 * @returns {Object} Thread progress summary
 */
export function calculateThreadProgress(masteryStates) {
  if (!masteryStates || masteryStates.length === 0) {
    return {
      totalNodes: 0,
      masteredNodes: 0,
      inProgressNodes: 0,
      lockedNodes: 0,
      overallProgress: 0,
      avgMastery: 0,
    };
  }

  let masteredCount = 0;
  let inProgressCount = 0;
  let lockedCount = 0;
  let totalMastery = 0;

  for (const state of masteryStates) {
    const { isMastered } = checkMastery(state);
    totalMastery += state.mastery_p || 0;

    if (isMastered) {
      masteredCount++;
    } else if (state.evidence_count > 0) {
      inProgressCount++;
    } else {
      lockedCount++;
    }
  }

  return {
    totalNodes: masteryStates.length,
    masteredNodes: masteredCount,
    inProgressNodes: inProgressCount,
    lockedNodes: lockedCount,
    overallProgress: Math.round((masteredCount / masteryStates.length) * 100),
    avgMastery: Math.round((totalMastery / masteryStates.length) * 100),
  };
}

export default checkMastery;
