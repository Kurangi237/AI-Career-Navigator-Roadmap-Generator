-- Social Features & Real-time Schema
-- Migration: 009_social_features.sql
-- User relationships, notifications, real-time leaderboards

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User follow relationships
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT no_self_follow CHECK (follower_id != following_id),
  CONSTRAINT unique_follow UNIQUE(follower_id, following_id)
);

CREATE INDEX idx_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_follows_following ON user_follows(following_id);

-- Friend requests
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected, blocked
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_request UNIQUE(sender_id, receiver_id)
);

CREATE INDEX idx_requests_receiver ON friend_requests(receiver_id, status);
CREATE INDEX idx_requests_sender ON friend_requests(sender_id);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- submission_accepted, rank_changed, new_solution, friend_request, etc
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_entity_id UUID, -- problem_id, user_id, contest_id, etc
  related_entity_type VARCHAR(50), -- 'problem', 'contest', 'user', etc
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT, -- Deep link for the notification
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE -- Auto-delete old notifications
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_type ON notifications(type);

-- Notification preferences per user
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_on_submission_verdict BOOLEAN DEFAULT TRUE,
  email_on_contest_start BOOLEAN DEFAULT TRUE,
  email_on_discussion_reply BOOLEAN DEFAULT TRUE,
  email_on_new_editorial BOOLEAN DEFAULT TRUE,
  email_on_new_follower BOOLEAN DEFAULT FALSE,
  push_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME, -- e.g., '22:00:00'
  quiet_hours_end TIME, -- e.g., '08:00:00'
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Achievement badges
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_name VARCHAR(100) NOT NULL,
  achievement_icon TEXT, -- URL or emoji
  description TEXT,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  rarity VARCHAR(20) DEFAULT 'common', -- common, rare, epic, legendary
  CONSTRAINT unique_achievement UNIQUE(user_id, achievement_name)
);

CREATE INDEX idx_achievements_user ON user_achievements(user_id);

-- Achievement definitions
CREATE TABLE IF NOT EXISTS achievement_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  icon TEXT,
  description TEXT,
  criteria JSONB NOT NULL, -- e.g., { "type": "problems_solved", "count": 50 }
  rarity VARCHAR(20) DEFAULT 'common',
  points INT DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Leaderboard snapshots (for real-time displays)
CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  rank INT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INT NOT NULL,
  problems_solved INT NOT NULL,
  last_submission_time BIGINT, -- unix timestamp in ms
  snapshot_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leaderboard_contest ON leaderboard_snapshots(contest_id, rank);
CREATE INDEX idx_leaderboard_user ON leaderboard_snapshots(user_id, contest_id);

-- Live feed events
CREATE TABLE IF NOT EXISTS feed_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- solved_problem, won_contest, earned_badge, etc
  problem_id UUID REFERENCES problems(id),
  contest_id UUID REFERENCES contests(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  visibility VARCHAR(20) DEFAULT 'public', -- public, friends, private
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feed_user ON feed_events(user_id, visibility, created_at DESC);
CREATE INDEX idx_feed_type ON feed_events(event_type);
CREATE INDEX idx_feed_recent ON feed_events(created_at DESC) WHERE visibility != 'private';

-- Enable RLS
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can only see/manage their own follows
CREATE POLICY "Users can view follows" ON user_follows FOR SELECT
  USING (follower_id = auth.uid() OR following_id = auth.uid());

CREATE POLICY "Users can create follows" ON user_follows FOR INSERT
  WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can delete follows" ON user_follows FOR DELETE
  USING (follower_id = auth.uid());

-- Friend requests - users can manage their own
CREATE POLICY "Users can view friend requests" ON friend_requests FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send friend requests" ON friend_requests FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update friend requests" ON friend_requests FOR UPDATE
  USING (receiver_id = auth.uid())
  WITH CHECK (receiver_id = auth.uid());

-- Notifications - only user can view their own
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Notification preferences - user only
CREATE POLICY "Users can view own preferences" ON notification_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own preferences" ON notification_preferences FOR INSERT, UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Achievements - public view, user managing
CREATE POLICY "Public can view achievements" ON user_achievements FOR SELECT
  USING (true);

CREATE POLICY "System can insert achievements" ON user_achievements FOR INSERT
  WITH CHECK (true);

-- Leaderboard - public read
CREATE POLICY "Public can view leaderboard" ON leaderboard_snapshots FOR SELECT
  USING (true);

CREATE POLICY "System can insert leaderboard snapshots" ON leaderboard_snapshots FOR INSERT
  WITH CHECK (true);

-- Feed - respects visibility
CREATE POLICY "Users can view feed events" ON feed_events FOR SELECT
  USING (
    user_id = auth.uid()
    OR visibility = 'public'
    OR (visibility = 'friends' AND user_id IN (
      SELECT following_id FROM user_follows WHERE follower_id = auth.uid()
    ))
  );

CREATE POLICY "Users can create feed events" ON feed_events FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Triggers

-- Auto-create notification preferences on user signup
CREATE OR REPLACE FUNCTION create_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_preferences ON auth.users;
CREATE TRIGGER trigger_create_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_preferences();

-- Trigger to check and award achievements
CREATE OR REPLACE FUNCTION check_achievements()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user earned "50 Problems Solved" badge
  IF (SELECT COUNT(*) FROM code_submissions
      WHERE user_id = NEW.user_id AND status = 'AC') >= 50 THEN
    INSERT INTO user_achievements (user_id, achievement_name, rarity)
    VALUES (NEW.user_id, 'Problem Solver (50)', 'rare')
    ON CONFLICT (user_id, achievement_name) DO NOTHING;
  END IF;

  -- Check if user earned "100 Problems Solved" badge
  IF (SELECT COUNT(*) FROM code_submissions
      WHERE user_id = NEW.user_id AND status = 'AC') >= 100 THEN
    INSERT INTO user_achievements (user_id, achievement_name, rarity)
    VALUES (NEW.user_id, 'Problem Master (100)', 'epic')
    ON CONFLICT (user_id, achievement_name) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Views

-- User statistics with follow counts
CREATE OR REPLACE VIEW user_social_stats AS
SELECT
  u.id,
  u.email,
  (SELECT COUNT(*) FROM user_follows WHERE following_id = u.id) as follower_count,
  (SELECT COUNT(*) FROM user_follows WHERE follower_id = u.id) as following_count,
  (SELECT COUNT(*) FROM code_submissions WHERE user_id = u.id AND status = 'AC') as problems_solved,
  (SELECT COUNT(*) FROM user_achievements WHERE user_id = u.id) as total_achievements,
  (SELECT COUNT(*) FROM notifications WHERE user_id = u.id AND is_read = false) as unread_notifications
FROM auth.users u;

-- Trending problems (solved by friends)
CREATE OR REPLACE VIEW trending_among_friends AS
SELECT
  p.id,
  p.title,
  COUNT(*) as solved_by_friends,
  AVG(cs.runtime_ms) as avg_runtime
FROM problems p
JOIN code_submissions cs ON p.id = cs.problem_id
WHERE cs.status = 'AC'
  AND cs.user_id IN (
    SELECT following_id FROM user_follows WHERE follower_id = auth.uid()
  )
GROUP BY p.id, p.title
ORDER BY solved_by_friends DESC, p.created_at DESC;

-- Grants
GRANT SELECT ON user_social_stats TO authenticated;
GRANT SELECT ON trending_among_friends TO authenticated;
GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON notification_preferences TO authenticated;
