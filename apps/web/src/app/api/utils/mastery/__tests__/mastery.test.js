/**
 * Mastery Algorithm Tests
 * Tests for updateMastery, checkGating, and frontierSelection
 */

import { updateMastery, calculateEvidenceStrength } from '../updateMastery';
import { checkMastery, getMasteryBand, getMasteryColor } from '../checkGating';
import { selectFrontier, selectUnitType, calculateDecayRisk } from '../frontierSelection';
import {
  P_MASTER,
  U_MAX,
  S_MIN,
  K_CONFIRMATIONS,
  MIN_UNIT_TYPES,
} from '../constants';

describe('updateMastery', () => {
  test('increases mastery on correct answer', () => {
    const currentState = {
      mastery_p: 0.5,
      uncertainty: 0.8,
      stability: 0.3,
    };
    const evidence = {
      score: 1.0,
      formatStrength: 0.6,
      difficulty: 0.5,
      misconceptionsDetected: [],
    };

    const result = updateMastery(currentState, evidence);

    expect(result.newMasteryP).toBeGreaterThan(0.5);
    expect(result.newUncertainty).toBeLessThan(0.8);
    expect(result.newStability).toBeGreaterThan(0.3);
  });

  test('decreases mastery on incorrect answer', () => {
    const currentState = {
      mastery_p: 0.7,
      uncertainty: 0.5,
      stability: 0.5,
    };
    const evidence = {
      score: 0.0,
      formatStrength: 0.6,
      difficulty: 0.5,
      misconceptionsDetected: [],
    };

    const result = updateMastery(currentState, evidence);

    expect(result.newMasteryP).toBeLessThan(0.7);
    expect(result.newStability).toBeLessThan(0.5);
  });

  test('caps mastery at 0.75 when misconception detected', () => {
    const currentState = {
      mastery_p: 0.8,
      uncertainty: 0.3,
      stability: 0.6,
    };
    const evidence = {
      score: 0.5,
      formatStrength: 0.6,
      difficulty: 0.5,
      misconceptionsDetected: ['some_misconception'],
    };

    const result = updateMastery(currentState, evidence);

    expect(result.newMasteryP).toBeLessThanOrEqual(0.75);
  });

  test('calculates evidence strength correctly', () => {
    const strength = calculateEvidenceStrength(0.8, 0.6);
    expect(strength).toBeGreaterThan(0);
    expect(strength).toBeLessThanOrEqual(1);
  });
});

describe('checkMastery', () => {
  test('returns false when mastery_p is too low', () => {
    const state = {
      mastery_p: 0.8, // Below 0.90
      uncertainty: 0.2,
      stability: 0.75,
      confirmation_count: 3,
      unit_types_used: ['mcq', 'drill'],
      has_applied_confirmation: true,
      misconception_tags: [],
    };

    const { isMastered, blockers } = checkMastery(state);

    expect(isMastered).toBe(false);
    expect(blockers.length).toBeGreaterThan(0);
    expect(blockers.some((b) => b.includes('Mastery'))).toBe(true);
  });

  test('returns false when uncertainty is too high', () => {
    const state = {
      mastery_p: 0.95,
      uncertainty: 0.3, // Above 0.25
      stability: 0.75,
      confirmation_count: 3,
      unit_types_used: ['mcq', 'drill'],
      has_applied_confirmation: true,
      misconception_tags: [],
    };

    const { isMastered, blockers } = checkMastery(state);

    expect(isMastered).toBe(false);
    expect(blockers.some((b) => b.includes('Uncertainty'))).toBe(true);
  });

  test('returns false when not enough confirmations', () => {
    const state = {
      mastery_p: 0.95,
      uncertainty: 0.2,
      stability: 0.75,
      confirmation_count: 2, // Below 3
      unit_types_used: ['mcq', 'drill'],
      has_applied_confirmation: true,
      misconception_tags: [],
    };

    const { isMastered, blockers } = checkMastery(state);

    expect(isMastered).toBe(false);
    expect(blockers.some((b) => b.includes('confirmation'))).toBe(true);
  });

  test('returns true when all conditions met', () => {
    const state = {
      mastery_p: 0.95,
      uncertainty: 0.2,
      stability: 0.75,
      confirmation_count: 3,
      unit_types_used: ['mcq', 'drill', 'free_response'],
      has_applied_confirmation: true,
      misconception_tags: [],
    };

    const { isMastered, blockers } = checkMastery(state);

    expect(isMastered).toBe(true);
    expect(blockers.length).toBe(0);
  });

  test('returns false when critical misconception present', () => {
    const state = {
      mastery_p: 0.95,
      uncertainty: 0.2,
      stability: 0.75,
      confirmation_count: 3,
      unit_types_used: ['mcq', 'drill'],
      has_applied_confirmation: true,
      misconception_tags: ['critical_mc'],
    };

    const { isMastered } = checkMastery(state, ['critical_mc']);

    expect(isMastered).toBe(false);
  });
});

describe('getMasteryBand', () => {
  test('returns novice for low mastery', () => {
    expect(getMasteryBand(0.2, false)).toBe('novice');
  });

  test('returns developing for medium mastery', () => {
    expect(getMasteryBand(0.5, false)).toBe('developing');
  });

  test('returns proficient for high mastery', () => {
    expect(getMasteryBand(0.8, false)).toBe('proficient');
  });

  test('returns mastered when isMastered is true', () => {
    expect(getMasteryBand(0.95, true)).toBe('mastered');
  });
});

describe('frontierSelection', () => {
  test('selects nodes with prerequisites met', () => {
    const graph = {
      nodes: [
        { node_id: 'a', weight: 1, prerequisites: [] },
        { node_id: 'b', weight: 1, prerequisites: ['a'] },
        { node_id: 'c', weight: 1, prerequisites: ['b'] },
      ],
    };

    const masteryStates = new Map([
      ['a', { mastery_p: 0.5, uncertainty: 0.5, stability: 0.3, misconception_tags: [] }],
      ['b', { mastery_p: 0.3, uncertainty: 0.7, stability: 0.1, misconception_tags: [] }],
      ['c', { mastery_p: 0.2, uncertainty: 0.9, stability: 0, misconception_tags: [] }],
    ]);

    const masteredNodes = new Set();

    const frontier = selectFrontier(graph, masteryStates, masteredNodes);

    // Only 'a' should be in frontier (no prerequisites)
    expect(frontier.length).toBe(1);
    expect(frontier[0].nodeId).toBe('a');
  });

  test('excludes mastered nodes from frontier', () => {
    const graph = {
      nodes: [
        { node_id: 'a', weight: 1, prerequisites: [] },
        { node_id: 'b', weight: 1, prerequisites: [] },
      ],
    };

    const masteryStates = new Map([
      ['a', { mastery_p: 0.95, uncertainty: 0.2, stability: 0.8, misconception_tags: [] }],
      ['b', { mastery_p: 0.3, uncertainty: 0.7, stability: 0.1, misconception_tags: [] }],
    ]);

    const masteredNodes = new Set(['a']); // 'a' is mastered

    const frontier = selectFrontier(graph, masteryStates, masteredNodes);

    expect(frontier.length).toBe(1);
    expect(frontier[0].nodeId).toBe('b');
  });

  test('prioritizes nodes with misconceptions', () => {
    const graph = {
      nodes: [
        { node_id: 'a', weight: 1, prerequisites: [] },
        { node_id: 'b', weight: 1, prerequisites: [] },
      ],
    };

    const masteryStates = new Map([
      ['a', { mastery_p: 0.5, uncertainty: 0.5, stability: 0.3, misconception_tags: [] }],
      ['b', { mastery_p: 0.5, uncertainty: 0.5, stability: 0.3, misconception_tags: ['mc1', 'mc2'] }],
    ]);

    const masteredNodes = new Set();

    const frontier = selectFrontier(graph, masteryStates, masteredNodes);

    // 'b' should have higher priority due to misconceptions
    expect(frontier[0].nodeId).toBe('b');
  });
});

describe('selectUnitType', () => {
  test('returns error_reversal when misconceptions present', () => {
    const state = {
      mastery_p: 0.5,
      uncertainty: 0.5,
      misconception_tags: ['mc1'],
      has_applied_confirmation: false,
    };

    expect(selectUnitType(state)).toBe('error_reversal');
  });

  test('returns diagnostic_mcq for high uncertainty', () => {
    const state = {
      mastery_p: 0.5,
      uncertainty: 0.6,
      misconception_tags: [],
      has_applied_confirmation: false,
    };

    expect(selectUnitType(state)).toBe('diagnostic_mcq');
  });

  test('returns micro_teach_then_check for low mastery', () => {
    const state = {
      mastery_p: 0.3,
      uncertainty: 0.4,
      misconception_tags: [],
      has_applied_confirmation: false,
    };

    expect(selectUnitType(state)).toBe('micro_teach_then_check');
  });

  test('returns applied_free_response when ready for confirmation', () => {
    const state = {
      mastery_p: 0.85,
      uncertainty: 0.3,
      misconception_tags: [],
      has_applied_confirmation: false,
    };

    expect(selectUnitType(state)).toBe('applied_free_response');
  });
});

describe('calculateDecayRisk', () => {
  test('returns higher risk for older evidence', () => {
    const recentState = {
      last_evidence_at: new Date().toISOString(),
      decay_rate: 0.01,
    };

    const oldState = {
      last_evidence_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      decay_rate: 0.01,
    };

    const recentRisk = calculateDecayRisk(recentState);
    const oldRisk = calculateDecayRisk(oldState);

    expect(oldRisk).toBeGreaterThan(recentRisk);
  });
});

// Run all tests
console.log('Running mastery algorithm tests...');
