import supabase from "@/app/api/utils/supabase";
import { getUserId } from "@/app/api/utils/auth";
import { checkMastery } from "@/app/api/utils/mastery/checkGating";

export async function GET(request) {
  try {
    // Get and validate user
    const { userId, error: userError, status: userStatus } = await getUserId(request);
    if (userError) {
      return Response.json({ error: userError }, { status: userStatus });
    }

    // === V2: Calculate stats from mastery_state and evidence_events ===

    // Count total mastered skills across all threads
    const { data: allMasteryStates } = await supabase
      .from('mastery_state')
      .select('*')
      .eq('user_id', userId);

    let masteredSkillsCount = 0;
    let totalEvidence = 0;
    for (const state of allMasteryStates || []) {
      const { isMastered } = checkMastery(state);
      if (isMastered) masteredSkillsCount++;
      totalEvidence += state.evidence_count || 0;
    }

    // Count active threads
    const { count: activeThreadsCount } = await supabase
      .from('learning_threads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active');

    // Count completed threads
    const { count: completedThreadsCount } = await supabase
      .from('learning_threads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed');

    // Calculate XP (10 XP per evidence, 50 XP per mastered skill, 200 XP per completed thread)
    const xp = (totalEvidence * 10) + (masteredSkillsCount * 50) + ((completedThreadsCount || 0) * 200);

    // Calculate streak from evidence_events (days with activity)
    const { data: recentEvents } = await supabase
      .from('evidence_events')
      .select('created_at')
      .eq('mastery_state_id', allMasteryStates?.[0]?.id)
      .order('created_at', { ascending: false })
      .limit(30);

    // Simple streak calculation: count consecutive days with activity
    let streak = 0;
    if (recentEvents && recentEvents.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const eventDates = new Set(
        recentEvents.map(e => {
          const d = new Date(e.created_at);
          d.setHours(0, 0, 0, 0);
          return d.toISOString();
        })
      );

      // Check if there's activity today or yesterday
      const todayStr = today.toISOString();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString();

      if (eventDates.has(todayStr) || eventDates.has(yesterdayStr)) {
        streak = 1;
        let checkDate = eventDates.has(todayStr) ? today : yesterday;

        while (true) {
          checkDate = new Date(checkDate);
          checkDate.setDate(checkDate.getDate() - 1);
          if (eventDates.has(checkDate.toISOString())) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    // === V1 fallback: Get legacy progress if exists ===
    const { data: legacyProgress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    return Response.json({
      // Main stats
      streak: streak || legacyProgress?.current_streak || 0,
      xp: xp || legacyProgress?.total_xp || 0,

      // Detailed stats
      masteredSkills: masteredSkillsCount,
      totalEvidence: totalEvidence,
      activeThreads: activeThreadsCount || 0,
      completedThreads: completedThreadsCount || 0,

      // V1 compatibility
      legacyProgress,
    });
  } catch (error) {
    console.error("Error fetching progress stats:", error);
    return Response.json(
      { streak: 0, xp: 0, error: "Failed to fetch progress stats" },
      { status: 500 },
    );
  }
}
