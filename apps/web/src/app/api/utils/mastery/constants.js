// Mastery Gating Constants
// These define when a skill is considered "mastered"

// Mastery probability threshold (90%)
export const P_MASTER = 0.90;

// Maximum uncertainty allowed for mastery (25%)
export const U_MAX = 0.25;

// Minimum stability required for mastery (70%)
export const S_MIN = 0.70;

// Minimum confirmations required
export const K_CONFIRMATIONS = 3;

// Minimum different unit types required
export const MIN_UNIT_TYPES = 2;

// Learning algorithm constants
export const LR_BASE = 0.3;        // Base learning rate
export const U_DECAY = 0.15;       // Uncertainty decay rate
export const STABILITY_ALPHA = 0.3; // Stability EMA alpha

// Frontier selection weights
export const LAMBDA_UNCERTAINTY = 0.3;   // Weight for uncertainty
export const MU_DECAY = 0.2;             // Weight for decay risk
export const NU_MISCONCEPTION = 0.4;     // Weight for misconceptions

// Unit type format strengths (evidence quality)
export const FORMAT_STRENGTHS = {
  diagnostic_mcq: 0.4,
  micro_teach_then_check: 0.6,
  drill_set: 0.5,
  applied_free_response: 0.9,
  error_reversal: 0.7,
};

// Thresholds for unit type selection
export const UNCERTAINTY_HIGH = 0.55;
export const MASTERY_LOW = 0.50;
export const MASTERY_MID = 0.80;
export const PASS_SCORE = 0.85;
export const CONFIRMATION_SCORE = 0.70;
