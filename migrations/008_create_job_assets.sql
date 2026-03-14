CREATE TABLE IF NOT EXISTS job_assets (
  job_id          UUID PRIMARY KEY REFERENCES jobs_raw(id) ON DELETE CASCADE,
  intro_paragraph TEXT,
  cover_letter    TEXT,
  cv_emphasis     JSONB,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
