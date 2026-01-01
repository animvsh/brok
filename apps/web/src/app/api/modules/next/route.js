import supabase from "@/app/api/utils/supabase";
import { getUserId } from "@/app/api/utils/auth";

// Spaced repetition algorithm
function calculateNextReview(mastery, correct) {
  const baseInterval = 1; // 1 day
  let interval = baseInterval;

  if (correct) {
    // Increase interval based on mastery
    interval = baseInterval * Math.pow(2, mastery * 5);
  } else {
    // Reset to short interval if incorrect
    interval = 0.1; // Review soon (2.4 hours)
  }

  return new Date(Date.now() + interval * 24 * 60 * 60 * 1000);
}

// Select concepts adaptively based on performance
async function selectConcepts(moduleId, userId) {
  // Get all concepts for this module
  const { data: concepts } = await supabase
    .from('concepts')
    .select('*')
    .eq('module_id', moduleId);

  if (!concepts || concepts.length === 0) {
    return [];
  }

  // Get performance data for these concepts
  const conceptIds = concepts.map(c => c.id);
  const { data: performances } = await supabase
    .from('user_performance')
    .select('*')
    .eq('user_id', userId)
    .in('concept_id', conceptIds);

  const perfMap = new Map(performances?.map(p => [p.concept_id, p]) || []);

  // Combine concepts with their performance data
  const conceptsWithPerformance = concepts.map(c => ({
    ...c,
    mastery_level: perfMap.get(c.id)?.mastery_level || 0,
    times_seen: perfMap.get(c.id)?.times_seen || 0,
    next_review: perfMap.get(c.id)?.next_review || new Date().toISOString(),
    performance_id: perfMap.get(c.id)?.id
  }));

  // Sort by: needs review first, then by mastery level (lowest first)
  conceptsWithPerformance.sort((a, b) => {
    const aReview = new Date(a.next_review);
    const bReview = new Date(b.next_review);
    const now = new Date();

    // Prioritize concepts that need review
    const aNeedsReview = aReview <= now;
    const bNeedsReview = bReview <= now;

    if (aNeedsReview && !bNeedsReview) return -1;
    if (!aNeedsReview && bNeedsReview) return 1;

    // Then by mastery level
    return a.mastery_level - b.mastery_level;
  });

  return conceptsWithPerformance.slice(0, 10);
}

export async function GET(request) {
  try {
    // Get and validate user
    const { userId, error: userError, status: userStatus } = await getUserId(request);
    if (userError) {
      return Response.json({ error: userError }, { status: userStatus });
    }

    // Get user progress
    const { data: progress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!progress || !progress.current_module_id) {
      return Response.json({ error: "No active module" }, { status: 404 });
    }

    const moduleId = progress.current_module_id;

    // Get module info
    const { data: module } = await supabase
      .from('modules')
      .select('*')
      .eq('id', moduleId)
      .single();

    // Select concepts adaptively
    const concepts = await selectConcepts(moduleId, userId);

    if (concepts.length === 0) {
      return Response.json({ error: "No concepts found" }, { status: 404 });
    }

    // Build questions from selected concepts
    const questions = [];

    for (const concept of concepts) {
      const questionsData = typeof concept.concept_data === 'string'
        ? JSON.parse(concept.concept_data)
        : concept.concept_data;

      if (!questionsData || questionsData.length === 0) continue;

      // Select question based on mastery level
      const difficulty = Math.min(
        Math.floor(concept.mastery_level * questionsData.length),
        questionsData.length - 1,
      );
      const selectedQuestion = questionsData[difficulty] || questionsData[0];

      questions.push({
        conceptId: concept.id,
        conceptName: concept.concept_name,
        performanceId: concept.performance_id,
        mastery: concept.mastery_level,
        ...selectedQuestion,
      });
    }

    // Create a new learning session
    const { data: session } = await supabase
      .from('learning_sessions')
      .insert({
        user_id: userId,
        module_id: moduleId,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    return Response.json({
      module,
      questions,
      sessionId: session?.id,
    });
  } catch (error) {
    console.error("Error fetching next module:", error);
    return Response.json(
      { error: "Failed to fetch next module" },
      { status: 500 },
    );
  }
}
