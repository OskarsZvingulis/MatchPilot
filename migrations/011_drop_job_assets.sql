-- Migration 011: Drop job_assets table
-- Asset generation has been removed from the product direction and must not return.
-- Any leftover data in this table has no value.

DROP TABLE IF EXISTS job_assets;
