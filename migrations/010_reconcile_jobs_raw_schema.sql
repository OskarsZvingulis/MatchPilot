-- Migration 010: Reconcile jobs_raw schema
-- These columns exist in production (added manually before migrations tracked them).
-- Adding IF NOT EXISTS makes the migration files authoritative.

ALTER TABLE jobs_raw
  ADD COLUMN IF NOT EXISTS external_id   TEXT,
  ADD COLUMN IF NOT EXISTS company       TEXT,
  ADD COLUMN IF NOT EXISTS title         TEXT,
  ADD COLUMN IF NOT EXISTS location      TEXT,
  ADD COLUMN IF NOT EXISTS remote        TEXT,
  ADD COLUMN IF NOT EXISTS url           TEXT,
  ADD COLUMN IF NOT EXISTS description   TEXT,
  ADD COLUMN IF NOT EXISTS posted_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS content_hash  TEXT,
  ADD COLUMN IF NOT EXISTS ingested_at   TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS source        TEXT,
  ADD COLUMN IF NOT EXISTS source_id     UUID;

-- Source-level dedup: belt-and-suspenders alongside content_hash UNIQUE.
-- Partial index allows NULLs in either column without conflicting.
CREATE UNIQUE INDEX IF NOT EXISTS jobs_raw_source_external_id_idx
  ON jobs_raw (source, external_id)
  WHERE source IS NOT NULL AND external_id IS NOT NULL;
