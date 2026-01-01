import supabase from '@/app/api/utils/supabase';
import { getUserId, checkRateLimit, validateUUID } from '@/app/api/utils/auth';
import { updateMastery, calculateEvidenceStrength } from '@/app/api/utils/mastery/updateMastery';
import { checkMastery } from '@/app/api/utils/mastery/checkGating';
import { CONFIRMATION_SCORE } from '@/app/api/utils/mastery/constants';
import { gradeResponse } from '@/app/api/utils/grading';

/**
 * POST /api/units/[id]/submit
 * Submit an attempt for a learning unit
 *
 * Body: { response: Object, timeSpent: number, hintCount: number }
 * Returns: { gradedResult, masteryUpdate, nextAction }
 */
export async function POST(request, { params }) {
  try {
    // Get and validate user
    const { userId, error: userError, status: userStatus } = await getUserId(request);
    if (userError) {
      return Response.json({ error: userError }, { status: userStatus });
    }

    // Rate limiting
    const rateCheck = checkRateLimit(userId, 'unit_submit', 60, 60000); // 60 per minute
    if (!rateCheck.allowed) {
      return Response.json(
        { error: `Rate limit exceeded. Try again in ${rateCheck.retryAfter} seconds` },
        { status: 429 }
      );
    }

    const unitId = params.id;

    // Validate unit ID
    const unitIdError = validateUUID(unitId);
    if (unitIdError) {
      return Response.json({ error: `Invalid unit ID: ${unitIdError}` }, { status: 400 });
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { response, timeSpent = 0, hintCount = 0 } = body;

    if (!response) {
      return Response.json({ error: 'Response is required' }, { status: 400 });
    }

    // Get unit details
    const { data: unit, error: unitError } = await supabase
      .from('learning_units')
      .select('*')
      .eq('id', unitId)
      .single();

    if (unitError || !unit) {
      return Response.json({ error: 'Unit not found' }, { status: 404 });
    }

    // Verify user owns this thread
    const { data: thread, error: threadError } = await supabase
      .from('learning_threads')
      .select('user_id')
      .eq('id', unit.thread_id)
      .single();

    if (threadError || !thread || thread.user_id !== userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Grade the response
    const gradedResult = await gradeResponse(unit, response);

    // Save attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('attempts')
      .insert({
        user_id: userId,
        unit_id: unitId,
        response_payload: response,
        time_spent_ms: timeSpent,
        hint_count: hintCount,
        graded_result: gradedResult,
      })
      .select()
      .single();

    if (attemptError) {
      console.error('Attempt save error:', attemptError);
    }

    // Get current mastery state
    const { data: currentState, error: stateError } = await supabase
      .from('mastery_state')
      .select('*')
      .eq('node_id', unit.node_id)
      .eq('user_id', userId)
      .eq('thread_id', unit.thread_id)
      .single();

    if (stateError || !currentState) {
      console.error('Mastery state not found:', stateError);
      return Response.json({
        gradedResult,
        error: 'Mastery state not found - results not saved',
      });
    }

    // Calculate mastery update
    const evidence = {
      score: gradedResult.score,
      formatStrength: unit.format_strength || 0.5,
      difficulty: unit.difficulty || 0.5,
      misconceptionsDetected: gradedResult.misconceptions_detected || [],
      hintCount,
      retryCount: 0,
    };

    const update = updateMastery(currentState, evidence);

    // Update confirmation tracking
    const isConfirmation = gradedResult.score >= CONFIRMATION_SCORE;
    const newConfirmationCount = isConfirmation
      ? currentState.confirmation_count + 1
      : currentState.confirmation_count;

    const newUnitTypesUsed = [...new Set([...currentState.unit_types_used, unit.unit_type])];

    const hasAppliedConfirmation =
      currentState.has_applied_confirmation ||
      (unit.unit_type === 'applied_free_response' && isConfirmation);

    // Handle misconception updates
    let newMisconceptionTags = [...currentState.misconception_tags];

    // Add new misconceptions
    for (const mc of gradedResult.misconceptions_detected || []) {
      if (!newMisconceptionTags.includes(mc)) {
        newMisconceptionTags.push(mc);
      }
    }

    // Clear resolved misconceptions (on error_reversal success)
    if (unit.unit_type === 'error_reversal' && gradedResult.score >= 0.7) {
      const targetMc = unit.grading_spec?.targetMisconception;
      if (targetMc) {
        newMisconceptionTags = newMisconceptionTags.filter((m) => m !== targetMc);
      }
    }

    // Update mastery state
    const { error: updateError } = await supabase
      .from('mastery_state')
      .update({
        mastery_p: update.newMasteryP,
        uncertainty: update.newUncertainty,
        stability: update.newStability,
        misconception_tags: newMisconceptionTags,
        evidence_count: currentState.evidence_count + 1,
        last_evidence_at: new Date().toISOString(),
        confirmation_count: newConfirmationCount,
        unit_types_used: newUnitTypesUsed,
        has_applied_confirmation: hasAppliedConfirmation,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentState.id);

    if (updateError) {
      console.error('Mastery update error:', updateError);
    }

    // Save evidence event
    await supabase.from('evidence_events').insert({
      mastery_state_id: currentState.id,
      attempt_id: attempt?.id,
      delta_mastery_p: update.newMasteryP - currentState.mastery_p,
      delta_uncertainty: update.newUncertainty - currentState.uncertainty,
      delta_stability: update.newStability - currentState.stability,
      evidence_strength: update.evidenceStrength,
      misconception_tag: (gradedResult.misconceptions_detected || [])[0] || null,
    });

    // Check if now mastered
    const newState = {
      ...currentState,
      mastery_p: update.newMasteryP,
      uncertainty: update.newUncertainty,
      stability: update.newStability,
      misconception_tags: newMisconceptionTags,
      confirmation_count: newConfirmationCount,
      unit_types_used: newUnitTypesUsed,
      has_applied_confirmation: hasAppliedConfirmation,
    };

    const { isMastered, blockers, progress } = checkMastery(newState);

    // Mark as mastered if conditions met
    if (isMastered && !currentState.last_mastered_at) {
      await supabase
        .from('mastery_state')
        .update({ last_mastered_at: new Date().toISOString() })
        .eq('id', currentState.id);
    }

    return Response.json({
      success: true,
      gradedResult: {
        score: gradedResult.score,
        feedback: gradedResult.feedback,
        misconceptions_detected: gradedResult.misconceptions_detected,
        correct: gradedResult.score >= 0.7,
        criteria_scores: gradedResult.criteria_scores,
        strengths: gradedResult.strengths,
        improvements: gradedResult.improvements,
      },
      masteryUpdate: {
        before: {
          p: currentState.mastery_p,
          u: currentState.uncertainty,
          s: currentState.stability,
        },
        after: {
          p: update.newMasteryP,
          u: update.newUncertainty,
          s: update.newStability,
        },
        delta: {
          p: update.newMasteryP - currentState.mastery_p,
          u: update.newUncertainty - currentState.uncertainty,
          s: update.newStability - currentState.stability,
        },
        evidenceStrength: update.evidenceStrength,
      },
      masteryProgress: {
        ...progress,
        isMastered,
        blockers,
        confirmations: newConfirmationCount,
        unitTypesUsed: newUnitTypesUsed.length,
        hasAppliedConfirmation,
        misconceptionCount: newMisconceptionTags.length,
      },
      nextAction: isMastered ? 'skill_mastered' : blockers.length > 0 ? 'continue_practice' : 'next_skill',
    });
  } catch (error) {
    console.error('Submit error:', error);
    return Response.json(
      { error: 'Failed to submit attempt. Please try again.' },
      { status: 500 }
    );
  }
}
