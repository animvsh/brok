import supabase from "@/app/api/utils/supabase";
import { getUserId } from "@/app/api/utils/auth";
import { checkMastery, calculateThreadProgress } from "@/app/api/utils/mastery/checkGating";

export async function GET(request) {
  try {
    // Get and validate user
    const { userId, error: userError, status: userStatus } = await getUserId(request);
    if (userError) {
      return Response.json({ threads: [], error: userError }, { status: userStatus });
    }

    // === V2: Get active learning threads ===
    const { data: threads, error: threadsError } = await supabase
      .from('learning_threads')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('updated_at', { ascending: false });

    if (threadsError) {
      console.error('Error fetching threads:', threadsError);
    }

    // Enrich each thread with progress data
    const enrichedThreads = [];
    for (const thread of threads || []) {
      // Get mastery states for this thread
      const { data: masteryStates } = await supabase
        .from('mastery_state')
        .select('*')
        .eq('thread_id', thread.id)
        .eq('user_id', userId);

      // Calculate progress
      const progress = calculateThreadProgress(masteryStates || []);

      // Get skill graph for next skill name
      const { data: graph } = await supabase
        .from('skill_graph_instances')
        .select('nodes')
        .eq('thread_id', thread.id)
        .single();

      // Find next skill (first unmastered with prerequisites met)
      let nextSkillName = 'Continue learning';
      if (graph?.nodes && masteryStates) {
        const masteredIds = new Set();
        for (const state of masteryStates) {
          const { isMastered } = checkMastery(state);
          if (isMastered) masteredIds.add(state.node_id);
        }

        // Get first node in graph that isn't mastered
        const nextNode = graph.nodes.find(n => !masteredIds.has(n.node_id));
        if (nextNode) {
          // Fetch skill node name
          const { data: skillNode } = await supabase
            .from('skill_nodes')
            .select('name')
            .eq('id', nextNode.node_id)
            .single();
          nextSkillName = skillNode?.name || 'Next skill';
        }
      }

      // Generate a color based on thread ID (deterministic)
      const colors = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6'];
      const colorIndex = thread.id.charCodeAt(0) % colors.length;

      enrichedThreads.push({
        id: thread.id,
        title: thread.title,
        progress: progress.overallProgress,
        nextLesson: nextSkillName,
        color: colors[colorIndex],
        totalNodes: progress.totalNodes,
        masteredNodes: progress.masteredNodes,
        status: thread.status,
        updatedAt: thread.updated_at,
        createdAt: thread.created_at,
      });
    }

    // === V1 fallback: Get legacy course if no threads ===
    let legacyCourse = null;
    if (enrichedThreads.length === 0) {
      const { data: progress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (progress?.active_course_id) {
        const { data: course } = await supabase
          .from('courses')
          .select('*')
          .eq('id', progress.active_course_id)
          .single();

        if (course) {
          legacyCourse = {
            id: course.id,
            title: course.title,
            progress: 0,
            nextLesson: 'Start learning',
            color: '#6366F1',
            isLegacy: true,
          };
        }
      }
    }

    return Response.json({
      threads: enrichedThreads,
      course: legacyCourse, // V1 compatibility
    });
  } catch (error) {
    console.error("Error fetching active courses:", error);
    return Response.json(
      { threads: [], error: "Failed to fetch active courses" },
      { status: 500 },
    );
  }
}
