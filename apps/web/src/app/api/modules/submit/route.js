import supabase from "@/app/api/utils/supabase";
import { getUserId, checkRateLimit, validateUUID, validateArray, validateNumber } from "@/app/api/utils/auth";

// Constants
const MAX_RESPONSE_TIME = 300000; // 5 minutes max
const MIN_RESPONSE_TIME = 100; // 100ms minimum
const MAX_ANSWERS = 100;
const MASTERY_THRESHOLD = 0.8;

function calculateNextReview(mastery, correct) {
  const baseInterval = 1; // 1 day
  let interval = baseInterval;

  if (correct) {
    // Cap the interval at 30 days
    interval = Math.min(baseInterval * Math.pow(2, mastery * 5), 30);
  } else {
    interval = 0.1; // Review soon (2.4 hours)
  }

  return new Date(Date.now() + interval * 24 * 60 * 60 * 1000);
}

// Validate a single answer object
function validateAnswer(answer) {
  if (!answer || typeof answer !== 'object') {
    return 'Answer must be an object';
  }

  const conceptIdError = validateUUID(answer.conceptId);
  if (conceptIdError) {
    return `Invalid conceptId: ${conceptIdError}`;
  }

  if (typeof answer.correct !== 'boolean') {
    return 'Answer correct must be a boolean';
  }

  // Validate and clamp response time
  if (answer.responseTime !== undefined) {
    const rtError = validateNumber(answer.responseTime, { min: 0, required: false });
    if (rtError) {
      return `Invalid responseTime: ${rtError}`;
    }
  }

  return null;
}

export async function POST(request) {
  try {
    // Get and validate user
    const { userId, error: userError, status: userStatus } = await getUserId(request);
    if (userError) {
      return Response.json({ error: userError }, { status: userStatus });
    }

    // Rate limiting
    const rateCheck = checkRateLimit(userId, 'submit_answers', 30, 60000); // 30 submissions per minute
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
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { sessionId, answers } = body;

    // Validate sessionId
    const sessionIdError = validateUUID(sessionId);
    if (sessionIdError) {
      return Response.json({ error: `Invalid sessionId: ${sessionIdError}` }, { status: 400 });
    }

    // Validate answers array
    const answersError = validateArray(answers, { minLength: 1, maxLength: MAX_ANSWERS });
    if (answersError) {
      return Response.json({ error: `Invalid answers: ${answersError}` }, { status: 400 });
    }

    // Validate each answer
    for (let i = 0; i < answers.length; i++) {
      const answerError = validateAnswer(answers[i]);
      if (answerError) {
        return Response.json({ error: `Invalid answer at index ${i}: ${answerError}` }, { status: 400 });
      }
    }

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('learning_sessions')
      .select('id, module_id, user_id, completed_at')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.user_id !== userId) {
      return Response.json({ error: "Unauthorized access to session" }, { status: 403 });
    }

    if (session.completed_at) {
      return Response.json({ error: "Session already completed" }, { status: 400 });
    }

    let totalCorrect = 0;
    const totalQuestions = answers.length;

    // Update performance for each concept
    for (const answer of answers) {
      const { conceptId, correct } = answer;
      // Clamp response time to valid range
      const responseTime = Math.max(
        MIN_RESPONSE_TIME,
        Math.min(answer.responseTime || 5000, MAX_RESPONSE_TIME)
      );

      // Get existing performance
      const { data: performance } = await supabase
        .from('user_performance')
        .select('*')
        .eq('user_id', userId)
        .eq('concept_id', conceptId)
        .single();

      if (!performance) {
        // Create performance record if it doesn't exist
        const newMastery = correct ? 1.0 : 0.0;
        const { error: insertError } = await supabase
          .from('user_performance')
          .insert({
            user_id: userId,
            concept_id: conceptId,
            mastery_level: newMastery,
            times_seen: 1,
            times_correct: correct ? 1 : 0,
            avg_response_time: responseTime,
            last_seen: new Date().toISOString(),
            next_review: calculateNextReview(newMastery, correct).toISOString()
          });

        if (insertError) {
          console.error("Error inserting performance:", insertError);
        }

        if (correct) totalCorrect++;
        continue;
      }

      const timesCorrect = performance.times_correct + (correct ? 1 : 0);
      const timesSeen = performance.times_seen + 1;
      const newMastery = timesCorrect / timesSeen;

      // Calculate average response time
      const avgResponseTime =
        performance.avg_response_time === 0
          ? responseTime
          : (performance.avg_response_time * performance.times_seen + responseTime) / timesSeen;

      const nextReview = calculateNextReview(newMastery, correct);

      const { error: updateError } = await supabase
        .from('user_performance')
        .update({
          mastery_level: newMastery,
          times_seen: timesSeen,
          times_correct: timesCorrect,
          avg_response_time: avgResponseTime,
          last_seen: new Date().toISOString(),
          next_review: nextReview.toISOString()
        })
        .eq('id', performance.id);

      if (updateError) {
        console.error("Error updating performance:", updateError);
      }

      if (correct) totalCorrect++;
    }

    // Calculate XP earned (base 10 XP per question, bonus for accuracy)
    const accuracyBonus = Math.floor((totalCorrect / totalQuestions) * 20);
    const xpEarned = totalQuestions * 10 + accuracyBonus;

    // Update learning session as completed
    await supabase
      .from('learning_sessions')
      .update({
        completed_at: new Date().toISOString(),
        questions_answered: totalQuestions,
        questions_correct: totalCorrect,
        xp_earned: xpEarned
      })
      .eq('id', sessionId);

    const moduleId = session.module_id;
    let moduleCompleted = false;
    let avgMastery = 0;

    if (moduleId) {
      // Get all concepts in this module
      const { data: concepts } = await supabase
        .from('concepts')
        .select('id')
        .eq('module_id', moduleId);

      const conceptIds = concepts?.map(c => c.id) || [];

      if (conceptIds.length > 0) {
        // Calculate average mastery for all concepts in this module
        const { data: performances } = await supabase
          .from('user_performance')
          .select('mastery_level')
          .eq('user_id', userId)
          .in('concept_id', conceptIds);

        if (performances && performances.length > 0) {
          avgMastery = performances.reduce((sum, p) => sum + parseFloat(p.mastery_level), 0) / performances.length;
        }

        moduleCompleted = avgMastery >= MASTERY_THRESHOLD;

        if (moduleCompleted) {
          // Use upsert to avoid race condition
          await supabase
            .from('module_completions')
            .upsert({
              user_id: userId,
              module_id: moduleId,
              mastery_achieved: avgMastery,
              xp_earned: xpEarned,
              completed_at: new Date().toISOString()
            }, { onConflict: 'user_id,module_id' });

          // Get current module to find course_id and order
          const { data: currentModule } = await supabase
            .from('modules')
            .select('course_id, module_order')
            .eq('id', moduleId)
            .single();

          if (currentModule) {
            // Move to next module
            const { data: nextModule } = await supabase
              .from('modules')
              .select('id')
              .eq('course_id', currentModule.course_id)
              .gt('module_order', currentModule.module_order)
              .order('module_order', { ascending: true })
              .limit(1)
              .single();

            // Get current progress
            const { data: progress } = await supabase
              .from('user_progress')
              .select('modules_completed')
              .eq('user_id', userId)
              .single();

            const updateData = {
              modules_completed: (progress?.modules_completed || 0) + 1
            };

            if (nextModule) {
              updateData.current_module_id = nextModule.id;
            }

            await supabase
              .from('user_progress')
              .update(updateData)
              .eq('user_id', userId);
          }
        }
      }
    }

    // Update user progress (XP and streak)
    const today = new Date().toISOString().split("T")[0];

    const { data: progress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    let newStreak = progress?.current_streak || 1;
    const lastActive = progress?.last_active_date
      ? new Date(progress.last_active_date).toISOString().split("T")[0]
      : null;

    if (lastActive !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (lastActive === yesterdayStr) {
        newStreak = (progress?.current_streak || 0) + 1;
      } else {
        newStreak = 1;
      }
    }

    const longestStreak = Math.max(newStreak, progress?.longest_streak || 0);

    await supabase
      .from('user_progress')
      .update({
        total_xp: (progress?.total_xp || 0) + xpEarned,
        current_streak: newStreak,
        longest_streak: longestStreak,
        last_active_date: today
      })
      .eq('user_id', userId);

    return Response.json({
      success: true,
      xpEarned,
      totalCorrect,
      totalQuestions,
      accuracy: Math.round((totalCorrect / totalQuestions) * 100),
      moduleCompleted,
      avgMastery: Math.round(avgMastery * 100) / 100,
    });
  } catch (error) {
    console.error("Error submitting answers:", error);
    return Response.json(
      { error: "Failed to submit answers. Please try again." },
      { status: 500 },
    );
  }
}
