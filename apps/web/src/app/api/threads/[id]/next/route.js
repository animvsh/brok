import supabase from '@/app/api/utils/supabase';
import { getUserId, validateUUID } from '@/app/api/utils/auth';
import { checkMastery, calculateThreadProgress } from '@/app/api/utils/mastery/checkGating';
import { selectFrontier, selectUnitType } from '@/app/api/utils/mastery/frontierSelection';
import { generateUnit } from '@/app/api/utils/generation/unitFactory';

/**
 * GET /api/threads/[id]/next
 * Get the next learning unit for a thread using frontier selection
 *
 * Returns: { unit, node, masteryProgress, frontier } or { completed: true }
 */
export async function GET(request, { params }) {
  try {
    // Get and validate user
    const { userId, error: userError, status: userStatus } = await getUserId(request);
    if (userError) {
      return Response.json({ error: userError }, { status: userStatus });
    }

    const threadId = params.id;

    // Validate thread ID
    const threadIdError = validateUUID(threadId);
    if (threadIdError) {
      return Response.json({ error: `Invalid thread ID: ${threadIdError}` }, { status: 400 });
    }

    // Get thread and verify ownership
    const { data: thread, error: threadError } = await supabase
      .from('learning_threads')
      .select('*')
      .eq('id', threadId)
      .single();

    if (threadError || !thread) {
      return Response.json({ error: 'Thread not found' }, { status: 404 });
    }

    if (thread.user_id !== userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (thread.status === 'completed') {
      return Response.json({
        completed: true,
        message: 'This learning thread is complete!',
        thread: { id: thread.id, title: thread.title },
      });
    }

    // Get skill graph
    const { data: graph, error: graphError } = await supabase
      .from('skill_graph_instances')
      .select('*')
      .eq('thread_id', threadId)
      .single();

    if (graphError || !graph) {
      return Response.json({ error: 'Skill graph not found' }, { status: 404 });
    }

    // Get all mastery states for this thread
    const { data: masteryStates, error: masteryError } = await supabase
      .from('mastery_state')
      .select('*')
      .eq('thread_id', threadId)
      .eq('user_id', userId);

    if (masteryError) {
      console.error('Mastery fetch error:', masteryError);
      return Response.json({ error: 'Failed to fetch mastery states' }, { status: 500 });
    }

    // Build mastery map and determine mastered nodes
    const masteryMap = new Map();
    const masteredNodes = new Set();

    for (const state of masteryStates || []) {
      masteryMap.set(state.node_id, state);

      // Get skill node to check for critical misconceptions
      const nodeRef = graph.nodes.find((n) => n.node_id === state.node_id);
      const criticalMisconceptions = (nodeRef?.misconceptions_library || [])
        .filter((m) => m.severity === 'critical')
        .map((m) => m.tag);

      const { isMastered } = checkMastery(state, criticalMisconceptions);
      if (isMastered) {
        masteredNodes.add(state.node_id);
      }
    }

    // Check if all nodes are mastered (thread complete)
    const totalNodes = graph.nodes?.length || 0;
    if (masteredNodes.size === totalNodes && totalNodes > 0) {
      // Mark thread as completed
      await supabase
        .from('learning_threads')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', threadId);

      return Response.json({
        completed: true,
        summary: {
          totalNodes,
          masteredNodes: masteredNodes.size,
          completedAt: new Date().toISOString(),
        },
        thread: { id: thread.id, title: thread.title },
      });
    }

    // Select frontier (nodes ready to learn)
    const frontier = selectFrontier(graph, masteryMap, masteredNodes);

    if (frontier.length === 0) {
      // No available nodes - might be stuck
      return Response.json({
        completed: false,
        blocked: true,
        reason: 'No available skills to learn. Check prerequisites.',
        progress: calculateThreadProgress(masteryStates),
      });
    }

    // Get top priority node
    const topFrontier = frontier[0];
    const nodeId = topFrontier.nodeId;
    const nodeRef = graph.nodes.find((n) => n.node_id === nodeId);

    // Get skill node details
    const { data: skillNode, error: skillError } = await supabase
      .from('skill_nodes')
      .select('*')
      .eq('id', nodeId)
      .single();

    if (skillError || !skillNode) {
      // Fallback to nodeRef data
      console.warn('Skill node not found in DB, using graph data');
    }

    const nodeData = skillNode || {
      id: nodeId,
      name: nodeRef?.name || 'Unknown Skill',
      description: nodeRef?.description || '',
      difficulty: nodeRef?.difficulty || 0.5,
      misconceptions_library: nodeRef?.misconceptions_library || [],
    };

    // Generate unit for this node
    const unitType = topFrontier.suggestedUnitType || selectUnitType(topFrontier.state);
    const generatedUnit = await generateUnit(nodeData, unitType, topFrontier.state);

    // Save unit to database
    const { data: savedUnit, error: unitError } = await supabase
      .from('learning_units')
      .insert({
        thread_id: threadId,
        node_id: nodeId,
        unit_type: unitType,
        difficulty: generatedUnit.difficulty,
        content: generatedUnit.content,
        grading_spec: generatedUnit.grading_spec,
        format_strength: generatedUnit.format_strength,
        estimated_time_seconds: generatedUnit.estimated_time_seconds,
      })
      .select()
      .single();

    if (unitError) {
      console.error('Unit save error:', unitError);
      // Continue with generated unit even if save fails
    }

    // Get mastery gating info for the node
    const { isMastered, blockers, progress } = checkMastery(
      topFrontier.state,
      (nodeData.misconceptions_library || [])
        .filter((m) => m.severity === 'critical')
        .map((m) => m.tag)
    );

    return Response.json({
      completed: false,
      unit: {
        id: savedUnit?.id || crypto.randomUUID(),
        ...generatedUnit,
      },
      node: {
        id: nodeId,
        name: nodeData.name,
        description: nodeData.description,
        difficulty: nodeData.difficulty,
      },
      masteryState: {
        current: topFrontier.state,
        progress,
        blockers,
        isMastered,
      },
      threadProgress: calculateThreadProgress(masteryStates),
      frontier: frontier.slice(0, 3).map((f) => ({
        nodeId: f.nodeId,
        nodeName: graph.nodes.find((n) => n.node_id === f.nodeId)?.name,
        unitType: f.suggestedUnitType,
        priority: Math.round(f.priority * 100) / 100,
      })),
    });
  } catch (error) {
    console.error('Next unit error:', error);
    return Response.json(
      { error: 'Failed to get next learning unit. Please try again.' },
      { status: 500 }
    );
  }
}
