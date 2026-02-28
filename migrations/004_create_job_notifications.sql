CREATE TABLE IF NOT EXISTS job_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs_raw(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'telegram',
  message_id TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_action TEXT,
  action_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_job_notifications_job_id ON job_notifications (job_id);