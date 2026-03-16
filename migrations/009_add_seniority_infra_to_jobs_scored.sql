ALTER TABLE jobs_scored
  ADD COLUMN IF NOT EXISTS seniority_level TEXT,
  ADD COLUMN IF NOT EXISTS infra_depth     TEXT;
