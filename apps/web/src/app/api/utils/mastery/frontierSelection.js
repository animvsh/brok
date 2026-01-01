import {
  LAMBDA_UNCERTAINTY,
  MU_DECAY,
  NU_MISCONCEPTION,
  UNCERTAINTY_HIGH,
  MASTERY_LOW,
  MASTERY_MID,
} from './constants.js';
import { checkMastery, checkPrerequisites } from './checkGating.js';
import { calculateDecayRisk } from './updateMastery.js';

/**
 * Calculate priority score for a skill node
 * Higher priority = should learn next
 *
 * priority = weight * (1 - p) + λ*u + μ*decay + ν*misconception
 *
 * @param {Object} nodeRef - Node reference from graph
 * @param {Object} state - Mastery state for this node
 * @returns {number} Priority score
 */
export function calculatePriority(nodeRef, state) {
  const weight = nodeRef.weight || 1.0;
  const masteryP = state.mastery_p || 0.5;
  const uncertainty = state.uncertainty || 1.0;
  const misconceptionCount = state.misconception_tags?.length || 0;

  // Base priority: weighted inverse of mastery
  const basePriority = weight * (1 - masteryP);

  // Uncertainty boost: prioritize uncertain skills
  const uncertaintyBoost = LAMBDA_UNCERTAINTY * uncertainty;

  // Decay risk: prioritize skills at risk of decay
  const decayRisk = calculateDecayRisk(state);
  const decayBoost = MU_DECAY * decayRisk;

  // Misconception penalty: prioritize fixing misconceptions
  const misconceptionPenalty = NU_MISCONCEPTION * (misconceptionCount * 0.1);

  return basePriority + uncertaintyBoost + decayBoost + misconceptionPenalty;
}

/**
 * Select the unit type based on mastery state
 * This determines what kind of learning activity to present
 *
 * Order of precedence:
 * 1. Has misconceptions -> error_reversal
 * 2. High uncertainty (>0.55) -> diagnostic_mcq
 * 3. Low mastery (<0.50) -> micro_teach_then_check
 * 4. Medium mastery (<0.80) -> drill_set
 * 5. High mastery, needs applied -> applied_free_response
 * 6. Default -> drill_set
 *
 * @param {Object} state - Mastery state
 * @returns {string} Unit type
 */
export function selectUnitType(state) {
  const {
    mastery_p = 0.5,
    uncertainty = 1.0,
    misconception_tags = [],
    has_applied_confirmation = false,
    unit_types_used = [],
  } = state;

  // Priority 1: Fix misconceptions
  if (misconception_tags.length > 0) {
    return 'error_reversal';
  }

  // Priority 2: Reduce high uncertainty
  if (uncertainty > UNCERTAINTY_HIGH) {
    return 'diagnostic_mcq';
  }

  // Priority 3: Teach low mastery
  if (mastery_p < MASTERY_LOW) {
    return 'micro_teach_then_check';
  }

  // Priority 4: Practice medium mastery
  if (mastery_p < MASTERY_MID) {
    return 'drill_set';
  }

  // Priority 5: Applied practice for high mastery without confirmation
  if (!has_applied_confirmation) {
    return 'applied_free_response';
  }

  // Priority 6: Variety - use a type not yet used
  const allTypes = [
    'diagnostic_mcq',
    'micro_teach_then_check',
    'drill_set',
    'applied_free_response',
  ];
  const unusedTypes = allTypes.filter((t) => !unit_types_used.includes(t));
  if (unusedTypes.length > 0) {
    return unusedTypes[0];
  }

  // Default: drill for stability
  return 'drill_set';
}

/**
 * Select the frontier - skills that are:
 * - Not yet mastered
 * - Have all prerequisites mastered
 *
 * Returns nodes sorted by priority (highest first)
 *
 * @param {Object} graph - Skill graph instance with nodes and edges
 * @param {Map<string, Object>} masteryStates - Map of node_id to mastery state
 * @param {Set<string>} masteredNodes - Set of mastered node IDs
 * @param {Object} options - Selection options
 * @returns {Object[]} Array of frontier nodes with priority and suggested unit type
 */
export function selectFrontier(graph, masteryStates, masteredNodes, options = {}) {
  const { limit = 5, includeUnitType = true } = options;
  const frontier = [];

  // Build prerequisite map from edges
  const prereqMap = new Map();
  for (const edge of graph.edges || []) {
    if (edge.type === 'prerequisite' || !edge.type) {
      const deps = prereqMap.get(edge.to_node_id) || [];
      deps.push(edge.from_node_id);
      prereqMap.set(edge.to_node_id, deps);
    }
  }

  for (const nodeRef of graph.nodes || []) {
    const nodeId = nodeRef.node_id;

    // Skip already mastered nodes
    if (masteredNodes.has(nodeId)) {
      continue;
    }

    // Get mastery state
    const state = masteryStates.get(nodeId);
    if (!state) {
      continue; // No state = not initialized
    }

    // Check prerequisites
    const prerequisites = prereqMap.get(nodeId) || nodeRef.prerequisites || [];
    const { canStart, unmetPrereqs } = checkPrerequisites(
      nodeId,
      prerequisites,
      masteredNodes
    );

    if (!canStart) {
      continue; // Prerequisites not met
    }

    // Calculate priority
    const priority = calculatePriority(nodeRef, state);

    // Determine suggested unit type
    const suggestedUnitType = includeUnitType ? selectUnitType(state) : null;

    frontier.push({
      nodeId,
      priority,
      suggestedUnitType,
      state,
      nodeRef,
      masteryProgress: {
        masteryP: state.mastery_p,
        uncertainty: state.uncertainty,
        stability: state.stability,
        misconceptions: state.misconception_tags?.length || 0,
      },
    });
  }

  // Sort by priority (descending)
  frontier.sort((a, b) => b.priority - a.priority);

  // Return top nodes
  return frontier.slice(0, limit);
}

/**
 * Get the next unit to present to the user
 * This is the main entry point for the adaptive loop
 *
 * @param {Object} thread - Learning thread
 * @param {Object} graph - Skill graph instance
 * @param {Object[]} masteryStates - Array of mastery states
 * @returns {Object} { completed: boolean, node: Object, unitType: string, frontier: Object[] }
 */
export function getNextUnit(thread, graph, masteryStates) {
  // Build mastery map and mastered set
  const masteryMap = new Map();
  const masteredNodes = new Set();

  for (const state of masteryStates) {
    masteryMap.set(state.node_id, state);

    const { isMastered } = checkMastery(state);
    if (isMastered) {
      masteredNodes.add(state.node_id);
    }
  }

  // Check if thread is complete (all nodes mastered)
  if (masteredNodes.size === (graph.nodes?.length || 0)) {
    return {
      completed: true,
      summary: {
        totalNodes: graph.nodes.length,
        masteredNodes: masteredNodes.size,
        completedAt: new Date().toISOString(),
      },
    };
  }

  // Select frontier
  const frontier = selectFrontier(graph, masteryMap, masteredNodes);

  if (frontier.length === 0) {
    // No available nodes - might be stuck due to unmet prerequisites
    return {
      completed: false,
      blocked: true,
      reason: 'No available skills - check prerequisites',
    };
  }

  // Get top priority node
  const topNode = frontier[0];

  return {
    completed: false,
    node: {
      id: topNode.nodeId,
      ...topNode.nodeRef,
    },
    unitType: topNode.suggestedUnitType,
    masteryState: topNode.state,
    masteryProgress: topNode.masteryProgress,
    frontier: frontier.slice(0, 3).map((f) => ({
      nodeId: f.nodeId,
      priority: f.priority,
      unitType: f.suggestedUnitType,
    })),
  };
}

export default selectFrontier;
