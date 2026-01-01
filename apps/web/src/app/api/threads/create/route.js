import supabase from '@/app/api/utils/supabase';
import { getUserId, checkRateLimit, validateString, sanitizeString } from '@/app/api/utils/auth';
import { parseIntent, buildGoalSpec } from '@/app/api/utils/generation/intentParser';
import { generateGraph } from '@/app/api/utils/generation/graphGenerator';

const MAX_INPUT_LENGTH = 500;
const RATE_LIMIT_REQUESTS = 10;
const RATE_LIMIT_WINDOW = 3600000; // 1 hour

/**
 * POST /api/threads/create
 * Create a new learning thread from user input
 *
 * Body: { input: string }
 * Returns: { thread, graph, masteryStates, firstFrontier }
 */
export async function POST(request) {
  try {
    // Get and validate user
    const { userId, error: userError, status: userStatus } = await getUserId(request);
    if (userError) {
      return Response.json({ error: userError }, { status: userStatus });
    }

    // Rate limiting
    const rateCheck = checkRateLimit(userId, 'thread_create', RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW);
    if (!rateCheck.allowed) {
      return Response.json(
        { error: `Rate limit exceeded. Try again in ${rateCheck.retryAfter} seconds` },
        { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfter) } }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { input } = body;

    // Validate input
    const inputError = validateString(input, { minLength: 3, maxLength: MAX_INPUT_LENGTH });
    if (inputError) {
      return Response.json({ error: `Invalid input: ${inputError}` }, { status: 400 });
    }

    const sanitizedInput = sanitizeString(input);

    // Step 1: Parse intent from user input
    const parsedIntent = await parseIntent(sanitizedInput);

    // Step 2: Build goal spec
    const goalSpec = buildGoalSpec(parsedIntent);

    // Step 3: Generate skill graph
    const graph = await generateGraph(parsedIntent, goalSpec);

    // Step 4: Create learning thread
    const { data: thread, error: threadError } = await supabase
      .from('learning_threads')
      .insert({
        user_id: userId,
        title: parsedIntent.suggested_title || sanitizedInput.slice(0, 100),
        raw_input: sanitizedInput,
        parsed_intent: parsedIntent,
        goal_spec: goalSpec,
        status: 'active',
      })
      .select()
      .single();

    if (threadError) {
      console.error('Thread creation error:', threadError);
      return Response.json({ error: 'Failed to create learning thread' }, { status: 500 });
    }

    // Step 5: Create skill nodes (if not using existing canonical nodes)
    const nodeIdMap = new Map(); // Maps temp IDs to real UUIDs

    for (const nodeRef of graph.nodes) {
      const { data: skillNode, error: nodeError } = await supabase
        .from('skill_nodes')
        .insert({
          domain: parsedIntent.domain_candidates[0]?.domain || 'general',
          name: nodeRef.name,
          description: nodeRef.description,
          difficulty: nodeRef.difficulty,
          prerequisites: [], // Will be linked via graph edges
          misconceptions_library: nodeRef.misconceptions_library || [],
          assessment_templates: nodeRef.assessment_templates || [],
          tags: parsedIntent.keywords || [],
          is_canonical: false,
          created_by: userId,
        })
        .select()
        .single();

      if (nodeError) {
        console.error('Skill node creation error:', nodeError);
        continue;
      }

      nodeIdMap.set(nodeRef.node_id, skillNode.id);
    }

    // Update nodes and edges with real UUIDs
    const nodesWithRealIds = graph.nodes.map((node) => ({
      ...node,
      node_id: nodeIdMap.get(node.node_id) || node.node_id,
      prerequisites: (node.prerequisites || []).map((p) => nodeIdMap.get(p) || p),
    }));

    const edgesWithRealIds = graph.edges.map((edge) => ({
      from_node_id: nodeIdMap.get(edge.from_node_id) || edge.from_node_id,
      to_node_id: nodeIdMap.get(edge.to_node_id) || edge.to_node_id,
      type: edge.type || 'prerequisite',
    }));

    // Step 6: Create skill graph instance
    const { data: graphInstance, error: graphError } = await supabase
      .from('skill_graph_instances')
      .insert({
        thread_id: thread.id,
        nodes: nodesWithRealIds,
        edges: edgesWithRealIds,
        template_source: graph.templateSource,
      })
      .select()
      .single();

    if (graphError) {
      console.error('Graph instance creation error:', graphError);
      return Response.json({ error: 'Failed to create skill graph' }, { status: 500 });
    }

    // Step 7: Initialize mastery states for all nodes
    const masteryStatesInsert = nodesWithRealIds.map((node) => ({
      user_id: userId,
      thread_id: thread.id,
      node_id: node.node_id,
      mastery_p: 0.5,
      uncertainty: 1.0,
      stability: 0.0,
      misconception_tags: [],
      evidence_count: 0,
      confirmation_count: 0,
      unit_types_used: [],
      has_applied_confirmation: false,
    }));

    const { data: masteryStates, error: masteryError } = await supabase
      .from('mastery_state')
      .insert(masteryStatesInsert)
      .select();

    if (masteryError) {
      console.error('Mastery state creation error:', masteryError);
      // Continue anyway - mastery states can be created on demand
    }

    // Step 8: Get initial frontier (first skills to learn)
    const { selectFrontier } = await import('@/app/api/utils/mastery/frontierSelection');
    const masteryMap = new Map(
      (masteryStates || []).map((s) => [s.node_id, s])
    );
    const masteredNodes = new Set(); // None mastered yet

    const initialFrontier = selectFrontier(
      { nodes: nodesWithRealIds, edges: edgesWithRealIds },
      masteryMap,
      masteredNodes
    );

    return Response.json({
      success: true,
      threadId: thread.id,
      thread: {
        id: thread.id,
        title: thread.title,
        status: thread.status,
        created_at: thread.created_at,
      },
      parsedIntent: {
        domain: parsedIntent.domain_candidates[0]?.domain,
        goalType: parsedIntent.goal_type,
        keywords: parsedIntent.keywords,
      },
      graph: {
        id: graphInstance.id,
        nodeCount: nodesWithRealIds.length,
        edgeCount: edgesWithRealIds.length,
        templateSource: graph.templateSource,
      },
      masteryStates: masteryStates?.length || 0,
      initialFrontier: initialFrontier.slice(0, 3).map((f) => ({
        nodeId: f.nodeId,
        nodeName: nodesWithRealIds.find((n) => n.node_id === f.nodeId)?.name,
        suggestedUnitType: f.suggestedUnitType,
        priority: f.priority,
      })),
    });
  } catch (error) {
    console.error('Thread creation error:', error);
    return Response.json(
      { error: 'Failed to create learning thread. Please try again.' },
      { status: 500 }
    );
  }
}
