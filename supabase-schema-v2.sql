-- Brok v2: Capability Engine Database Schema
-- Run this in Supabase SQL Editor AFTER running the original schema

-- Enable UUID extension (should already exist)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- LEARNING THREADS (replaces courses)
-- ============================================
CREATE TABLE IF NOT EXISTS learning_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  raw_input TEXT NOT NULL,
  parsed_intent JSONB, -- {domain_candidates, goal_type, keywords, signals}
  goal_spec JSONB, -- {time_horizon, depth_target, constraints, evaluation_style}
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_threads_user_id ON learning_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_threads_status ON learning_threads(status);

-- ============================================
-- SKILL NODES (canonical + custom)
-- ============================================
CREATE TABLE IF NOT EXISTS skill_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  difficulty DECIMAL(3,2) DEFAULT 0.50 CHECK (difficulty >= 0 AND difficulty <= 1),
  prerequisites UUID[] DEFAULT '{}',
  misconceptions_library JSONB DEFAULT '[]',
  -- [{id, tag, description, triggers, severity, corrective_template}]
  assessment_templates JSONB DEFAULT '[]',
  -- [{type, template, difficulty_range}]
  tags TEXT[] DEFAULT '{}',
  is_canonical BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skill_nodes_domain ON skill_nodes(domain);
CREATE INDEX IF NOT EXISTS idx_skill_nodes_is_canonical ON skill_nodes(is_canonical);
CREATE UNIQUE INDEX IF NOT EXISTS idx_skill_nodes_canonical_unique
  ON skill_nodes(domain, name) WHERE is_canonical = true;

-- ============================================
-- SKILL GRAPH INSTANCES (per thread)
-- ============================================
CREATE TABLE IF NOT EXISTS skill_graph_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID REFERENCES learning_threads(id) ON DELETE CASCADE,
  nodes JSONB NOT NULL,
  -- [{node_id, weight, position_x, position_y, prerequisites}]
  edges JSONB NOT NULL,
  -- [{from_node_id, to_node_id, type}]
  template_source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skill_graph_instances_thread_id ON skill_graph_instances(thread_id);

-- ============================================
-- MASTERY STATE (per user per node per thread)
-- ============================================
CREATE TABLE IF NOT EXISTS mastery_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES learning_threads(id) ON DELETE CASCADE,
  node_id UUID REFERENCES skill_nodes(id) ON DELETE CASCADE,

  -- Core mastery metrics
  mastery_p DECIMAL(5,4) DEFAULT 0.5000 CHECK (mastery_p >= 0 AND mastery_p <= 1),
  uncertainty DECIMAL(5,4) DEFAULT 1.0000 CHECK (uncertainty >= 0 AND uncertainty <= 1),
  stability DECIMAL(5,4) DEFAULT 0.0000 CHECK (stability >= 0 AND stability <= 1),

  -- Misconceptions tracking
  misconception_tags TEXT[] DEFAULT '{}',

  -- Evidence tracking
  evidence_count INTEGER DEFAULT 0,
  last_evidence_at TIMESTAMP WITH TIME ZONE,

  -- Confirmation requirements
  confirmation_count INTEGER DEFAULT 0,
  unit_types_used TEXT[] DEFAULT '{}',
  has_applied_confirmation BOOLEAN DEFAULT false,

  -- Decay tracking
  decay_rate DECIMAL(5,4) DEFAULT 0.01,
  last_mastered_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, thread_id, node_id)
);

CREATE INDEX IF NOT EXISTS idx_mastery_state_user_id ON mastery_state(user_id);
CREATE INDEX IF NOT EXISTS idx_mastery_state_thread_id ON mastery_state(thread_id);
CREATE INDEX IF NOT EXISTS idx_mastery_state_node_id ON mastery_state(node_id);
CREATE INDEX IF NOT EXISTS idx_mastery_state_composite ON mastery_state(user_id, thread_id);

-- ============================================
-- LEARNING UNITS
-- ============================================
CREATE TABLE IF NOT EXISTS learning_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID REFERENCES learning_threads(id) ON DELETE CASCADE,
  node_id UUID REFERENCES skill_nodes(id) ON DELETE CASCADE,

  unit_type TEXT NOT NULL CHECK (unit_type IN (
    'diagnostic_mcq',
    'micro_teach_then_check',
    'drill_set',
    'applied_free_response',
    'error_reversal'
  )),

  difficulty DECIMAL(3,2) DEFAULT 0.50 CHECK (difficulty >= 0 AND difficulty <= 1),
  content JSONB NOT NULL,
  grading_spec JSONB NOT NULL,
  format_strength DECIMAL(3,2) CHECK (format_strength >= 0 AND format_strength <= 1),
  estimated_time_seconds INTEGER,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_units_thread_id ON learning_units(thread_id);
CREATE INDEX IF NOT EXISTS idx_learning_units_node_id ON learning_units(node_id);
CREATE INDEX IF NOT EXISTS idx_learning_units_unit_type ON learning_units(unit_type);

-- ============================================
-- ATTEMPTS
-- ============================================
CREATE TABLE IF NOT EXISTS attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES learning_units(id) ON DELETE CASCADE,

  response_payload JSONB NOT NULL,
  time_spent_ms INTEGER,
  hint_count INTEGER DEFAULT 0,

  graded_result JSONB NOT NULL,
  -- {score, partial_scores, misconceptions_detected, feedback}

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_unit_id ON attempts(unit_id);
CREATE INDEX IF NOT EXISTS idx_attempts_created_at ON attempts(created_at);

-- ============================================
-- EVIDENCE EVENTS
-- ============================================
CREATE TABLE IF NOT EXISTS evidence_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mastery_state_id UUID REFERENCES mastery_state(id) ON DELETE CASCADE,
  attempt_id UUID REFERENCES attempts(id) ON DELETE CASCADE,

  delta_mastery_p DECIMAL(6,5),
  delta_uncertainty DECIMAL(6,5),
  delta_stability DECIMAL(6,5),
  evidence_strength DECIMAL(5,4),
  misconception_tag TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_events_mastery_state_id ON evidence_events(mastery_state_id);
CREATE INDEX IF NOT EXISTS idx_evidence_events_attempt_id ON evidence_events(attempt_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE learning_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_graph_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE mastery_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_events ENABLE ROW LEVEL SECURITY;

-- Learning Threads: Users can only access their own
CREATE POLICY "Users can view own threads" ON learning_threads
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own threads" ON learning_threads
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own threads" ON learning_threads
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to learning_threads" ON learning_threads
  FOR ALL USING (auth.role() = 'service_role');

-- Skill Nodes: Everyone can read canonical, users can read their own custom
CREATE POLICY "Anyone can view canonical skill nodes" ON skill_nodes
  FOR SELECT USING (is_canonical = true);
CREATE POLICY "Users can view own custom nodes" ON skill_nodes
  FOR SELECT USING (created_by = auth.uid());
CREATE POLICY "Service role full access to skill_nodes" ON skill_nodes
  FOR ALL USING (auth.role() = 'service_role');

-- Skill Graph Instances: Users can access via their threads
CREATE POLICY "Users can view own graphs" ON skill_graph_instances
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM learning_threads
      WHERE learning_threads.id = skill_graph_instances.thread_id
      AND learning_threads.user_id = auth.uid()
    )
  );
CREATE POLICY "Service role full access to skill_graph_instances" ON skill_graph_instances
  FOR ALL USING (auth.role() = 'service_role');

-- Mastery State: Users can only access their own
CREATE POLICY "Users can view own mastery" ON mastery_state
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own mastery" ON mastery_state
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to mastery_state" ON mastery_state
  FOR ALL USING (auth.role() = 'service_role');

-- Learning Units: Users can access via their threads
CREATE POLICY "Users can view units in own threads" ON learning_units
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM learning_threads
      WHERE learning_threads.id = learning_units.thread_id
      AND learning_threads.user_id = auth.uid()
    )
  );
CREATE POLICY "Service role full access to learning_units" ON learning_units
  FOR ALL USING (auth.role() = 'service_role');

-- Attempts: Users can only access their own
CREATE POLICY "Users can view own attempts" ON attempts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own attempts" ON attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access to attempts" ON attempts
  FOR ALL USING (auth.role() = 'service_role');

-- Evidence Events: Users can access via their mastery states
CREATE POLICY "Users can view own evidence" ON evidence_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM mastery_state
      WHERE mastery_state.id = evidence_events.mastery_state_id
      AND mastery_state.user_id = auth.uid()
    )
  );
CREATE POLICY "Service role full access to evidence_events" ON evidence_events
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if a skill is mastered
CREATE OR REPLACE FUNCTION is_skill_mastered(
  p_mastery_p DECIMAL,
  p_uncertainty DECIMAL,
  p_stability DECIMAL,
  p_confirmation_count INTEGER,
  p_unit_types_used TEXT[],
  p_has_applied_confirmation BOOLEAN,
  p_misconception_tags TEXT[]
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    p_mastery_p >= 0.90 AND
    p_uncertainty <= 0.25 AND
    p_stability >= 0.70 AND
    p_confirmation_count >= 3 AND
    array_length(p_unit_types_used, 1) >= 2 AND
    p_has_applied_confirmation = true AND
    (p_misconception_tags IS NULL OR array_length(p_misconception_tags, 1) IS NULL OR array_length(p_misconception_tags, 1) = 0)
  );
END;
$$ LANGUAGE plpgsql;

-- Function to update mastery_state updated_at on changes
CREATE OR REPLACE FUNCTION update_mastery_state_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mastery_state_updated_at
  BEFORE UPDATE ON mastery_state
  FOR EACH ROW EXECUTE FUNCTION update_mastery_state_timestamp();

-- Function to update learning_threads updated_at on changes
CREATE OR REPLACE FUNCTION update_learning_threads_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER learning_threads_updated_at
  BEFORE UPDATE ON learning_threads
  FOR EACH ROW EXECUTE FUNCTION update_learning_threads_timestamp();

-- ============================================
-- MIGRATION HELPER (for existing data)
-- ============================================

-- Function to migrate a course to a learning thread
-- Call this for each existing course when migrating
CREATE OR REPLACE FUNCTION migrate_course_to_thread(
  p_course_id UUID,
  p_user_id UUID
) RETURNS UUID AS $$
DECLARE
  v_thread_id UUID;
  v_module RECORD;
  v_concept RECORD;
  v_node_id UUID;
  v_nodes JSONB := '[]'::JSONB;
  v_edges JSONB := '[]'::JSONB;
  v_prev_node_id UUID;
  v_course RECORD;
BEGIN
  -- Get course details
  SELECT * INTO v_course FROM courses WHERE id = p_course_id;

  IF v_course IS NULL THEN
    RAISE EXCEPTION 'Course not found: %', p_course_id;
  END IF;

  -- Create learning thread
  INSERT INTO learning_threads (user_id, title, raw_input, parsed_intent, status)
  VALUES (
    p_user_id,
    v_course.title,
    v_course.title || ': ' || COALESCE(v_course.description, ''),
    jsonb_build_object(
      'domain_candidates', jsonb_build_array(jsonb_build_object('domain', 'general', 'score', 0.8)),
      'goal_type', 'learn',
      'keywords', string_to_array(v_course.title, ' ')
    ),
    'active'
  )
  RETURNING id INTO v_thread_id;

  -- Iterate through modules and concepts
  FOR v_module IN
    SELECT * FROM modules WHERE course_id = p_course_id ORDER BY module_order
  LOOP
    FOR v_concept IN
      SELECT * FROM concepts WHERE module_id = v_module.id
    LOOP
      -- Create skill node
      INSERT INTO skill_nodes (domain, name, description, assessment_templates, is_canonical, created_by)
      VALUES (
        'general',
        v_concept.concept_name,
        v_module.title || ' - ' || v_concept.concept_name,
        v_concept.concept_data,
        false,
        p_user_id
      )
      RETURNING id INTO v_node_id;

      -- Add to nodes array
      v_nodes := v_nodes || jsonb_build_object(
        'node_id', v_node_id,
        'weight', 1.0,
        'position_x', (v_module.module_order * 100)::float,
        'position_y', (random() * 100)::float
      );

      -- Add edge from previous node
      IF v_prev_node_id IS NOT NULL THEN
        v_edges := v_edges || jsonb_build_object(
          'from_node_id', v_prev_node_id,
          'to_node_id', v_node_id,
          'type', 'prerequisite'
        );
      END IF;

      v_prev_node_id := v_node_id;

      -- Create mastery state (migrate from user_performance if exists)
      INSERT INTO mastery_state (user_id, thread_id, node_id, mastery_p, uncertainty, stability)
      SELECT
        p_user_id,
        v_thread_id,
        v_node_id,
        COALESCE(up.mastery_level, 0.5),
        GREATEST(0.25, 1.0 - (COALESCE(up.times_seen, 0)::decimal / 20.0)),
        COALESCE(up.mastery_level, 0.5) * 0.6
      FROM concepts c
      LEFT JOIN user_performance up ON up.concept_id = c.id AND up.user_id = p_user_id
      WHERE c.id = v_concept.id;
    END LOOP;
  END LOOP;

  -- Create skill graph instance
  INSERT INTO skill_graph_instances (thread_id, nodes, edges, template_source)
  VALUES (v_thread_id, v_nodes, v_edges, 'migrated_from_course');

  RETURN v_thread_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE learning_threads IS 'User learning goals/threads (replaces courses)';
COMMENT ON TABLE skill_nodes IS 'Atomic testable skills (canonical or user-created)';
COMMENT ON TABLE skill_graph_instances IS 'Per-thread skill graph with nodes and edges';
COMMENT ON TABLE mastery_state IS 'User mastery tracking per skill per thread';
COMMENT ON TABLE learning_units IS 'Generated learning content (5 unit types)';
COMMENT ON TABLE attempts IS 'User attempts at learning units';
COMMENT ON TABLE evidence_events IS 'Mastery update events for tracking';

COMMENT ON COLUMN mastery_state.mastery_p IS 'Probability of skill mastery [0-1], target >= 0.90 for mastered';
COMMENT ON COLUMN mastery_state.uncertainty IS 'Uncertainty in mastery estimate [0-1], target <= 0.25 for mastered';
COMMENT ON COLUMN mastery_state.stability IS 'Stability of mastery over time [0-1], target >= 0.70 for mastered';
COMMENT ON COLUMN mastery_state.confirmation_count IS 'Number of successful confirmations, target >= 3 for mastered';
COMMENT ON COLUMN mastery_state.unit_types_used IS 'Distinct unit types used, target >= 2 for mastered';
COMMENT ON COLUMN mastery_state.has_applied_confirmation IS 'Whether applied practice was successful, required for mastered';
