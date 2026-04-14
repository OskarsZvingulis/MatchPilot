-- Migration 014: Add UNIQUE constraint on content_hash
-- 4 n8n workflows (Adzuna, Jobicy, Remotive, WeWorkRemotely) and scripts/seed.ts
-- use ON CONFLICT (content_hash) DO NOTHING, which requires a unique constraint.
-- Migration 010 added the column but the constraint was only created manually in production.
-- CONCURRENTLY is safe on a live table; IF NOT EXISTS makes this idempotent.

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS jobs_raw_content_hash_unique_idx
  ON jobs_raw (content_hash)
  WHERE content_hash IS NOT NULL;
