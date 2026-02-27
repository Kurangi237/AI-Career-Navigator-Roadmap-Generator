-- Proctor Monitoring & Incident Tracking Schema
-- Migration: 006_proctor_incidents.sql
-- Handles real-time monitoring during exams with face detection, behavioral tracking, and incident logging

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Incident severity levels
CREATE TYPE incident_severity AS ENUM ('low', 'medium', 'high');

-- Incident types detected during proctoring
CREATE TYPE incident_type AS ENUM (
  'tab_switch',           -- User switched browser tabs
  'window_blur',          -- Window lost focus
  'multiple_faces',       -- More than one face detected
  'no_face_detected',     -- Face disappeared from camera
  'abnormal_head_pose',   -- Head turned away significantly
  'gaze_aversion',        -- Eyes not looking at screen
  'audio_missing',        -- Microphone muted/disconnected
  'clipboard_access',     -- Attempted clipboard operations
  'screenshot_detected',  -- Screenshot attempt detected
  'right_click',          -- Right-click/context menu attempt
  'developer_tools',      -- Developer tools activation attempt
  'unusual_typing',       -- Copy-paste pattern detected
  'mobile_detected',      -- Mobile device detected
  'device_change',        -- Different device/IP detected
  'network_anomaly'       -- Unusual network activity
);

-- Action taken on flagged incident
CREATE TYPE incident_action AS ENUM ('none', 'warning', 'pause_exam', 'disqualify');

-- Main proctor incidents table
CREATE TABLE IF NOT EXISTS proctor_incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  incident_type incident_type NOT NULL,
  severity incident_severity NOT NULL DEFAULT 'low',

  -- Incident metadata (JSON for flexibility)
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Example metadata:
  -- {
  --   "face_count": 2,
  --   "confidence": 0.95,
  --   "head_pose": { "yaw": -45, "pitch": 30, "roll": 15 },
  --   "eye_gaze": "away_from_screen",
  --   "focus_loss_duration_ms": 3000,
  --   "tab_switched_to": "google.com"
  -- }

  -- Proof of incident (S3 URL to image/frame)
  proof_image_url TEXT,

  -- Moderation status
  reviewed BOOLEAN DEFAULT FALSE,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_notes TEXT,
  action incident_action DEFAULT 'none',
  action_timestamp TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  incident_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT metadata_not_empty CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX idx_incidents_exam_attempt ON proctor_incidents(exam_attempt_id);
CREATE INDEX idx_incidents_user ON proctor_incidents(user_id);
CREATE INDEX idx_incidents_severity ON proctor_incidents(severity);
CREATE INDEX idx_incidents_reviewed ON proctor_incidents(reviewed) WHERE reviewed = false;
CREATE INDEX idx_incidents_type ON proctor_incidents(incident_type);
CREATE INDEX idx_incidents_timestamp ON proctor_incidents(incident_timestamp DESC);

-- Face detection results (per-second tracking during exam)
CREATE TABLE IF NOT EXISTS face_detection_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  face_count INTEGER NOT NULL,
  confidence NUMERIC(3,2) NOT NULL, -- 0.00-1.00
  head_pose JSONB NOT NULL, -- {yaw, pitch, roll in degrees}
  eye_gaze TEXT, -- 'straight_ahead', 'away_from_screen', 'left', 'right', 'down'
  face_visible BOOLEAN NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_face_logs_exam ON face_detection_logs(exam_attempt_id);
CREATE INDEX idx_face_logs_timestamp ON face_detection_logs(timestamp DESC);

-- Behavioral monitoring logs (tab switches, window focus, clipboard, etc)
CREATE TABLE IF NOT EXISTS behavior_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  behavior_type incident_type NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Example details:
  -- {
  --   "tab_name": "LeetCode Problem #...",
  --   "focus_lost_duration_ms": 2500,
  --   "target_url": "google.com"
  -- }
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_behavior_logs_exam ON behavior_logs(exam_attempt_id);
CREATE INDEX idx_behavior_logs_type ON behavior_logs(behavior_type);
CREATE INDEX idx_behavior_logs_timestamp ON behavior_logs(timestamp DESC);

-- Incident escalation history (track all actions on an incident)
CREATE TABLE IF NOT EXISTS incident_escalations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES proctor_incidents(id) ON DELETE CASCADE,
  previous_action incident_action,
  new_action incident_action NOT NULL,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_escalations_incident ON incident_escalations(incident_id);
CREATE INDEX idx_escalations_actor ON incident_escalations(actor_id);

-- Proctor review queue (assignments for human review)
CREATE TABLE IF NOT EXISTS proctor_review_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  incident_count INTEGER DEFAULT 0,
  high_severity_incidents INTEGER DEFAULT 0,
  priority INTEGER DEFAULT 0, -- Higher = more urgent
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed, escalated
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_review_queue_status ON proctor_review_queue(status);
CREATE INDEX idx_review_queue_priority ON proctor_review_queue(priority DESC, created_at);
CREATE INDEX idx_review_queue_assigned ON proctor_review_queue(assigned_to) WHERE status = 'in_progress';

-- Violation history per user (for tracking repeat offenders)
CREATE TABLE IF NOT EXISTS user_violation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  incident_id UUID NOT NULL REFERENCES proctor_incidents(id) ON DELETE CASCADE,
  incident_type incident_type NOT NULL,
  incident_severity incident_severity NOT NULL,
  exam_id UUID,
  action incident_action,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_violations_user ON user_violation_history(user_id);
CREATE INDEX idx_violations_incident_type ON user_violation_history(incident_type);
CREATE INDEX idx_violations_timestamp ON user_violation_history(timestamp DESC);
-- Composite index for finding repeat offenders
CREATE INDEX idx_violations_user_type ON user_violation_history(user_id, incident_type);

-- Enable RLS
ALTER TABLE proctor_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_detection_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavior_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE proctor_review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_violation_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view incidents from their own exams
CREATE POLICY "Users can view own proctor incidents"
  ON proctor_incidents FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (SELECT user_id FROM auth.users WHERE role = 'admin')
  );

-- Admin only: create incidents
CREATE POLICY "Admins can create incidents"
  ON proctor_incidents FOR INSERT
  WITH CHECK (auth.role() = 'admin');

-- Admin only: review and act on incidents
CREATE POLICY "Admins can update proctor incidents"
  ON proctor_incidents FOR UPDATE
  USING (auth.role() = 'admin')
  WITH CHECK (auth.role() = 'admin');

-- Face detection logs: user can view own, admin can view all
CREATE POLICY "Users can view own face detection logs"
  ON face_detection_logs FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM exam_attempts WHERE id = exam_attempt_id
    )
    OR auth.role() = 'admin'
  );

CREATE POLICY "System can insert face detection logs"
  ON face_detection_logs FOR INSERT
  WITH CHECK (true);

-- Behavior logs: similar permissions
CREATE POLICY "Users can view own behavior logs"
  ON behavior_logs FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM exam_attempts WHERE id = exam_attempt_id
    )
    OR auth.role() = 'admin'
  );

CREATE POLICY "System can insert behavior logs"
  ON behavior_logs FOR INSERT
  WITH CHECK (true);

-- Escalation history: visible to incident reviewers and admins
CREATE POLICY "Admins can view escalation history"
  ON incident_escalations FOR SELECT
  USING (auth.role() = 'admin');

CREATE POLICY "System can insert escalations"
  ON incident_escalations FOR INSERT
  WITH CHECK (true);

-- Review queue: visible to assigned proctors and admins
CREATE POLICY "Proctors can view assigned reviews"
  ON proctor_review_queue FOR SELECT
  USING (
    assigned_to = auth.uid()
    OR auth.role() = 'admin'
  );

CREATE POLICY "Admins can manage review queue"
  ON proctor_review_queue FOR INSERT
  WITH CHECK (auth.role() = 'admin');

-- Violation history: admin only
CREATE POLICY "Admins can view violation history"
  ON user_violation_history FOR SELECT
  USING (auth.role() = 'admin');

CREATE POLICY "System can insert violations"
  ON user_violation_history FOR INSERT
  WITH CHECK (true);

-- Triggers

-- Trigger: Auto-flag high severity incidents to review queue
CREATE OR REPLACE FUNCTION flag_high_severity_incidents()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.severity = 'high' THEN
    INSERT INTO proctor_review_queue (
      exam_attempt_id,
      incident_count,
      high_severity_incidents,
      priority
    )
    SELECT
      NEW.exam_attempt_id,
      COUNT(*),
      SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END),
      CASE
        WHEN SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) >= 3 THEN 100
        WHEN SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) = 2 THEN 50
        ELSE 25
      END
    FROM proctor_incidents
    WHERE exam_attempt_id = NEW.exam_attempt_id
    ON CONFLICT (exam_attempt_id) DO UPDATE SET
      incident_count = EXCLUDED.incident_count,
      high_severity_incidents = EXCLUDED.high_severity_incidents,
      priority = GREATEST(proctor_review_queue.priority, EXCLUDED.priority);
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_flag_high_severity ON proctor_incidents;
CREATE TRIGGER trigger_flag_high_severity
  AFTER INSERT ON proctor_incidents
  FOR EACH ROW
  EXECUTE FUNCTION flag_high_severity_incidents();

-- Trigger: Record violation history when incident action is taken
CREATE OR REPLACE FUNCTION record_violation_history()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.action != OLD.action AND NEW.action != 'none' THEN
    INSERT INTO user_violation_history (
      user_id,
      incident_id,
      incident_type,
      incident_severity,
      exam_id,
      action
    )
    SELECT
      NEW.user_id,
      NEW.id,
      NEW.incident_type,
      NEW.severity,
      ea.exam_id,
      NEW.action
    FROM exam_attempts ea
    WHERE ea.id = NEW.exam_attempt_id;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_record_violation ON proctor_incidents;
CREATE TRIGGER trigger_record_violation
  AFTER UPDATE ON proctor_incidents
  FOR EACH ROW
  EXECUTE FUNCTION record_violation_history();

-- Views

-- Summary of incidents per exam with statistics
CREATE OR REPLACE VIEW exam_incident_summary AS
SELECT
  ea.id as exam_attempt_id,
  ea.user_id,
  ea.exam_id,
  COUNT(pi.id) as total_incidents,
  SUM(CASE WHEN pi.severity = 'high' THEN 1 ELSE 0 END) as high_severity_count,
  SUM(CASE WHEN pi.severity = 'medium' THEN 1 ELSE 0 END) as medium_severity_count,
  SUM(CASE WHEN pi.severity = 'low' THEN 1 ELSE 0 END) as low_severity_count,
  COUNT(DISTINCT pi.incident_type) as unique_incident_types,
  SUM(CASE WHEN pi.reviewed = true THEN 1 ELSE 0 END) as reviewed_count,
  SUM(CASE WHEN pi.action = 'disqualify' THEN 1 ELSE 0 END) as disqualify_count,
  MAX(pi.incident_timestamp) as last_incident_time
FROM exam_attempts ea
LEFT JOIN proctor_incidents pi ON ea.id = pi.exam_attempt_id
GROUP BY ea.id, ea.user_id, ea.exam_id;

-- High-risk users (repeated violations)
CREATE OR REPLACE VIEW high_risk_users AS
SELECT
  u.id,
  u.email,
  COUNT(DISTINCT uvh.incident_id) as total_violations,
  COUNT(DISTINCT CASE WHEN uvh.incident_severity = 'high' THEN uvh.incident_id END) as high_severity_violations,
  COUNT(DISTINCT uvh.incident_type) as unique_incident_types,
  COUNT(DISTINCT CASE WHEN uvh.action = 'disqualify' THEN uvh.exam_id END) as disqualifications,
  MAX(uvh.timestamp) as last_violation_time
FROM auth.users u
JOIN user_violation_history uvh ON u.id = uvh.user_id
GROUP BY u.id, u.email
HAVING COUNT(DISTINCT uvh.incident_id) >= 2  -- 2+ violations
ORDER BY high_severity_violations DESC, total_violations DESC;

-- Grants

GRANT SELECT ON proctor_incidents TO authenticated;
GRANT INSERT ON face_detection_logs TO authenticated;
GRANT INSERT ON behavior_logs TO authenticated;
GRANT SELECT ON exam_incident_summary TO authenticated;
GRANT SELECT ON high_risk_users TO authenticated;
