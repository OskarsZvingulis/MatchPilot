-- ── Level 2 cross-source canonical deduplication ───────────────────────────
-- jobs_canonical groups equivalent job postings seen across multiple sources.
-- The representative_job_id points to the first-seen (scored) version.

CREATE TABLE IF NOT EXISTS jobs_canonical (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  representative_job_id UUID        NOT NULL REFERENCES jobs_raw(id) ON DELETE CASCADE,
  title_normalized      TEXT        NOT NULL,
  company_normalized    TEXT        NOT NULL,
  apply_domain          TEXT,
  posted_date           DATE,
  source_count          INT         NOT NULL DEFAULT 1,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS jobs_canonical_lookup_idx
  ON jobs_canonical (company_normalized, title_normalized);

-- FK from jobs_raw to its canonical group (nullable — set when a duplicate is detected)
ALTER TABLE jobs_raw
  ADD COLUMN IF NOT EXISTS canonical_id UUID REFERENCES jobs_canonical(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS jobs_raw_canonical_id_idx
  ON jobs_raw (canonical_id) WHERE canonical_id IS NOT NULL;
