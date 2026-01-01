import { LR_BASE, U_DECAY, STABILITY_ALPHA, PASS_SCORE } from './constants.js';

/**
 * Calculate evidence strength from attempt data
 * E = format_strength * (0.5 + 0.5 * difficulty)
 * Penalized by hints/retries, boosted by applied reasoning
 */
export function calculateEvidenceStrength(evidence) {
  const { formatStrength, difficulty, hintCount = 0, retryCount = 0 } = evidence;

  // Base evidence strength
  let E = formatStrength * (0.5 + 0.5 * difficulty);

  // Penalize for hints (reduce by 10% per hint, max 50% reduction)
  const hintPenalty = Math.min(0.5, hintCount * 0.1);
  E *= (1 - hintPenalty);

  // Penalize for retries (reduce by 15% per retry, max 45% reduction)
  const retryPenalty = Math.min(0.45, retryCount * 0.15);
  E *= (1 - retryPenalty);

  return Math.max(0.1, E); // Minimum evidence strength of 0.1
}

/**
 * Update mastery state using logit-space updates
 * This is the core mastery update algorithm from the spec
 *
 * @param {Object} currentState - Current mastery state
 * @param {Object} evidence - Evidence from the attempt
 * @returns {Object} Updated mastery values
 */
export function updateMastery(currentState, evidence) {
  const {
    mastery_p = 0.5,
    uncertainty = 1.0,
    stability = 0.0,
    misconception_tags = [],
  } = currentState;

  const {
    score,
    formatStrength,
    difficulty,
    misconceptionsDetected = [],
    hintCount = 0,
    retryCount = 0,
  } = evidence;

  // Calculate evidence strength
  const E = calculateEvidenceStrength({
    formatStrength,
    difficulty,
    hintCount,
    retryCount,
  });

  // Learning rate: higher uncertainty = bigger learning steps
  const lr = LR_BASE * E * (0.5 + 0.5 * uncertainty);

  // --- Logit-space update for mastery ---
  // Clamp to avoid log(0) or log(1)
  const clampedP = Math.max(0.001, Math.min(0.999, mastery_p));

  // Transform to logit space: z = log(p / (1-p))
  const z = Math.log(clampedP / (1 - clampedP));

  // Target: map score [0,1] to [-1,1]
  const target = 2 * score - 1;

  // Update in logit space
  const z_new = z + lr * target;

  // Transform back: p = sigmoid(z) = 1 / (1 + exp(-z))
  let newMasteryP = 1 / (1 + Math.exp(-z_new));

  // --- Misconception penalty ---
  // If misconceptions detected, cap mastery at 0.75
  if (misconceptionsDetected.length > 0) {
    newMasteryP = Math.min(newMasteryP, 0.75);
  }

  // --- Uncertainty update ---
  // Uncertainty decays with evidence
  const newUncertainty = Math.max(0, uncertainty - U_DECAY * E);

  // --- Stability update (EMA) ---
  // Pass = score >= 0.85 AND no misconceptions
  const passed = score >= PASS_SCORE && misconceptionsDetected.length === 0;
  const newStability = passed
    ? STABILITY_ALPHA + (1 - STABILITY_ALPHA) * stability
    : (1 - STABILITY_ALPHA) * stability;

  // --- Misconception tag management ---
  let newMisconceptionTags = [...misconception_tags];

  // Add newly detected misconceptions
  for (const mc of misconceptionsDetected) {
    if (!newMisconceptionTags.includes(mc)) {
      newMisconceptionTags.push(mc);
    }
  }

  // Clear misconceptions on strong pass (score >= 0.9)
  if (score >= 0.9 && misconceptionsDetected.length === 0) {
    // Remove misconceptions that weren't just detected
    newMisconceptionTags = [];
  }

  return {
    newMasteryP: Math.round(newMasteryP * 10000) / 10000,
    newUncertainty: Math.round(newUncertainty * 10000) / 10000,
    newStability: Math.round(newStability * 10000) / 10000,
    newMisconceptionTags,
    evidenceStrength: E,
  };
}

/**
 * Calculate decay risk for a skill that hasn't been practiced recently
 * Used in frontier selection to prioritize skills at risk of decay
 */
export function calculateDecayRisk(state) {
  const { last_evidence_at, decay_rate = 0.01, mastery_p = 0.5 } = state;

  if (!last_evidence_at) {
    return 0; // No evidence yet, no decay risk
  }

  const daysSinceEvidence =
    (Date.now() - new Date(last_evidence_at).getTime()) / (1000 * 60 * 60 * 24);

  // Decay risk increases with time and mastery level
  // Higher mastery = more to lose
  const risk = mastery_p * decay_rate * Math.log(1 + daysSinceEvidence);

  return Math.min(1, Math.max(0, risk));
}

export default updateMastery;
