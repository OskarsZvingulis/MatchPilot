import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { scoreJob, generateAssets } from '@/lib/openai';
import { sendTelegramMessage } from '@/lib/telegram';

export async function POST(req: NextRequest) {
  // Parse and validate body
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

  // ── 1. Freeze check ───────────────────────────────────────────────────────
  // Return stored record immediately — no re-scoring, no assets, no Telegram.
  const existing = await sql`SELECT * FROM jobs_scored WHERE job_id = ${job_id} LIMIT 1`;
  if (existing.length > 0) {
    return NextResponse.json(existing[0]);
  }

  // Fetch job from jobs_raw
  const rows = await sql`
    SELECT id, title, company, description
    FROM jobs_raw
    WHERE id = ${job_id}
    LIMIT 1
  `;
  if (rows.length === 0) {
    return NextResponse.json({ error: `Job not found: ${job_id}` }, { status: 404 });
  }

  const { title, company, description } = rows[0];

  // ── 2. LLM Scoring ────────────────────────────────────────────────────────
  let scoring;
  try {
    scoring = await scoreJob(description);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Scoring failed: ${message}` }, { status: 500 });
  }

  // Map visa_restriction string enum → boolean for DB and hard-filter logic.
  // Any value other than "none" means a restriction exists.
  const visa_restriction: boolean = scoring.visa_restriction !== 'none';

  // Insert scored record immediately (tier resolved below)
  try {
    await sql`
      INSERT INTO jobs_scored
        (job_id, role_category, score, experience_band, remote_feasibility,
         reasons, red_flags, onsite_required, visa_restriction,
         salary_min_gbp, salary_max_gbp, tech_mismatch)
      VALUES
        (
          ${job_id},
          ${scoring.role_category},
          ${scoring.score},
          ${scoring.experience_band},
          ${scoring.remote_feasibility},
          ${JSON.stringify(scoring.reasons)},
          ${JSON.stringify(scoring.red_flags)},
          ${scoring.onsite_required},
          ${visa_restriction},
          ${scoring.salary_min_gbp},
          ${scoring.salary_max_gbp},
          ${scoring.tech_mismatch}
        )
    `;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `DB insert failed: ${message}` }, { status: 500 });
  }

  // ── 3. Hard Filters ───────────────────────────────────────────────────────
  // Deterministic rejection — no asset generation, no Telegram.
  const hardReject =
    scoring.role_category === 'reject' ||
    scoring.onsite_required === true ||
    visa_restriction === true ||
    scoring.tech_mismatch === true ||
    (scoring.salary_min_gbp !== null && scoring.salary_min_gbp < 45000);

  if (hardReject) {
    await sql`UPDATE jobs_scored SET tier = 'reject' WHERE job_id = ${job_id}`;
    return NextResponse.json({ job_id, ...scoring, visa_restriction, tier: 'reject' });
  }

  // ── 4. Tier Classification ────────────────────────────────────────────────
  const tier =
    scoring.score >= 85 ? 'A' :
    scoring.score >= 75 ? 'B' :
    scoring.score >= 65 ? 'C' :
                          'reject';

  await sql`UPDATE jobs_scored SET tier = ${tier} WHERE job_id = ${job_id}`;

  // ── 5. Tier Behavior ──────────────────────────────────────────────────────
  if (tier === 'A' || tier === 'B') {
    // Generate assets once — skip if already exist (idempotent)
    const existingAssets = await sql`SELECT job_id FROM job_assets WHERE job_id = ${job_id} LIMIT 1`;
    if (existingAssets.length === 0) {
      try {
        const assets = await generateAssets(title ?? '', company ?? '', description ?? '');
        await sql`
          INSERT INTO job_assets
            (job_id, intro_paragraph, cover_letter, cv_emphasis)
          VALUES
            (
              ${job_id},
              ${assets.intro_paragraph},
              ${assets.cover_letter},
              ${JSON.stringify(assets.cv_emphasis)}
            )
          ON CONFLICT (job_id) DO NOTHING
        `;
      } catch (err) {
        console.error('Asset generation failed:', err);
      }
    }

    // Send Telegram once — idempotency guaranteed by freeze check at route entry
    try {
      await sendTelegramMessage(
        `🔥 MatchPilot Alert\n\nTier: ${tier}\nScore: ${scoring.score}\nRole: ${scoring.role_category}\nBand: ${scoring.experience_band}\nRemote: ${scoring.remote_feasibility}\n\nJob ID: ${job_id}`
      );
    } catch (err) {
      console.error('Telegram notification failed:', err);
    }
  }

  // Tier C and reject: no Telegram, no generation — fall through to return
  return NextResponse.json({ job_id, ...scoring, visa_restriction, tier });
}
