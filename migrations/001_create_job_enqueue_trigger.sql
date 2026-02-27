-- Create jobs_queue table if it doesn't exist
CREATE TABLE IF NOT EXISTS jobs_queue (
    job_id UUID PRIMARY KEY REFERENCES jobs_raw(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    locked_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    error TEXT DEFAULT NULL
);

-- Add index for efficient job selection
CREATE INDEX IF NOT EXISTS idx_jobs_queue_status_created_at ON jobs_queue (status, created_at);

-- Create or replace the function to enqueue jobs
CREATE OR REPLACE FUNCTION enqueue_job_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO jobs_queue (job_id, status)
    VALUES (NEW.id, 'pending');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_enqueue_on_jobs_raw_insert') THEN
        CREATE TRIGGER trg_enqueue_on_jobs_raw_insert
        AFTER INSERT ON jobs_raw
        FOR EACH ROW
        EXECUTE FUNCTION enqueue_job_on_insert();
    END IF;
END
$$;
