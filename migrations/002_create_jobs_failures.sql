CREATE TABLE IF NOT EXISTS jobs_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs_raw(id) ON DELETE SET NULL,
  source TEXT,
  error TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jobs_failures_job_id ON jobs_failures (job_id);
CREATE INDEX IF NOT EXISTS idx_jobs_failures_created_at ON jobs_failures (created_at DESC);
