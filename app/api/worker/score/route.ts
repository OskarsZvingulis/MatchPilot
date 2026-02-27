interface JobQueueRow {
  job_id: number;
  status: 'pending' | 'processing' | 'done' | 'failed';
  attempts: number;
  last_error: string | null;
  created_at: Date;
  updated_at: Date;
  locked_at: Date | null;
}

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getDb } from '@/lib/db';
import { runScoringForJob } from '@/lib/scoringPipeline';
import { ENV } from '@/lib/env';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const workerSecret = req.headers.get('x-worker-secret');

  if (ENV.WORKER_SECRET && workerSecret !== ENV.WORKER_SECRET) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const sql = getDb();
  let jobId: number | null = null;
  let response: NextResponse | undefined;
  let jobToProcess: JobQueueRow | null = null; // To hold the job object selected

  try {
    await sql`BEGIN`; // Start transaction

    try {
      const [job] = await sql`
        SELECT *
        FROM jobs_queue
        WHERE
          status = 'pending'
          OR (status = 'failed' AND attempts < 3)
          OR (status = 'processing' AND locked_at < now() - interval '10 minutes')
        ORDER BY created_at
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      ` as [JobQueueRow]; // Cast to JobQueueRow array

      if (!job) {
        await sql`ROLLBACK`; // No job found, rollback
        return NextResponse.json({ ok: true, processed: 0 });
      }

      jobId = job.job_id;
      jobToProcess = job;

      await sql`
        UPDATE jobs_queue
        SET
          status = 'processing',
          locked_at = now(),
          attempts = ${job.attempts + 1}
        WHERE job_id = ${jobId}
      `;

      const [existingScoredJob] = await sql`
        SELECT job_id
        FROM jobs_scored
        WHERE job_id = ${jobId}
      `;

      if (existingScoredJob) {
        await sql`
          UPDATE jobs_queue
          SET status = 'done',
              locked_at = NULL
          WHERE job_id = ${jobId}
        `;
        await sql`COMMIT`; // Duplicate job, commit and skip scoring
        return NextResponse.json({ ok: true, processed: 1, job_id: jobId, skipped: true });
      }

      await sql`COMMIT`; // Commit transaction if job is picked and not skipped

    } catch (transactionError) {
      await sql`ROLLBACK`; // Rollback on any error during transaction setup
      logger.error('Transaction failed', { job_id: jobId || 'N/A', error: transactionError });
      return NextResponse.json({
        ok: false,
        error: transactionError instanceof Error ? `Transaction error: ${transactionError.message}` : `Transaction error: ${String(transactionError)}`
      }, { status: 500 });
    }

    // If a job was picked (jobToProcess is not null) and not skipped, run scoring outside the transaction.
    if (jobToProcess && jobId) {
      try {
        await runScoringForJob(String(jobId));

        // Update status to 'done' outside the explicit transaction
        await sql`
          UPDATE jobs_queue
          SET status = 'done',
              locked_at = NULL
          WHERE job_id = ${jobId}
        `;
        return NextResponse.json({ ok: true, processed: 1, job_id: jobId });
      } catch (scoringError) {
        logger.error("Scoring pipeline failed", { job_id: jobId, error: scoringError });
        // Update status to 'failed'
        await sql`
          UPDATE jobs_queue
          SET status = 'failed',
              error = ${scoringError instanceof Error ? scoringError.message : String(scoringError)},
              locked_at = NULL
          WHERE job_id = ${jobId}
        `;

        await sql`
          INSERT INTO jobs_failures (job_id, source, error, payload)
          VALUES (${jobId}, 'worker', ${scoringError instanceof Error ? scoringError.message : String(scoringError)}, NULL)
        `;
        return NextResponse.json({
          ok: false,
          processed: 1,
          job_id: jobId,
          error: scoringError instanceof Error ? scoringError.message : String(scoringError)
        }, { status: 500 });
      }
    }

    // Fallback if no job was processed or unexpected path
    return NextResponse.json({ ok: true, processed: 0, message: "No job processed or unexpected outcome." });

  } catch (err) {
    // This catch block will only handle errors outside the explicit BEGIN/COMMIT/ROLLBACK blocks
    logger.error('Top-level error', { job_id: jobId || 'N/A', error: err });
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? `Top-level error: ${err.message}` : `Top-level error: ${String(err)}`
    }, { status: 500 });
  }
}
