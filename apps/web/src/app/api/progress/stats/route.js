import supabase from "@/app/api/utils/supabase";
import { getUserId } from "@/app/api/utils/auth";

export async function GET(request) {
  try {
    // Get and validate user
    const { userId, error: userError, status: userStatus } = await getUserId(request);
    if (userError) {
      return Response.json({ error: userError }, { status: userStatus });
    }

    const { data: progress, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !progress) {
      return Response.json({ error: "Progress not found" }, { status: 404 });
    }

    // Get course progress
    let courseProgress = null;
    if (progress.active_course_id) {
      const { data: course } = await supabase
        .from('courses')
        .select('*')
        .eq('id', progress.active_course_id)
        .single();

      // Count completed modules
      const { data: modules } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', progress.active_course_id);

      const moduleIds = modules?.map(m => m.id) || [];

      const { count } = await supabase
        .from('module_completions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('module_id', moduleIds);

      courseProgress = {
        course,
        completedModules: count || 0,
        totalModules: course?.total_modules || 0,
      };
    }

    return Response.json({
      progress,
      courseProgress,
    });
  } catch (error) {
    console.error("Error fetching progress stats:", error);
    return Response.json(
      { error: "Failed to fetch progress stats" },
      { status: 500 },
    );
  }
}
