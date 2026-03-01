CREATE TABLE IF NOT EXISTS job_apply (
  job_id UUID PRIMARY KEY REFERENCES jobs_raw(id) ON DELETE CASCADE,
  apply_url TEXT,
  method TEXT DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'queued',
  submitted_at TIMESTAMPTZ,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);