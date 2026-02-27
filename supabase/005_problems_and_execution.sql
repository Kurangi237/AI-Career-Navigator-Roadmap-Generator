-- Coding Arena - Problems & Code Execution Schema
-- Migration: 005_problems_and_execution.sql

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- Enum types
CREATE TYPE problem_difficulty AS ENUM ('Easy', 'Medium', 'Hard');
CREATE TYPE execution_mode AS ENUM ('function', 'stdin');
CREATE TYPE programming_language AS ENUM ('javascript', 'python', 'java', 'c', 'cpp');
CREATE TYPE code_status AS ENUM ('AC', 'WA', 'TLE', 'RE', 'CE', 'pending');

-- Problems table - core problem definitions
CREATE TABLE IF NOT EXISTS problems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unique_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  difficulty problem_difficulty NOT NULL,
  topic TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  statement TEXT NOT NULL,
  constraints TEXT[] NOT NULL DEFAULT '{}',
  mode execution_mode NOT NULL DEFAULT 'stdin',
  starter_code JSONB NOT NULL, -- { javascript, python, java, c, cpp }
  function_name TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  visibility TEXT NOT NULL DEFAULT 'public',
  acceptance_rate NUMERIC(5,2) DEFAULT 0,
  submissions_count INTEGER DEFAULT 0,

  -- Constraints
  CONSTRAINT starter_code_not_empty CHECK ((starter_code IS NOT NULL AND jsonb_array_length(starter_code::jsonb) > 0) OR mode = 'function')
);

CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_problems_topic ON problems(topic);
CREATE INDEX idx_problems_tags ON problems USING GIN(tags);
CREATE INDEX idx_problems_slug ON problems(slug);
CREATE INDEX idx_problems_created_by ON problems(created_by);
CREATE INDEX idx_problems_visibility ON problems(visibility);

-- Test cases table
CREATE TABLE IF NOT EXISTS test_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  input JSONB NOT NULL,
  expected_output TEXT NOT NULL,
  explanation TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT test_case_order_positive CHECK ("order" >= 0)
);

CREATE INDEX idx_test_cases_problem ON test_cases (problem_id, "order");

-- Code submissions - stores every user submission
CREATE TABLE IF NOT EXISTS code_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  language programming_language NOT NULL,
  code TEXT NOT NULL,
  status code_status NOT NULL DEFAULT 'pending',
  runtime_ms INTEGER,
  memory_used INTEGER,
  verdict TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  hidden_test_results JSONB,

  CONSTRAINT code_not_empty CHECK (LENGTH(TRIM(code)) > 0)
);

CREATE INDEX idx_submissions_user ON code_submissions(user_id);
CREATE INDEX idx_submissions_problem ON code_submissions(problem_id);
CREATE INDEX idx_submissions_status ON code_submissions(status);
CREATE INDEX idx_submissions_timestamp ON code_submissions(submitted_at DESC);
CREATE INDEX idx_submissions_user_problem ON code_submissions(user_id, problem_id);

-- Job queue for judge system
CREATE TABLE IF NOT EXISTS judge_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  problem_id UUID REFERENCES problems(id) ON DELETE SET NULL,
  language programming_language NOT NULL,
  mode execution_mode NOT NULL DEFAULT 'stdin',
  code TEXT NOT NULL,
  status code_status NOT NULL DEFAULT 'pending',
  result JSONB,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  worker_id TEXT,

  CONSTRAINT code_not_empty CHECK (LENGTH(TRIM(code)) > 0),
  CONSTRAINT dates_valid CHECK (started_at IS NULL OR started_at >= created_at),
  CONSTRAINT dates_valid2 CHECK (completed_at IS NULL OR (started_at IS NOT NULL AND completed_at >= started_at))
);

CREATE INDEX idx_jobs_status ON judge_jobs(status);
CREATE INDEX idx_jobs_user ON judge_jobs(user_id);
CREATE INDEX idx_jobs_created ON judge_jobs(created_at DESC);
CREATE INDEX idx_jobs_pending ON judge_jobs(status) WHERE status IN ('pending', 'AC', 'WA', 'TLE', 'RE');

-- User problem statistics view
CREATE OR REPLACE VIEW user_problem_stats AS
SELECT
  user_id,
  problem_id,
  COUNT(*) AS total_submissions,
  SUM(CASE WHEN status = 'AC' THEN 1 ELSE 0 END) AS accepted_count,
  MIN(CASE WHEN status = 'AC' THEN submitted_at END) AS first_accepted_at,
  ROUND(AVG(CASE WHEN runtime_ms IS NOT NULL THEN runtime_ms ELSE NULL END)::NUMERIC, 0) AS avg_runtime_ms
FROM code_submissions
GROUP BY user_id, problem_id;

-- Language statistics view
CREATE OR REPLACE VIEW language_stats AS
SELECT
  language,
  COUNT(*) AS submission_count,
  SUM(CASE WHEN status = 'AC' THEN 1 ELSE 0 END) AS accepted_count,
  ROUND((SUM(CASE WHEN status = 'AC' THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)) * 100, 1) AS acceptance_rate
FROM code_submissions
GROUP BY language;

-- Problem difficulty distribution view
CREATE OR REPLACE VIEW problem_stats AS
SELECT
  difficulty,
  COUNT(*) AS total_problems,
  SUM(submissions_count) AS total_submissions,
  ROUND(AVG(acceptance_rate), 1) AS avg_acceptance_rate
FROM problems
WHERE visibility = 'public'
GROUP BY difficulty;

-- Row-Level Security (RLS) policies
ALTER TABLE code_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;

-- Users can only see their own submissions
CREATE POLICY "Users can view own submissions"
  ON code_submissions FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'admin');

CREATE POLICY "Users can create own submissions"
  ON code_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can see all public problems
CREATE POLICY "Public problems visible to all"
  ON problems FOR SELECT
  USING (visibility = 'public' OR auth.uid() = created_by OR auth.role() = 'admin');

CREATE POLICY "Admins can create problems"
  ON problems FOR INSERT
  WITH CHECK (auth.role() = 'admin' OR auth.uid() = created_by);

CREATE POLICY "Problem authors can update"
  ON problems FOR UPDATE
  USING (auth.uid() = created_by OR auth.role() = 'admin')
  WITH CHECK (auth.uid() = created_by OR auth.role() = 'admin');

-- Test cases are visible with problems
CREATE POLICY "Test cases visible with problems"
  ON test_cases FOR SELECT
  USING (EXISTS (SELECT 1 FROM problems WHERE id = problem_id AND (visibility = 'public' OR auth.uid() = created_by)));

-- Trigger to update problem submission count
CREATE OR REPLACE FUNCTION update_problem_submission_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE problems
  SET submissions_count = (SELECT COUNT(*) FROM code_submissions WHERE problem_id = NEW.problem_id),
      acceptance_rate = (
        SELECT ROUND((SUM(CASE WHEN status = 'AC' THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)) * 100, 1)
        FROM code_submissions
        WHERE problem_id = NEW.problem_id
      )
  WHERE id = NEW.problem_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_problem_stats ON code_submissions;
CREATE TRIGGER trigger_update_problem_stats
  AFTER INSERT ON code_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_problem_submission_count();

-- Trigger to log submission timestamps
CREATE OR REPLACE FUNCTION update_problem_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_problem_updated_at ON problems;
CREATE TRIGGER trigger_problem_updated_at
  BEFORE UPDATE ON problems
  FOR EACH ROW
  EXECUTE FUNCTION update_problem_updated_at();

-- Stored procedure to get problem with test cases
CREATE OR REPLACE FUNCTION get_problem_with_cases(p_problem_id UUID)
RETURNS TABLE (
  problem_id UUID,
  problem_title TEXT,
  difficulty problem_difficulty,
  topic TEXT,
  statement TEXT,
  starter_code JSONB,
  test_cases_json JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.difficulty,
    p.topic,
    p.statement,
    p.starter_code,
    COALESCE(
      json_agg(json_build_object('id', tc.id, 'input', tc.input, 'expected_output', tc.expected_output, 'order', tc."order") ORDER BY tc."order"),
      '[]'::json
    )
  FROM problems p
  LEFT JOIN test_cases tc ON tc.problem_id = p.id
  WHERE p.id = p_problem_id
  GROUP BY p.id, p.title, p.difficulty, p.topic, p.statement, p.starter_code;
END;
$$ LANGUAGE plpgsql;

-- Stored procedure to get user problem progress
CREATE OR REPLACE FUNCTION get_user_problem_progress(p_user_id UUID)
RETURNS TABLE (
  problem_id UUID,
  problem_title TEXT,
  difficulty problem_difficulty,
  status code_status,
  submission_count INTEGER,
  last_submission_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.difficulty,
    (SELECT status FROM code_submissions WHERE user_id = p_user_id AND problem_id = p.id ORDER BY submitted_at DESC LIMIT 1),
    COUNT(cs.id)::INTEGER,
    MAX(cs.submitted_at)
  FROM problems p
  LEFT JOIN code_submissions cs ON cs.problem_id = p.id AND cs.user_id = p_user_id
  WHERE p.visibility = 'public'
  GROUP BY p.id, p.title, p.difficulty;
END;
$$ LANGUAGE plpgsql;

-- Insert sample problems (basic starters)
INSERT INTO problems (unique_id, title, slug, difficulty, topic, tags, statement, constraints, mode, starter_code, function_name, visibility)
VALUES (
  'p-001',
  'Two Sum',
  'two-sum',
  'Easy'::problem_difficulty,
  'Arrays',
  ARRAY['Array', 'Hash Map'],
  'Given an array of integers and a target, find two indices that add up to target.',
  ARRAY['0 <= arr length <= 10^5', 'Exactly one solution exists'],
  'stdin',
  jsonb_build_object(
    'javascript', 'const readline = require("readline");',
    'python', 'import sys',
    'java', 'import java.util.*;',
    'c', '#include <stdio.h>',
    'cpp', '#include <bits/stdc++.h>'
  ),
  NULL,
  'public'
)
ON CONFLICT (unique_id) DO NOTHING;

-- Grant permissions
GRANT SELECT ON problems TO authenticated;
GRANT SELECT ON test_cases TO authenticated;
GRANT ALL ON code_submissions TO authenticated;
GRANT ALL ON judge_jobs TO authenticated;
GRANT SELECT ON user_problem_stats TO authenticated;
GRANT SELECT ON language_stats TO authenticated;
GRANT SELECT ON problem_stats TO authenticated;

-- Create indexes for performance
ANALYZE problems;
ANALYZE test_cases;
ANALYZE code_submissions;
ANALYZE judge_jobs;
