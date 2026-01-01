/**
 * Migration Script: V1 Courses to V2 Learning Threads
 *
 * This script migrates existing course-based data to the new skill graph system.
 *
 * V1 Structure:
 * - courses -> modules -> concepts -> questions
 * - user_progress (mastery_level = times_correct / times_seen)
 *
 * V2 Structure:
 * - learning_threads -> skill_graph_instances -> skill_nodes
 * - mastery_state (mastery_p, uncertainty, stability, confirmation tracking)
 */

import supabase from '@/app/api/utils/supabase';

/**
 * Convert V1 mastery level to V2 mastery state
 */
function convertMasteryLevel(v1Progress) {
  const masteryLevel = v1Progress?.mastery_level || 0;
  const timesSeen = v1Progress?.times_seen || 0;

  // Convert to V2 mastery parameters
  const mastery_p = Math.max(0.1, Math.min(0.95, masteryLevel));

  // Uncertainty decreases with more practice
  const uncertainty = Math.max(0.25, 1 - timesSeen / 20);

  // Stability is based on mastery level
  const stability = masteryLevel * 0.6;

  return {
    mastery_p,
    uncertainty,
    stability,
    evidence_count: timesSeen,
    confirmation_count: Math.floor(masteryLevel * 3),
    unit_types_used: ['diagnostic_mcq'],
    has_applied_confirmation: false,
    misconception_tags: [],
  };
}

/**
 * Migrate a single user's courses to threads
 */
async function migrateUserCourses(userId) {
  const results = {
    success: true,
    threadsCreated: 0,
    nodesCreated: 0,
    masteryStatesCreated: 0,
    errors: [],
  };

  try {
    // Get user's courses
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .eq('user_id', userId);

    if (coursesError) {
      results.errors.push(`Failed to fetch courses: ${coursesError.message}`);
      results.success = false;
      return results;
    }

    if (!courses || courses.length === 0) {
      return results;
    }

    for (const course of courses) {
      try {
        // Create learning thread
        const { data: thread, error: threadError } = await supabase
          .from('learning_threads')
          .insert({
            user_id: userId,
            title: course.title,
            raw_input: course.topic || course.title,
            parsed_intent: {
              domain_candidates: [course.topic || 'general'],
              goal_type: 'learn',
              keywords: [course.topic],
              signals: { migrated_from_v1: true },
            },
            goal_spec: {
              time_horizon: 'ongoing',
              depth_target: 'intermediate',
              constraints: {},
              evaluation_style: 'mastery',
            },
            status: course.status || 'active',
          })
          .select()
          .single();

        if (threadError) {
          results.errors.push(`Failed to create thread for course ${course.id}: ${threadError.message}`);
          continue;
        }

        results.threadsCreated++;

        // Get modules for this course
        const { data: modules, error: modulesError } = await supabase
          .from('modules')
          .select('*')
          .eq('course_id', course.id)
          .order('module_order', { ascending: true });

        if (modulesError || !modules) {
          results.errors.push(`Failed to fetch modules for course ${course.id}`);
          continue;
        }

        // Create skill nodes from modules/concepts
        const skillNodes = [];
        const graphNodes = [];
        const graphEdges = [];
        let prevNodeId = null;

        for (const module of modules) {
          // Get concepts for this module
          const { data: concepts } = await supabase
            .from('concepts')
            .select('*')
            .eq('module_id', module.id);

          // Create a skill node for the module
          const { data: skillNode, error: nodeError } = await supabase
            .from('skill_nodes')
            .insert({
              domain: course.topic || 'general',
              name: module.title,
              description: module.description,
              difficulty: 0.5,
              prerequisites: prevNodeId ? [prevNodeId] : [],
              misconceptions_library: [],
              assessment_templates: (concepts || []).map((c) => ({
                question: c.question,
                type: c.question_type,
                options: c.options,
                answer: c.correct_answer,
              })),
              tags: [course.topic, 'migrated_v1'].filter(Boolean),
              is_canonical: false,
              created_by: userId,
            })
            .select()
            .single();

          if (nodeError) {
            results.errors.push(`Failed to create skill node for module ${module.id}: ${nodeError.message}`);
            continue;
          }

          skillNodes.push(skillNode);
          results.nodesCreated++;

          // Add to graph
          const positionX = (skillNodes.length - 1) * 100;
          const positionY = Math.sin((skillNodes.length - 1) * 0.5) * 50;

          graphNodes.push({
            node_id: skillNode.id,
            weight: 1.0,
            position_x: positionX,
            position_y: positionY,
            prerequisites: prevNodeId ? [prevNodeId] : [],
          });

          if (prevNodeId) {
            graphEdges.push({
              from_node_id: prevNodeId,
              to_node_id: skillNode.id,
              type: 'prerequisite',
            });
          }

          // Get user's performance for concepts in this module
          const { data: performance } = await supabase
            .from('user_performance')
            .select('*')
            .eq('user_id', userId)
            .in('concept_id', (concepts || []).map((c) => c.id));

          // Calculate aggregate mastery for the module
          let aggregatedMastery = {
            mastery_level: 0,
            times_seen: 0,
          };

          if (performance && performance.length > 0) {
            const totalMastery = performance.reduce((sum, p) => sum + (p.mastery_level || 0), 0);
            const totalSeen = performance.reduce((sum, p) => sum + (p.times_seen || 0), 0);
            aggregatedMastery = {
              mastery_level: totalMastery / performance.length,
              times_seen: Math.round(totalSeen / performance.length),
            };
          }

          // Convert to V2 mastery state
          const v2Mastery = convertMasteryLevel(aggregatedMastery);

          // Create mastery state
          const { error: masteryError } = await supabase
            .from('mastery_state')
            .insert({
              user_id: userId,
              thread_id: thread.id,
              node_id: skillNode.id,
              ...v2Mastery,
            });

          if (masteryError) {
            results.errors.push(`Failed to create mastery state: ${masteryError.message}`);
          } else {
            results.masteryStatesCreated++;
          }

          prevNodeId = skillNode.id;
        }

        // Create skill graph instance
        const { error: graphError } = await supabase
          .from('skill_graph_instances')
          .insert({
            thread_id: thread.id,
            nodes: graphNodes,
            edges: graphEdges,
            template_source: 'v1_migration',
          });

        if (graphError) {
          results.errors.push(`Failed to create graph for thread ${thread.id}: ${graphError.message}`);
        }
      } catch (error) {
        results.errors.push(`Error migrating course ${course.id}: ${error.message}`);
      }
    }

    return results;
  } catch (error) {
    results.success = false;
    results.errors.push(`Migration failed: ${error.message}`);
    return results;
  }
}

/**
 * Migrate all users' data from V1 to V2
 */
export async function migrateAllUsers() {
  const report = {
    startTime: new Date().toISOString(),
    endTime: null,
    usersProcessed: 0,
    totalThreadsCreated: 0,
    totalNodesCreated: 0,
    totalMasteryStatesCreated: 0,
    errors: [],
    userResults: [],
  };

  try {
    // Get all users with courses
    const { data: userIds, error: usersError } = await supabase
      .from('courses')
      .select('user_id')
      .not('user_id', 'is', null);

    if (usersError) {
      report.errors.push(`Failed to fetch users: ${usersError.message}`);
      return report;
    }

    // Get unique user IDs
    const uniqueUserIds = [...new Set(userIds.map((u) => u.user_id))];

    for (const userId of uniqueUserIds) {
      const userResult = await migrateUserCourses(userId);
      report.usersProcessed++;
      report.totalThreadsCreated += userResult.threadsCreated;
      report.totalNodesCreated += userResult.nodesCreated;
      report.totalMasteryStatesCreated += userResult.masteryStatesCreated;
      report.errors.push(...userResult.errors);
      report.userResults.push({
        userId,
        ...userResult,
      });
    }

    report.endTime = new Date().toISOString();
    return report;
  } catch (error) {
    report.errors.push(`Migration failed: ${error.message}`);
    report.endTime = new Date().toISOString();
    return report;
  }
}

/**
 * Check if a user has been migrated
 */
export async function checkUserMigration(userId) {
  const { data: threads, error } = await supabase
    .from('learning_threads')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  if (error) {
    return { migrated: false, error: error.message };
  }

  return { migrated: threads && threads.length > 0 };
}

/**
 * Migrate a single user on-demand (for lazy migration)
 */
export async function migrateSingleUser(userId) {
  const checkResult = await checkUserMigration(userId);

  if (checkResult.migrated) {
    return { success: true, message: 'User already migrated' };
  }

  return await migrateUserCourses(userId);
}

export default {
  migrateAllUsers,
  migrateSingleUser,
  checkUserMigration,
};
