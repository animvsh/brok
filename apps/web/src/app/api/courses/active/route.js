import supabase from "@/app/api/utils/supabase";
import { getUserId } from "@/app/api/utils/auth";

export async function GET(request) {
  try {
    // Get and validate user
    const { userId, error: userError, status: userStatus } = await getUserId(request);
    if (userError) {
      return Response.json({ course: null, error: userError }, { status: userStatus });
    }

    // Get user progress
    const { data: progress, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (progressError || !progress || !progress.active_course_id) {
      return Response.json({ course: null });
    }

    // Get course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', progress.active_course_id)
      .single();

    if (courseError || !course) {
      return Response.json({ course: null });
    }

    // Get all modules for progress visualization
    const { data: modules } = await supabase
      .from('modules')
      .select('*')
      .eq('course_id', course.id)
      .order('module_order', { ascending: true });

    // Get module completions for this user
    const { data: completions } = await supabase
      .from('module_completions')
      .select('module_id')
      .eq('user_id', userId);

    const completedModuleIds = new Set(completions?.map(c => c.module_id) || []);

    const modulesWithCompletion = modules?.map(m => ({
      ...m,
      completed: completedModuleIds.has(m.id)
    })) || [];

    // Get current module
    const { data: currentModule } = await supabase
      .from('modules')
      .select('*')
      .eq('id', progress.current_module_id)
      .single();

    return Response.json({
      course,
      modules: modulesWithCompletion,
      currentModule,
      progress,
    });
  } catch (error) {
    console.error("Error fetching active course:", error);
    return Response.json(
      { error: "Failed to fetch active course" },
      { status: 500 },
    );
  }
}
