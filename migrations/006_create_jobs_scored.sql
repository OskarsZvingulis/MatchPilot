CREATE TABLE IF NOT EXISTS jobs_scored (
  job_id             UUID PRIMARY KEY REFERENCES jobs_raw(id) ON DELETE CASCADE,
  tier               TEXT NOT NULL,
  score              NUMERIC NOT NULL,
  role_category      TEXT,
  experience_band    TEXT,
  remote_feasibility TEXT,
  reasons            JSONB,
  red_flags          JSONB,
  onsite_required    BOOLEAN,
  visa_restriction   BOOLEAN,
  tech_mismatch      BOOLEAN,
  salary_min_gbp     NUMERIC,
  salary_max_gbp     NUMERIC,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
