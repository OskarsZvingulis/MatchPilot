import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { scoreJob } from '@/lib/openai';
import { sendTelegramMessage } from '@/lib/telegram';

export async function POST(req: NextRequest) {
  // 1. Parse and validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { job_id } = body as Record<string, unknown>;
  if (!job_id || typeof job_id !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid "job_id"' }, { status: 400 });
  }

  const sql = getDb();

  // 2. Fetch job from jobs_raw
  const rows = await sql`SELECT id, description FROM jobs_raw WHERE id = ${job_id} LIMIT 1`;
  if (rows.length === 0) {
    return NextResponse.json({ error: `Job not found: ${job_id}` }, { status: 404 });
  }

  const description: string = rows[0].description;

  // 3. Score the job
  let scoring;
  try {
    scoring = await scoreJob(description);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Scoring failed: ${message}` }, { status: 500 });
  }

  // 4. Insert into jobs_scored
  try {
    await sql`
      INSERT INTO jobs_scored
        (job_id, role_category, score, experience_band, remote_feasibility, reasons, red_flags)
      VALUES
        (
          ${job_id},
          ${scoring.role_category},
          ${scoring.score},
          ${scoring.experience_band},
          ${scoring.remote_feasibility},
          ${JSON.stringify(scoring.reasons)},
          ${JSON.stringify(scoring.red_flags)}
        )
      ON CONFLICT (job_id)
      DO UPDATE SET
        role_category = EXCLUDED.role_category,
        score = EXCLUDED.score,
        experience_band = EXCLUDED.experience_band,
        remote_feasibility = EXCLUDED.remote_feasibility,
        reasons = EXCLUDED.reasons,
        red_flags = EXCLUDED.red_flags
    `;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `DB insert failed: ${message}` }, { status: 500 });
  }

  // 5. Notify via Telegram if score meets threshold
  if (scoring.score >= 65) {
    try {
      await sendTelegramMessage(
        `🔥 MatchPilot Alert\n\nScore: ${scoring.score}\nRole: ${scoring.role_category}\nBand: ${scoring.experience_band}\nRemote: ${scoring.remote_feasibility}\n\nJob ID: ${job_id}`
      );
    } catch (err) {
      console.error('Telegram notification failed:', err);
    }
  }

  // 6. Return result
  return NextResponse.json({ job_id, ...scoring });
}
