import { getDb } from '@/lib/db';
import { extractJob, type JobExtraction } from '@/lib/gemini';
import { sendTelegramMessage } from '@/lib/telegram';
import { CANDIDATE_PROFILE } from '@/lib/candidateProfile';
import { findCanonicalDuplicate, markAsCanonicalDuplicate } from '@/lib/canonicalDedup';

// ─── Constants ────────────────────────────────────────────────────────────────

const SALARY_FLOOR_GBP = CANDIDATE_PROFILE.salaryFloorGbp;
const P = CANDIDATE_PROFILE;

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

// ─── Deterministic score computation ──────────────────────────────────────────
//
// Gemini provides raw_score (rough stack/domain fit estimate) and structured
// signals. This function applies deterministic ceilings and penalties to derive
// the final score. Gemini's raw_score is never used directly as the final score.

function isUSRole(extraction: JobExtraction): boolean {
  return (
    extraction.visa_restriction === 'us_only' ||
    extraction.geography_workability === 'us_remote' ||
    extraction.geography_workability === 'us_onsite'
  );
}

type ScoreComputation = {
  score:            number;
  appliedCeilings:  string[];
  appliedPenalties: string[];
};

function computeScore(extraction: JobExtraction): ScoreComputation {
  const appliedCeilings:  string[] = [];
  const appliedPenalties: string[] = [];

  let ceiling  = 100;
  let rawScore = extraction.raw_score;

  // ── Seniority stretch ──────────────────────────────────────────────────────
  if (extraction.seniority_level === 'senior') {
    const cap = P.seniorityCeilings.senior; // 68
    ceiling = Math.min(ceiling, cap);
    appliedCeilings.push(`senior_ceiling:${cap}`);
    rawScore -= P.penalties.seniorityStretch; // -12
    appliedPenalties.push('seniority_stretch:-12');
  } else if (extraction.seniority_level === 'lead_plus') {
    const cap = P.seniorityCeilings.lead_plus; // 58
    ceiling = Math.min(ceiling, cap);
    appliedCeilings.push(`lead_plus_ceiling:${cap}`);
    rawScore -= P.penalties.seniorityStretch; // -12
    appliedPenalties.push('seniority_stretch:-12');
  }

  // ── Infra / platform / SRE mismatch ──────────────────────────────────────
  if (extraction.infra_depth === 'heavy') {
    const cap = P.scoreCeilings.heavyInfra; // 72
    ceiling = Math.min(ceiling, cap);
    appliedCeilings.push(`heavy_infra_ceiling:${cap}`);
    rawScore -= P.penalties.infraMismatch; // -10
    appliedPenalties.push('infra_mismatch:-10');
  }

  // ── Stack evidence quality ─────────────────────────────────────────────────
  const directCount = extraction.direct_match_signals.length;

  if (directCount === 0) {
    // No direct core stack matches — adjacent or vague evidence only
    const cap = P.scoreCeilings.adjacentStackOnly; // 78
    ceiling = Math.min(ceiling, cap);
    appliedCeilings.push(`adjacent_stack_only_ceiling:${cap}`);
    rawScore -= P.penalties.vagueStackEvidence; // -8
    appliedPenalties.push('vague_stack_evidence:-8');
  } else if (directCount < P.scoreCeilings.minDirectMatchesForFull) {
    // 1–2 direct matches — partial evidence
    const cap = P.scoreCeilings.fewDirectMatches; // 85
    ceiling = Math.min(ceiling, cap);
    appliedCeilings.push(`few_direct_matches_ceiling:${cap}(${directCount})`);
  }
  // 3+ direct matches → no stack-based ceiling

  // ── Hybrid / onsite friction for UK roles ─────────────────────────────────
  // Applies when office attendance is required AND it's not a US role
  // (US roles are typically already blocked by visa restriction)
  if (extraction.onsite_required && !isUSRole(extraction)) {
    rawScore -= P.penalties.hybridOnsiteFriction; // -6
    appliedPenalties.push('hybrid_onsite_friction:-6');
  }

  const score = Math.max(0, Math.min(rawScore, ceiling));

  return { score, appliedCeilings, appliedPenalties };
}

// ─── Derived fields ───────────────────────────────────────────────────────────

function deriveTier(recommendation: Recommendation): Tier {
  if (recommendation === 'strong_match')   return 'A';
  if (recommendation === 'possible_match') return 'B';
  if (recommendation === 'weak_match')     return 'C';
  return 'reject';
}

// A role has "major stretch signals" when the candidate clearly does not fit
// the seniority, infra demands, or management expectations of the role.
// strong_match is blocked when any of these are present.
function hasMajorStretch(extraction: JobExtraction): boolean {
  return (
    extraction.seniority_level === 'senior' ||
    extraction.seniority_level === 'lead_plus' ||
    extraction.infra_depth === 'heavy' ||
    extraction.management_expectation === true
  );
}

function deriveRecommendation(
  score:        number,
  isIneligible: boolean,
  extraction:   JobExtraction,
): Recommendation {
  if (isIneligible) return 'ineligible';

  // strong_match: score >= 86 AND no major stretch signals
  if (score >= 86 && !hasMajorStretch(extraction)) return 'strong_match';

  // possible_match: 72–85 (no fatal blockers already excluded above)
  if (score >= 72) return 'possible_match';

  // weak_match: everything else — includes sub-55 scores with meaningful
  // stretch signals, which are kept visible rather than discarded
  return 'weak_match';
}

// ─── Main pipeline ────────────────────────────────────────────────────────────

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
  const jobUrl:    string | null = rawRows[0].url       ?? null;
  const postedAt:  string | null = rawRows[0].posted_at ?? null;

  // ── Level 2 canonical dedup check ─────────────────────────────────────────
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

  // ── Extract signals with LLM ───────────────────────────────────────────────
  const extraction = await extractJob(description ?? '', { remote });

  // ── Deterministic blockers ─────────────────────────────────────────────────
  // These override anything the LLM says. Only hard, unambiguous gates.
  const blockers: string[] = [];

  if (extraction.visa_restriction === 'us_only') {
    blockers.push('US-only work authorization — candidate not eligible');
  }

  if (extraction.visa_restriction === 'eu_only') {
    blockers.push('EU-only work authorization — candidate eligibility uncertain');
  }

  if (extraction.salary_min_gbp !== null && extraction.salary_min_gbp < SALARY_FLOOR_GBP) {
    blockers.push(
      `Stated salary (£${extraction.salary_min_gbp.toLocaleString()}) is below the £${SALARY_FLOOR_GBP.toLocaleString()} floor`
    );
  }

  if (extraction.role_category === 'reject') {
    blockers.push('Role determined as non-target by LLM evaluation');
  }

  if (extraction.tech_mismatch_level === 'major') {
    blockers.push('Core required stack is fundamentally outside candidate profile');
  }

  const isIneligible    = blockers.length > 0;
  const evaluation_path: EvaluationPath = isIneligible ? 'evaluate_but_ineligible' : 'evaluate';

  // ── Compute final score deterministically ─────────────────────────────────
  // For ineligible jobs, still compute a score (stored for reference) but
  // recommendation will be overridden to 'ineligible'.
  const { score: finalScore } = computeScore(extraction);

  // ── Derive recommendation ─────────────────────────────────────────────────
  const recommendation = deriveRecommendation(finalScore, isIneligible, extraction);
  const tier: Tier      = deriveTier(recommendation);

  // ── Map extraction fields to DB columns ───────────────────────────────────
  // reasons_for  → reasons (positive signals shown in UI)
  // reasons_against → red_flags (negative signals shown in UI)
  const reasons  = extraction.reasons_for;
  const redFlags = extraction.reasons_against;

  // Append ceiling/penalty annotations to red_flags for observability
  if (extraction.seniority_level === 'senior' || extraction.seniority_level === 'lead_plus') {
    const label = extraction.seniority_level === 'senior'
      ? 'Role is explicitly senior — exceeds candidate level'
      : 'Role is lead/staff/principal — significantly exceeds candidate level';
    if (!redFlags.some(f => f.toLowerCase().includes('senior') || f.toLowerCase().includes('lead'))) {
      redFlags.push(label);
    }
  }
  if (extraction.infra_depth === 'heavy') {
    if (!redFlags.some(f => f.toLowerCase().includes('infra'))) {
      redFlags.push('Infrastructure ownership depth (Terraform/ECS/platform) exceeds candidate profile');
    }
  }

  // ── Visa restriction stored as boolean for backwards compat ───────────────
  const visaRestrictionBool: boolean =
    extraction.visa_restriction === 'us_only' || extraction.visa_restriction === 'eu_only';

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
      ${extraction.role_category},
      ${finalScore},
      ${extraction.experience_band},
      ${extraction.remote_feasibility},
      ${JSON.stringify(reasons)},
      ${JSON.stringify(redFlags)},
      ${JSON.stringify(blockers)},
      ${extraction.onsite_required},
      ${visaRestrictionBool},
      ${extraction.salary_min_gbp},
      ${extraction.salary_max_gbp},
      ${extraction.tech_mismatch},
      ${extraction.seniority_level},
      ${extraction.infra_depth},
      ${extraction.tech_mismatch_level},
      ${extraction.salary_currency},
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

  // ── job_review: only insert for evaluate path ──────────────────────────────
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
      const salaryLine = extraction.salary_min_gbp || extraction.salary_max_gbp
        ? `\n💰 ${extraction.salary_min_gbp ? `£${extraction.salary_min_gbp.toLocaleString()}` : ''}${extraction.salary_max_gbp ? ` – £${extraction.salary_max_gbp.toLocaleString()}` : ''}`
        : '';
      const topReason  = reasons[0]   ? `\n✅ ${reasons[0]}`   : '';
      const topFlag    = redFlags[0]  ? `\n⚠️ ${redFlags[0]}` : '';
      const msg = [
        `🔥 Strong Match — Score ${finalScore}`,
        ``,
        `${String(title ?? 'Unknown role')}`,
        `${String(company ?? 'Unknown company')}`,
        ``,
        `${extraction.role_category} · ${extraction.experience_band} · ${extraction.remote_feasibility}`,
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
    role_category: extraction.role_category,
    recommendation,
    evaluation_path,
    skipped: false,
  };
}
