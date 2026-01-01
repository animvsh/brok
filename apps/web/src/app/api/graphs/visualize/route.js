import supabase from '@/app/api/utils/supabase';
import { getUserId, validateUUID } from '@/app/api/utils/auth';
import { checkMastery, getMasteryBand, getMasteryColor } from '@/app/api/utils/mastery/checkGating';

/**
 * GET /api/graphs/visualize
 * Get graph visualization data for constellation view
 *
 * Query: threadId
 * Returns: { nodes, edges, masteryStates, layout }
 */
export async function GET(request) {
  try {
    // Get and validate user
    const { userId, error: userError, status: userStatus } = await getUserId(request);
    if (userError) {
      return Response.json({ error: userError }, { status: userStatus });
    }

    const url = new URL(request.url);
    const threadId = url.searchParams.get('threadId');

    // Validate thread ID
    const threadIdError = validateUUID(threadId);
    if (threadIdError) {
      return Response.json({ error: `Invalid thread ID: ${threadIdError}` }, { status: 400 });
    }

    // Verify thread ownership
    const { data: thread, error: threadError } = await supabase
      .from('learning_threads')
      .select('id, title, user_id, status')
      .eq('id', threadId)
      .single();

    if (threadError || !thread) {
      return Response.json({ error: 'Thread not found' }, { status: 404 });
    }

    if (thread.user_id !== userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get skill graph
    const { data: graph, error: graphError } = await supabase
      .from('skill_graph_instances')
      .select('*')
      .eq('thread_id', threadId)
      .single();

    if (graphError || !graph) {
      return Response.json({ error: 'Graph not found' }, { status: 404 });
    }

    // Get mastery states
    const { data: masteryStates, error: masteryError } = await supabase
      .from('mastery_state')
      .select('*')
      .eq('thread_id', threadId)
      .eq('user_id', userId);

    if (masteryError) {
      console.error('Mastery fetch error:', masteryError);
    }

    // Build mastery map
    const masteryMap = new Map(
      (masteryStates || []).map((s) => [s.node_id, s])
    );

    // Get skill node names
    const nodeIds = graph.nodes.map((n) => n.node_id);
    const { data: skillNodes } = await supabase
      .from('skill_nodes')
      .select('id, name, description, difficulty')
      .in('id', nodeIds);

    const skillNodeMap = new Map(
      (skillNodes || []).map((s) => [s.id, s])
    );

    // Build visualization nodes with mastery info
    const visualNodes = graph.nodes.map((nodeRef) => {
      const state = masteryMap.get(nodeRef.node_id);
      const skillNode = skillNodeMap.get(nodeRef.node_id);
      const criticalMisconceptions = (nodeRef.misconceptions_library || [])
        .filter((m) => m.severity === 'critical')
        .map((m) => m.tag);

      const { isMastered, blockers, progress } = state
        ? checkMastery(state, criticalMisconceptions)
        : { isMastered: false, blockers: ['Not started'], progress: {} };

      const band = getMasteryBand(state?.mastery_p || 0, isMastered);
      const color = getMasteryColor(band);

      // Check if prerequisites are met
      const prereqsMet = (nodeRef.prerequisites || []).every((prereqId) => {
        const prereqState = masteryMap.get(prereqId);
        if (!prereqState) return false;
        const { isMastered: prereqMastered } = checkMastery(prereqState);
        return prereqMastered;
      });

      const isLocked = !prereqsMet && (nodeRef.prerequisites || []).length > 0;

      return {
        id: nodeRef.node_id,
        name: skillNode?.name || nodeRef.name || 'Unknown',
        description: skillNode?.description || nodeRef.description || '',
        difficulty: skillNode?.difficulty || nodeRef.difficulty || 0.5,
        position: {
          x: nodeRef.position_x || 0,
          y: nodeRef.position_y || 0,
        },
        weight: nodeRef.weight || 1.0,
        mastery: {
          p: state?.mastery_p || 0,
          u: state?.uncertainty || 1,
          s: state?.stability || 0,
          band,
          color,
          isMastered,
          isLocked,
          blockers,
          progress,
          evidenceCount: state?.evidence_count || 0,
          confirmationCount: state?.confirmation_count || 0,
          unitTypesUsed: state?.unit_types_used || [],
          hasAppliedConfirmation: state?.has_applied_confirmation || false,
          misconceptions: state?.misconception_tags || [],
        },
      };
    });

    // Build visualization edges
    const visualEdges = graph.edges.map((edge) => {
      const fromNode = visualNodes.find((n) => n.id === edge.from_node_id);
      const toNode = visualNodes.find((n) => n.id === edge.to_node_id);

      return {
        from: edge.from_node_id,
        to: edge.to_node_id,
        type: edge.type || 'prerequisite',
        fromPosition: fromNode?.position || { x: 0, y: 0 },
        toPosition: toNode?.position || { x: 0, y: 0 },
        isComplete: fromNode?.mastery?.isMastered || false,
      };
    });

    // Calculate layout bounds
    const positions = visualNodes.map((n) => n.position);
    const minX = Math.min(...positions.map((p) => p.x)) - 50;
    const maxX = Math.max(...positions.map((p) => p.x)) + 50;
    const minY = Math.min(...positions.map((p) => p.y)) - 50;
    const maxY = Math.max(...positions.map((p) => p.y)) + 50;

    // Calculate summary stats
    const masteredCount = visualNodes.filter((n) => n.mastery.isMastered).length;
    const inProgressCount = visualNodes.filter(
      (n) => !n.mastery.isMastered && n.mastery.evidenceCount > 0
    ).length;
    const lockedCount = visualNodes.filter((n) => n.mastery.isLocked).length;

    return Response.json({
      thread: {
        id: thread.id,
        title: thread.title,
        status: thread.status,
      },
      nodes: visualNodes,
      edges: visualEdges,
      layout: {
        bounds: { minX, maxX, minY, maxY },
        width: maxX - minX,
        height: maxY - minY,
        center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
      },
      summary: {
        totalNodes: visualNodes.length,
        masteredNodes: masteredCount,
        inProgressNodes: inProgressCount,
        lockedNodes: lockedCount,
        completionPercent: Math.round((masteredCount / visualNodes.length) * 100),
      },
    });
  } catch (error) {
    console.error('Graph visualization error:', error);
    return Response.json(
      { error: 'Failed to get graph visualization' },
      { status: 500 }
    );
  }
}
