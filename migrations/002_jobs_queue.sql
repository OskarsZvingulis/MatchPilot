-- Migration 002: Autonomous scoring queue
-- Run once against your Neon database before starting the worker.

CREATE TABLE IF NOT EXISTS jobs_queue (
  job_id     UUID        PRIMARY KEY REFERENCES jobs_raw(id) ON DELETE CASCADE,
  status     TEXT        NOT NULL DEFAULT 'pending', -- pending | processing | done | failed
  attempts   INT         NOT NULL DEFAULT 0,
  last_error TEXT,
  locked_at  TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS jobs_queue_status_idx ON jobs_queue(status);
