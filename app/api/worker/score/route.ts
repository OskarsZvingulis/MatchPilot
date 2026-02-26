import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { runScoringForJob } from '@/lib/scoringPipeline';

export async function POST() {
  const sql = getDb();

  try {
    const rows = await sql`
      SELECT job_id
      FROM jobs_queue
      WHERE status = 'pending'
      ORDER BY created_at ASC
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ ok: true, processed: 0 });
    }

    const jobId = rows[0].job_id;

    await sql`
      UPDATE jobs_queue
      SET status = 'processing',
          attempts = attempts + 1,
          updated_at = now()
      WHERE job_id = ${jobId}
    `;

    await runScoringForJob(jobId);

    await sql`
      UPDATE jobs_queue
      SET status = 'done',
          updated_at = now()
      WHERE job_id = ${jobId}
    `;

    return NextResponse.json({ ok: true, processed: 1, job_id: jobId });

  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}
