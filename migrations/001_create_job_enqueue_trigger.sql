-- Create jobs_raw table (UUID-based)
CREATE TABLE IF NOT EXISTS jobs_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  data JSONB
);

-- Create jobs_queue table (aligned with actual DB schema)
CREATE TABLE IF NOT EXISTS jobs_queue (
  job_id UUID PRIMARY KEY REFERENCES jobs_raw(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_at TIMESTAMPTZ DEFAULT NULL,
  error TEXT DEFAULT NULL
);

-- Index for efficient worker selection
CREATE INDEX IF NOT EXISTS idx_jobs_queue_status_created_at
ON jobs_queue (status, created_at);

-- Enqueue trigger function
CREATE OR REPLACE FUNCTION enqueue_job_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO jobs_queue (job_id, status)
  VALUES (NEW.id, 'pending');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_enqueue_on_jobs_raw_insert'
  ) THEN
    CREATE TRIGGER trg_enqueue_on_jobs_raw_insert
    AFTER INSERT ON jobs_raw
    FOR EACH ROW
    EXECUTE FUNCTION enqueue_job_on_insert();
  END IF;
END
$$;