CREATE TABLE IF NOT EXISTS jobs_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  data JSONB
);