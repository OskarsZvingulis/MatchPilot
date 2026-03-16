-- Migration 012: Add evaluation model fields to jobs_scored
-- Adds fields required for the revised evaluation model:
--   tech_mismatch_level  - was computed but never stored (bug fix)
--   salary_currency      - was computed but never stored (bug fix)
--   evaluation_path      - reject_fast | evaluate_but_ineligible | evaluate
--   recommendation       - strong_match | possible_match | weak_match | ineligible
--   blockers             - array of hard-gate reason strings (distinct from red_flags)

ALTER TABLE jobs_scored
  ADD COLUMN IF NOT EXISTS tech_mismatch_level TEXT,
  ADD COLUMN IF NOT EXISTS salary_currency      TEXT,
  ADD COLUMN IF NOT EXISTS evaluation_path      TEXT,
  ADD COLUMN IF NOT EXISTS recommendation       TEXT,
  ADD COLUMN IF NOT EXISTS blockers             JSONB;

-- Backfill recommendation from existing tier values so the column is usable immediately.
UPDATE jobs_scored SET recommendation =
  CASE tier
    WHEN 'A'      THEN 'strong_match'
    WHEN 'B'      THEN 'possible_match'
    WHEN 'C'      THEN 'weak_match'
    WHEN 'reject' THEN 'ineligible'
    ELSE               'ineligible'
  END
WHERE recommendation IS NULL;

-- Backfill evaluation_path: all existing scored jobs went through the evaluate path.
UPDATE jobs_scored
  SET evaluation_path = 'evaluate'
WHERE evaluation_path IS NULL;

-- Backfill blockers to empty array for existing rows.
UPDATE jobs_scored
  SET blockers = '[]'::jsonb
WHERE blockers IS NULL;
