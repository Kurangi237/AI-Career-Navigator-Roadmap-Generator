-- Coding Arena - Discussions, Solutions & Editorials Schema
-- Migration: 007_discussions_and_solutions.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Discussion categories
CREATE TYPE discussion_category AS ENUM ('question', 'solution', 'discussion');
CREATE TYPE discussion_status AS ENUM ('open', 'locked', 'archived');

-- Main discussions table
CREATE TABLE IF NOT EXISTS discussions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category discussion_category NOT NULL DEFAULT 'question',
  status discussion_status NOT NULL DEFAULT 'open',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_solution BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT title_length CHECK (LENGTH(title) >= 5 AND LENGTH(title) <= 200),
  CONSTRAINT body_not_empty CHECK (LENGTH(TRIM(body)) > 0)
);

CREATE INDEX idx_discussions_problem ON discussions(problem_id);
CREATE INDEX idx_discussions_user ON discussions(user_id);
CREATE INDEX idx_discussions_status ON discussions(status);
CREATE INDEX idx_discussions_created ON discussions(created_at DESC);
CREATE INDEX idx_discussions_upvotes ON discussions(upvotes DESC);
CREATE INDEX idx_discussions_pinned ON discussions(is_pinned DESC) WHERE is_pinned = true;

-- Discussion replies (nested comments)
CREATE TABLE IF NOT EXISTS discussion_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_reply_id UUID REFERENCES discussion_replies(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  is_accepted_solution BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT body_not_empty CHECK (LENGTH(TRIM(body)) > 0)
);

CREATE INDEX idx_replies_discussion ON discussion_replies(discussion_id);
CREATE INDEX idx_replies_user ON discussion_replies(user_id);
CREATE INDEX idx_replies_parent ON discussion_replies(parent_reply_id);
CREATE INDEX idx_replies_created ON discussion_replies(created_at DESC);
CREATE INDEX idx_replies_accepted ON discussion_replies(is_accepted_solution) WHERE is_accepted_solution = true;

-- Discussion votes (user voting history)
CREATE TABLE IF NOT EXISTS discussion_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES discussion_replies(id) ON DELETE CASCADE,
  vote_type INTEGER NOT NULL CHECK (vote_type IN (-1, 0, 1)), -- -1: downvote, 1: upvote
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Only vote for one target
  CONSTRAINT vote_target_check CHECK (
    (discussion_id IS NOT NULL AND reply_id IS NULL) OR
    (discussion_id IS NULL AND reply_id IS NOT NULL)
  ),

  -- One vote per user per target
  UNIQUE(user_id, discussion_id),
  UNIQUE(user_id, reply_id)
);

CREATE INDEX idx_votes_user ON discussion_votes(user_id);
CREATE INDEX idx_votes_discussion ON discussion_votes(discussion_id);
CREATE INDEX idx_votes_reply ON discussion_votes(reply_id);

-- Flagged content for moderation
CREATE TABLE IF NOT EXISTS discussion_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES discussion_replies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  admin_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT flag_target_check CHECK (
    (discussion_id IS NOT NULL AND reply_id IS NULL) OR
    (discussion_id IS NULL AND reply_id IS NOT NULL)
  )
);

CREATE INDEX idx_flags_unresolved ON discussion_flags(resolved) WHERE resolved = false;
CREATE INDEX idx_flags_created ON discussion_flags(created_at DESC);

-- Official editorials/solutions
CREATE TABLE IF NOT EXISTS editorials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  approach TEXT NOT NULL,
  complexity_time TEXT NOT NULL, -- e.g., "O(n log n)"
  complexity_space TEXT NOT NULL, -- e.g., "O(n)"
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_editorial_per_problem UNIQUE(problem_id, created_by)
);

CREATE INDEX idx_editorials_problem ON editorials(problem_id);
CREATE INDEX idx_editorials_created ON editorials(created_at DESC);

-- Editorial code solutions in multiple languages
CREATE TABLE IF NOT EXISTS editorial_solutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  editorial_id UUID NOT NULL REFERENCES editorials(id) ON DELETE CASCADE,
  language VARCHAR(20) NOT NULL,
  code TEXT NOT NULL,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT language_solutions_unique UNIQUE(editorial_id, language),
  CONSTRAINT valid_language CHECK (language IN ('javascript', 'python', 'java', 'c', 'cpp'))
);

CREATE INDEX idx_solutions_editorial ON editorial_solutions(editorial_id);

-- Community solutions with upvotes
CREATE TABLE IF NOT EXISTS community_solutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language VARCHAR(20) NOT NULL,
  code TEXT NOT NULL,
  explanation TEXT,
  upvotes INTEGER DEFAULT 0,
  runtime_ms INTEGER,
  memory_used INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_language CHECK (language IN ('javascript', 'python', 'java', 'c', 'cpp'))
);

CREATE INDEX idx_community_solutions_problem ON community_solutions(problem_id);
CREATE INDEX idx_community_solutions_user ON community_solutions(user_id);
CREATE INDEX idx_community_solutions_upvotes ON community_solutions(upvotes DESC);

-- Enable RLS
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE editorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE editorial_solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_solutions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view all discussions
CREATE POLICY "Discussions visible to all authenticated users"
  ON discussions FOR SELECT
  USING (status = 'open' OR auth.uid() = user_id OR auth.role() = 'admin');

-- Users can create discussions
CREATE POLICY "Authenticated users can create discussions"
  ON discussions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update own discussions
CREATE POLICY "Users can update own discussions"
  ON discussions FOR UPDATE
  USING (auth.uid() = user_id OR auth.role() = 'admin')
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'admin');

-- Users can delete own discussions (soft delete via status)
CREATE POLICY "Users can delete own discussions"
  ON discussions FOR DELETE
  USING (auth.uid() = user_id OR auth.role() = 'admin');

-- Similar policies for replies
CREATE POLICY "Replies visible to all"
  ON discussion_replies FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create replies"
  ON discussion_replies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own replies"
  ON discussion_replies FOR UPDATE
  USING (auth.uid() = user_id OR auth.role() = 'admin');

-- Trigger: Update discussion updated_at
CREATE OR REPLACE FUNCTION update_discussion_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_discussion_updated_at ON discussions;
CREATE TRIGGER trigger_discussion_updated_at
  BEFORE UPDATE ON discussions
  FOR EACH ROW
  EXECUTE FUNCTION update_discussion_timestamp();

-- Trigger: Increment reply count when new reply added
CREATE OR REPLACE FUNCTION increment_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE discussions
  SET reply_count = reply_count + 1
  WHERE id = NEW.discussion_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_replies ON discussion_replies;
CREATE TRIGGER trigger_increment_replies
  AFTER INSERT ON discussion_replies
  FOR EACH ROW
  EXECUTE FUNCTION increment_reply_count();

-- Trigger: Update vote counts
CREATE OR REPLACE FUNCTION update_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.discussion_id IS NOT NULL THEN
    IF NEW.vote_type = 1 THEN
      UPDATE discussions SET upvotes = upvotes + 1 WHERE id = NEW.discussion_id;
    ELSIF NEW.vote_type = -1 THEN
      UPDATE discussions SET downvotes = downvotes + 1 WHERE id = NEW.discussion_id;
    END IF;
  ELSIF NEW.reply_id IS NOT NULL THEN
    IF NEW.vote_type = 1 THEN
      UPDATE discussion_replies SET upvotes = upvotes + 1 WHERE id = NEW.reply_id;
    ELSIF NEW.vote_type = -1 THEN
      UPDATE discussion_replies SET downvotes = downvotes + 1 WHERE id = NEW.reply_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_votes ON discussion_votes;
CREATE TRIGGER trigger_update_votes
  AFTER INSERT ON discussion_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_vote_count();

-- Views

CREATE OR REPLACE VIEW discussion_summary AS
SELECT
  d.id,
  d.problem_id,
  d.title,
  d.category,
  d.upvotes,
  reply_count,
  COALESCE(au.email, 'deleted-user') as created_by,
  d.created_at
FROM discussions d
LEFT JOIN auth.users au ON d.user_id = au.id
WHERE d.status = 'open'
ORDER BY d.is_pinned DESC, d.upvotes DESC, d.created_at DESC;

-- Grants
GRANT SELECT ON discussions TO authenticated;
GRANT INSERT ON discussions TO authenticated;
GRANT SELECT, UPDATE ON discussion_replies TO authenticated;
GRANT INSERT ON discussion_replies TO authenticated;
GRANT INSERT, UPDATE(vote_type) ON discussion_votes TO authenticated;
GRANT SELECT ON editorials TO authenticated;
GRANT SELECT ON editorial_solutions TO authenticated;
GRANT SELECT, INSERT ON community_solutions TO authenticated;
