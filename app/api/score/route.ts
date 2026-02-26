import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { scoreJob, generateAssets } from '@/lib/openai';
import { sendTelegramMessage } from '@/lib/telegram';

type Tier = 'A' | 'B' | 'C' | 'reject';

function deriveTier(score: number): Tier {
  if (score >= 85) return 'A';
  if (score >= 75) return 'B';
  if (score >= 65) return 'C';
  return 'reject';
}

export async function POST(req: NextRequest) {
  const sql = getDb();

  // ── 1. Parse body ─────────────────────────────────────────────────────────
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

  // ── 2. Freeze check ───────────────────────────────────────────────────────
  const existing = await sql`
    SELECT * FROM jobs_scored WHERE job_id = ${job_id} LIMIT 1
  `;
  if (existing.length > 0) {
    return NextResponse.json(existing[0]);
  }

  // ── 3. Fetch raw job ──────────────────────────────────────────────────────
  const rawRows = await sql`
    SELECT id, title, company, description
    FROM jobs_raw
    WHERE id = ${job_id}
    LIMIT 1
  `;

  if (rawRows.length === 0) {
    return NextResponse.json({ error: `Job not found: ${job_id}` }, { status: 404 });
  }

  const { title, company, description } = rawRows[0];

  // ── 4. Score with LLM ─────────────────────────────────────────────────────
  let scoring;
  try {
    scoring = await scoreJob(description ?? '');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Scoring failed: ${message}` }, { status: 500 });
  }

  const visa_restriction: boolean = scoring.visa_restriction !== 'none';
  const redFlags = Array.isArray(scoring.red_flags) ? scoring.red_flags : [];
  const reasons  = Array.isArray(scoring.reasons)   ? scoring.reasons   : [];

  // ── 5. Hard filters ───────────────────────────────────────────────────────
  const hardReject =
    scoring.role_category === 'reject' ||
    scoring.onsite_required === true ||
    visa_restriction === true ||
    scoring.tech_mismatch === true ||
    (scoring.salary_min_gbp !== null && scoring.salary_min_gbp < 45000);

  const finalScore = scoring.score;
  const tier: Tier = hardReject ? 'reject' : deriveTier(finalScore);

  // ── 6. Atomic upsert ──────────────────────────────────────────────────────
  await sql`
    INSERT INTO jobs_scored (
      job_id,
      role_category,
      score,
      experience_band,
      remote_feasibility,
      reasons,
      red_flags,
      onsite_required,
      visa_restriction,
      salary_min_gbp,
      salary_max_gbp,
      tech_mismatch,
      tier
    )
    VALUES (
      ${job_id},
      ${scoring.role_category},
      ${finalScore},
      ${scoring.experience_band},
      ${scoring.remote_feasibility},
      ${JSON.stringify(reasons)},
      ${JSON.stringify(redFlags)},
      ${scoring.onsite_required},
      ${visa_restriction},
      ${scoring.salary_min_gbp},
      ${scoring.salary_max_gbp},
      ${scoring.tech_mismatch},
      ${tier}
    )
    ON CONFLICT (job_id)
    DO UPDATE SET
      role_category      = EXCLUDED.role_category,
      score              = EXCLUDED.score,
      experience_band    = EXCLUDED.experience_band,
      remote_feasibility = EXCLUDED.remote_feasibility,
      reasons            = EXCLUDED.reasons,
      red_flags          = EXCLUDED.red_flags,
      onsite_required    = EXCLUDED.onsite_required,
      visa_restriction   = EXCLUDED.visa_restriction,
      salary_min_gbp     = EXCLUDED.salary_min_gbp,
      salary_max_gbp     = EXCLUDED.salary_max_gbp,
      tech_mismatch      = EXCLUDED.tech_mismatch,
      tier               = EXCLUDED.tier
  `;

  // ── 7. Tier behavior ──────────────────────────────────────────────────────
  if (tier === 'A' || tier === 'B') {
    const existingAssets = await sql`
      SELECT job_id FROM job_assets WHERE job_id = ${job_id} LIMIT 1
    `;

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

    try {
      await sendTelegramMessage(
        `🔥 MatchPilot Alert

Tier: ${tier}
Score: ${finalScore}
Role: ${scoring.role_category}
Band: ${scoring.experience_band}
Remote: ${scoring.remote_feasibility}

Job ID: ${job_id}`
      );
    } catch (err) {
      console.error('Telegram notification failed:', err);
    }
  }

  return NextResponse.json({ job_id, ...scoring, visa_restriction, tier });
}