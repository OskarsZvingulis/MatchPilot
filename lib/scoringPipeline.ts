import { getDb } from '@/lib/db';
import { scoreJob } from '@/lib/gemini';
import { sendTelegramMessage } from '@/lib/telegram';
import { CANDIDATE_PROFILE } from '@/lib/candidateProfile';
import { findCanonicalDuplicate, markAsCanonicalDuplicate } from '@/lib/canonicalDedup';

// ─── Constants ────────────────────────────────────────────────────────────────

const SALARY_FLOOR_GBP = CANDIDATE_PROFILE.salaryFloorGbp;

// ─── Types ────────────────────────────────────────────────────────────────────

type Tier           = 'A' | 'B' | 'C' | 'reject';
type EvaluationPath = 'reject_fast' | 'evaluate_but_ineligible' | 'evaluate';
type Recommendation = 'strong_match' | 'possible_match' | 'weak_match' | 'ineligible';

export type ScoringResult = {
  job_id:          string;
  tier:            Tier;
  score:           number;
  role_category:   string;
  recommendation:  Recommendation;
  evaluation_path: EvaluationPath;
  skipped:         boolean;
};

// ─── URL liveness check ───────────────────────────────────────────────────────

/**
 * Check whether a job URL is still live.
 * Returns 'expired' only when we have a confident signal (404/410, or Reed's expired page).
 * Returns 'unknown' on any network/timeout error so we do not block scoring.
 */
async function checkUrlLiveness(url: string): Promise<'live' | 'expired' | 'unknown'> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    const isReed = url.includes('reed.co.uk');

    const res = await fetch(url, {
      method: isReed ? 'GET' : 'HEAD',
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
      redirect: 'follow',
    });
    clearTimeout(timer);

    if (res.status === 404 || res.status === 410) return 'expired';
    if (res.status >= 400) return 'unknown';

    if (isReed) {
      const text = await res.text();
      if (text.includes('This job has expired') || text.includes('job-expired')) {
        return 'expired';
      }
    }

    return 'live';
  } catch {
    return 'unknown';
  }
}

// ─── Derived fields ───────────────────────────────────────────────────────────

function deriveTier(recommendation: Recommendation): Tier {
  if (recommendation === 'strong_match')   return 'A';
  if (recommendation === 'possible_match') return 'B';
  if (recommendation === 'weak_match')     return 'C';
  return 'reject';
}

function deriveRecommendation(score: number, isIneligible: boolean): Recommendation {
  if (isIneligible) return 'ineligible';
  if (score >= 85)  return 'strong_match';
  if (score >= 75)  return 'possible_match';
  if (score >= 65)  return 'weak_match';
  return 'weak_match';
}

// ─── Main pipeline ────────────────────────────────────────────────────────────

/**
 * Run the full scoring pipeline for a single job.
 * Idempotent: if jobs_scored already has a row, returns immediately (skipped=true).
 * Throws on job-not-found or LLM failure — caller is responsible for error handling.
 */
export async function runScoringForJob(job_id: string): Promise<ScoringResult> {
  const sql = getDb();

  // ── Freeze check ───────────────────────────────────────────────────────────
  const existing = await sql`
    SELECT tier, score, role_category, recommendation, evaluation_path
    FROM jobs_scored
    WHERE job_id = ${job_id}
    LIMIT 1
  `;
  if (existing.length > 0) {
    const r = existing[0];
    return {
      job_id,
      tier:            r.tier as Tier,
      score:           Number(r.score),
      role_category:   r.role_category as string,
      recommendation:  (r.recommendation ?? 'ineligible') as Recommendation,
      evaluation_path: (r.evaluation_path ?? 'evaluate') as EvaluationPath,
      skipped: true,
    };
  }

  // ── Fetch raw job ──────────────────────────────────────────────────────────
  const rawRows = await sql`
    SELECT id, title, company, description, remote, url, posted_at
    FROM jobs_raw
    WHERE id = ${job_id}
    LIMIT 1
  `;
  if (rawRows.length === 0) {
    throw new Error(`Job not found: ${job_id}`);
  }

  const { title, company, description, remote } = rawRows[0];
  const jobUrl:    string | null = rawRows[0].url      ?? null;
  const postedAt:  string | null = rawRows[0].posted_at ?? null;

  // ── Level 2 canonical dedup check ─────────────────────────────────────────
  // If this job is a cross-source duplicate of an already-scored job, skip LLM.
  const canonicalMatch = await findCanonicalDuplicate({ job_id, company, title, posted_at: postedAt });
  if (canonicalMatch) {
    await markAsCanonicalDuplicate({ job_id, canonical_id: canonicalMatch.canonical_id });
    await sql`
      INSERT INTO jobs_scored (
        job_id, role_category, score, experience_band, remote_feasibility,
        reasons, red_flags, blockers, onsite_required, visa_restriction,
        salary_min_gbp, salary_max_gbp, tech_mismatch,
        seniority_level, infra_depth, tech_mismatch_level, salary_currency,
        evaluation_path, recommendation, tier
      )
      VALUES (
        ${job_id}, 'reject', 0, 'unknown', 'no',
        ${JSON.stringify(['Cross-source duplicate of already-scored job'])},
        ${JSON.stringify([])},
        ${JSON.stringify(['Duplicate posting from another source — not re-scored'])},
        false, false, null, null, false,
        'unknown', 'none', 'none', 'unknown',
        'reject_fast', 'ineligible', 'reject'
      )
      ON CONFLICT (job_id) DO NOTHING
    `;
    return {
      job_id,
      tier: 'reject',
      score: 0,
      role_category: 'reject',
      recommendation: 'ineligible',
      evaluation_path: 'reject_fast',
      skipped: true,
    };
  }

  // ── URL liveness check (reject_fast path) ─────────────────────────────────
  if (jobUrl) {
    const liveness = await checkUrlLiveness(jobUrl);
    if (liveness === 'expired') {
      await sql`
        INSERT INTO jobs_scored (
          job_id, role_category, score, experience_band, remote_feasibility,
          reasons, red_flags, blockers, onsite_required, visa_restriction,
          salary_min_gbp, salary_max_gbp, tech_mismatch,
          seniority_level, infra_depth, tech_mismatch_level, salary_currency,
          evaluation_path, recommendation, tier
        )
        VALUES (
          ${job_id}, 'reject', 0, 'unknown', 'no',
          ${JSON.stringify(['Job posting has expired'])},
          ${JSON.stringify([])},
          ${JSON.stringify(['Job URL is no longer accessible'])},
          false, false, null, null, false,
          'unknown', 'none', 'none', 'unknown',
          'reject_fast', 'ineligible', 'reject'
        )
        ON CONFLICT (job_id) DO NOTHING
      `;
      await sql`
        INSERT INTO job_review (job_id, status)
        VALUES (${job_id}, 'new')
        ON CONFLICT (job_id) DO NOTHING
      `;
      return {
        job_id,
        tier: 'reject',
        score: 0,
        role_category: 'reject',
        recommendation: 'ineligible',
        evaluation_path: 'reject_fast',
        skipped: true,
      };
    }
  }

  // ── Score with LLM ─────────────────────────────────────────────────────────
  const scoring = await scoreJob(description ?? '', { remote });

  const reasons   = Array.isArray(scoring.reasons)   ? scoring.reasons   : [];
  const redFlags  = Array.isArray(scoring.red_flags)  ? scoring.red_flags : [];

  // ── Deterministic blockers ─────────────────────────────────────────────────
  // Narrow hard gates: each must be a genuine, non-brittle signal.
  const blockers: string[] = [];

  // US-only work authorization: candidate cannot work there.
  if (scoring.visa_restriction === 'us_only') {
    blockers.push('US-only work authorization — candidate not eligible');
  }

  // EU-only work authorization: candidate eligibility is uncertain.
  if (scoring.visa_restriction === 'eu_only') {
    blockers.push('EU-only work authorization — candidate eligibility uncertain');
  }

  // US onsite (belt-and-suspenders — likely already caught by us_only above).
  if (scoring.onsite_required && scoring.visa_restriction === 'us_only') {
    // Already captured in the visa blocker above; do not double-add.
  }

  // Salary explicitly below floor.
  if (scoring.salary_min_gbp !== null && scoring.salary_min_gbp < SALARY_FLOOR_GBP) {
    blockers.push(
      `Stated salary (£${scoring.salary_min_gbp.toLocaleString()}) is below the £${SALARY_FLOOR_GBP.toLocaleString()} floor`
    );
  }

  // Role is clearly non-target (LLM classified as reject).
  // The prompt instructs the LLM to only use 'reject' for clearly non-software roles.
  if (scoring.role_category === 'reject') {
    blockers.push('Role determined as non-target by LLM evaluation');
  }

  // Core stack is fundamentally outside candidate profile.
  // Only fires when the LLM classifies 'major' — prompt instructs this for truly fundamental mismatches.
  if (scoring.tech_mismatch_level === 'major') {
    blockers.push('Core required stack is fundamentally outside candidate profile');
  }

  const isIneligible    = blockers.length > 0;
  const evaluation_path: EvaluationPath = isIneligible ? 'evaluate_but_ineligible' : 'evaluate';

  // ── Tech mismatch cap (soft penalty for 'some', hard for 'major' already above) ──
  let finalScore = scoring.score;
  if (!isIneligible && scoring.tech_mismatch_level === 'some') {
    finalScore = Math.min(finalScore, CANDIDATE_PROFILE.techMismatchSomeCap);
  }

  let recommendation  = deriveRecommendation(finalScore, isIneligible);

  // ── Conservative strong_match guard ───────────────────────────────────────
  // A job cannot be strong_match while structured fields show a real concern.
  // Uses structured fields only — no free-text substring matching.
  if (recommendation === 'strong_match') {
    const hasHeavyInfra    = scoring.infra_depth === 'heavy';
    const hasWorkabilityQ  = scoring.remote_feasibility !== 'good';
    const hasTechGap       = scoring.tech_mismatch_level !== 'none';
    const hasBlockers      = blockers.length > 0;
    const isOverSeniority  = scoring.seniority_level === 'senior' || scoring.seniority_level === 'lead_plus';

    if (hasHeavyInfra || hasWorkabilityQ || hasTechGap || hasBlockers || isOverSeniority) {
      recommendation = 'possible_match';
    }
  }

  const tier: Tier      = deriveTier(recommendation);

  // ── Visa restriction stored as boolean for backwards compat ───────────────
  const visaRestrictionBool: boolean =
    scoring.visa_restriction === 'us_only' || scoring.visa_restriction === 'eu_only';

  // ── Atomic upsert ──────────────────────────────────────────────────────────
  await sql`
    INSERT INTO jobs_scored (
      job_id, role_category, score, experience_band, remote_feasibility,
      reasons, red_flags, blockers, onsite_required, visa_restriction,
      salary_min_gbp, salary_max_gbp, tech_mismatch,
      seniority_level, infra_depth, tech_mismatch_level, salary_currency,
      evaluation_path, recommendation, tier
    )
    VALUES (
      ${job_id},
      ${scoring.role_category},
      ${finalScore},
      ${scoring.experience_band},
      ${scoring.remote_feasibility},
      ${JSON.stringify(reasons)},
      ${JSON.stringify(redFlags)},
      ${JSON.stringify(blockers)},
      ${scoring.onsite_required},
      ${visaRestrictionBool},
      ${scoring.salary_min_gbp},
      ${scoring.salary_max_gbp},
      ${scoring.tech_mismatch},
      ${scoring.seniority_level},
      ${scoring.infra_depth},
      ${scoring.tech_mismatch_level},
      ${scoring.salary_currency},
      ${evaluation_path},
      ${recommendation},
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
      blockers           = EXCLUDED.blockers,
      onsite_required    = EXCLUDED.onsite_required,
      visa_restriction   = EXCLUDED.visa_restriction,
      salary_min_gbp     = EXCLUDED.salary_min_gbp,
      salary_max_gbp     = EXCLUDED.salary_max_gbp,
      tech_mismatch      = EXCLUDED.tech_mismatch,
      seniority_level    = EXCLUDED.seniority_level,
      infra_depth        = EXCLUDED.infra_depth,
      tech_mismatch_level = EXCLUDED.tech_mismatch_level,
      salary_currency    = EXCLUDED.salary_currency,
      evaluation_path    = EXCLUDED.evaluation_path,
      recommendation     = EXCLUDED.recommendation,
      tier               = EXCLUDED.tier
  `;

  // ── job_review: only insert for evaluate path (not for ineligible/fast-reject) ──
  if (!isIneligible) {
    await sql`
      INSERT INTO job_review (job_id, status)
      VALUES (${job_id}, 'new')
      ON CONFLICT (job_id) DO NOTHING
    `;
  }

  // ── Notify on strong_match ─────────────────────────────────────────────────
  if (recommendation === 'strong_match') {
    try {
      const salaryLine = scoring.salary_min_gbp || scoring.salary_max_gbp
        ? `\n💰 ${scoring.salary_min_gbp ? `£${scoring.salary_min_gbp.toLocaleString()}` : ''}${scoring.salary_max_gbp ? ` – £${scoring.salary_max_gbp.toLocaleString()}` : ''}`
        : '';
      const topReason  = reasons[0]  ? `\n✅ ${reasons[0]}`  : '';
      const topFlag    = redFlags[0] ? `\n⚠️ ${redFlags[0]}` : '';
      const msg = [
        `🔥 Strong Match — Score ${finalScore}`,
        ``,
        `${String(title ?? 'Unknown role')}`,
        `${String(company ?? 'Unknown company')}`,
        ``,
        `${scoring.role_category} · ${scoring.experience_band} · ${scoring.remote_feasibility}`,
        `${salaryLine}${topReason}${topFlag}`,
        ``,
        jobUrl ?? '',
      ].join('\n').trim();

      await sendTelegramMessage(msg);
      await sql`
        INSERT INTO job_notifications (job_id, channel)
        VALUES (${job_id}, 'telegram')
        ON CONFLICT (job_id) DO NOTHING
      `;
    } catch (err) {
      console.error('Telegram notification failed:', err);
    }
  }

  return {
    job_id,
    tier,
    score: finalScore,
    role_category: scoring.role_category,
    recommendation,
    evaluation_path,
    skipped: false,
  };
}
