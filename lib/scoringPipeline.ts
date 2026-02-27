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

export type ScoringResult = {
  job_id: string;
  tier: Tier;
  score: number;
  role_category: string;
  skipped: boolean;
};

/**
 * Run the full scoring pipeline for a single job.
 * Idempotent: if jobs_scored already has a row, returns immediately (skipped=true).
 * Throws on job-not-found or LLM failure — caller is responsible for error handling.
 */
export async function runScoringForJob(job_id: string): Promise<ScoringResult> {
  const sql = getDb();

  // ── Freeze check ───────────────────────────────────────────────────────────
  const existing = await sql`
    SELECT tier, score, role_category FROM jobs_scored WHERE job_id = ${job_id} LIMIT 1
  `;
  if (existing.length > 0) {
    return {
      job_id,
      tier: existing[0].tier as Tier,
      score: existing[0].score as number,
      role_category: existing[0].role_category as string,
      skipped: true,
    };
  }

  // ── Fetch raw job ──────────────────────────────────────────────────────────
  const rawRows = await sql`
    SELECT id, title, company, description
    FROM jobs_raw
    WHERE id = ${job_id}
    LIMIT 1
  `;
  if (rawRows.length === 0) {
    throw new Error(`Job not found: ${job_id}`);
  }

  const { title, company, description } = rawRows[0];

  // ── Score with LLM ─────────────────────────────────────────────────────────
  const scoring = await scoreJob(description ?? '');

  const visa_restriction: boolean = scoring.visa_restriction !== 'none';
  const redFlags = Array.isArray(scoring.red_flags) ? scoring.red_flags : [];
  const reasons  = Array.isArray(scoring.reasons)   ? scoring.reasons   : [];

  // ── Hard filters ───────────────────────────────────────────────────────────
  const hardReject =
    scoring.role_category === 'reject' ||
    scoring.onsite_required === true   ||
    visa_restriction === true          ||
    scoring.tech_mismatch === true     ||
    (scoring.salary_min_gbp !== null && scoring.salary_min_gbp < 45000);

  const finalScore = scoring.score;
  const tier: Tier = hardReject ? 'reject' : deriveTier(finalScore);

  // ── Atomic upsert ──────────────────────────────────────────────────────────
  await sql`
    INSERT INTO jobs_scored (
      job_id, role_category, score, experience_band, remote_feasibility,
      reasons, red_flags, onsite_required, visa_restriction,
      salary_min_gbp, salary_max_gbp, tech_mismatch, tier
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

  await sql`
    INSERT INTO job_review (job_id, status)
    VALUES (${job_id}, 'new')
    ON CONFLICT (job_id) DO NOTHING
  `;

  // ── Tier A/B: generate assets + notify ────────────────────────────────────
  if (tier === 'A' || tier === 'B') {
    const existingAssets = await sql`
      SELECT job_id FROM job_assets WHERE job_id = ${job_id} LIMIT 1
    `;

    if (existingAssets.length === 0) {
      try {
        const assets = await generateAssets(title ?? '', company ?? '', description ?? '');
        await sql`
          INSERT INTO job_assets (job_id, intro_paragraph, cover_letter, cv_emphasis)
          VALUES (
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
        `🔥 MatchPilot Alert\n\nTier: ${tier}\nScore: ${finalScore}\nRole: ${scoring.role_category}\nBand: ${scoring.experience_band}\nRemote: ${scoring.remote_feasibility}\n\nJob ID: ${job_id}`,
      );
    } catch (err) {
      console.error('Telegram notification failed:', err);
    }
  }

  return { job_id, tier, score: finalScore, role_category: scoring.role_category, skipped: false };
}
