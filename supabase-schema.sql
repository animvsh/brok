-- Brok Learning App - Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  goal TEXT,
  total_modules INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Modules table
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  module_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Concepts table
CREATE TABLE IF NOT EXISTS concepts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  concept_name TEXT NOT NULL,
  concept_data JSONB NOT NULL, -- stores questions array
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User progress table (links to Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  active_course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  current_module_id UUID REFERENCES modules(id) ON DELETE SET NULL,
  total_xp INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  modules_completed INTEGER DEFAULT 0,
  last_active_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- User performance table (tracks mastery per concept)
CREATE TABLE IF NOT EXISTS user_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_id UUID REFERENCES concepts(id) ON DELETE CASCADE,
  mastery_level DECIMAL(3,2) DEFAULT 0.00,
  times_seen INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  avg_response_time INTEGER DEFAULT 0,
  last_seen TIMESTAMP WITH TIME ZONE,
  next_review TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, concept_id)
);

-- Learning sessions table
CREATE TABLE IF NOT EXISTS learning_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  questions_answered INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0
);

-- Module completions table
CREATE TABLE IF NOT EXISTS module_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  mastery_achieved DECIMAL(3,2),
  xp_earned INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_concepts_module_id ON concepts(module_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_performance_user_id ON user_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_user_performance_concept_id ON user_performance(concept_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_id ON learning_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_module_completions_user_id ON module_completions(user_id);

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_completions ENABLE ROW LEVEL SECURITY;

-- Courses: Everyone can read, only service role can write
CREATE POLICY "Anyone can view courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Service role can manage courses" ON courses FOR ALL USING (auth.role() = 'service_role');

-- Modules: Everyone can read
CREATE POLICY "Anyone can view modules" ON modules FOR SELECT USING (true);
CREATE POLICY "Service role can manage modules" ON modules FOR ALL USING (auth.role() = 'service_role');

-- Concepts: Everyone can read
CREATE POLICY "Anyone can view concepts" ON concepts FOR SELECT USING (true);
CREATE POLICY "Service role can manage concepts" ON concepts FOR ALL USING (auth.role() = 'service_role');

-- User progress: Users can only access their own data
CREATE POLICY "Users can view own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON user_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access to user_progress" ON user_progress FOR ALL USING (auth.role() = 'service_role');

-- User performance: Users can only access their own data
CREATE POLICY "Users can view own performance" ON user_performance FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own performance" ON user_performance FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own performance" ON user_performance FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access to user_performance" ON user_performance FOR ALL USING (auth.role() = 'service_role');

-- Learning sessions: Users can only access their own data
CREATE POLICY "Users can view own sessions" ON learning_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own sessions" ON learning_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role full access to learning_sessions" ON learning_sessions FOR ALL USING (auth.role() = 'service_role');

-- Module completions: Users can only access their own data
CREATE POLICY "Users can view own completions" ON module_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own completions" ON module_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access to module_completions" ON module_completions FOR ALL USING (auth.role() = 'service_role');

-- Function to automatically create user_progress when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_progress (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
