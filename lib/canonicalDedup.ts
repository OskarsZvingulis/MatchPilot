/**
 * Level 2 cross-source canonical deduplication.
 *
 * Strategy: match on normalised company + normalised title + close posted date.
 * Conservative — only fires when both name and title normalise to the same string.
 * False positives are worse than false negatives here (losing a good job is bad).
 */

import { getDb } from '@/lib/db';

// ─── Normalisation helpers ────────────────────────────────────────────────────

const LEGAL_SUFFIX_RE = /\s*(ltd\.?|limited|inc\.?|llc\.?|plc\.?|corp\.?|corporation|gmbh|b\.?v\.?|a\.?g\.?|s\.?a\.?|co\.?)\s*$/gi;

const SENIORITY_PREFIX_RE = /^(senior|lead|principal|staff|sr\.?|jr\.?|associate|junior|mid[- ]?level|intermediate|entry[- ]?level)\s+/gi;

export function normalizeCompany(name: string | null | undefined): string {
  if (!name) return '';
  return name.replace(LEGAL_SUFFIX_RE, '').toLowerCase().trim().replace(/\s+/g, ' ');
}

export function normalizeTitle(title: string | null | undefined): string {
  if (!title) return '';
  // Remove seniority prefix, lowercase, collapse whitespace, strip location suffix like " - London"
  return title
    .replace(SENIORITY_PREFIX_RE, '')
    .replace(/\s*[-–|]\s*(london|manchester|edinburgh|bristol|uk|remote|hybrid).*$/gi, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export function extractDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const { hostname } = new URL(url);
    // Strip www prefix
    return hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

// ─── Match check ──────────────────────────────────────────────────────────────

export type CanonicalMatch = {
  canonical_id:             string;  // jobs_canonical.id (may be newly created)
  representative_job_id:    string;  // jobs_raw.id of the first-seen version
};

/**
 * Look for an existing canonical group that this job belongs to.
 * Match criteria (all required):
 *   1. Exact normalised company name
 *   2. Exact normalised title
 *   3. Posted date within WINDOW_DAYS (or both null)
 *   4. Job must already be scored (not just ingested)
 *
 * Returns null if no match found (job is novel).
 */
export async function findCanonicalDuplicate(params: {
  job_id:     string;
  company:    string | null;
  title:      string | null;
  posted_at:  string | null;
}): Promise<CanonicalMatch | null> {
  const WINDOW_DAYS = 14;

  const normCompany = normalizeCompany(params.company);
  const normTitle   = normalizeTitle(params.title);

  // Nothing useful to match on
  if (!normCompany || !normTitle) return null;

  const sql = getDb();

  // Find another jobs_raw row that:
  // - has the same normalised company+title
  // - is already in jobs_scored (already processed)
  // - is not the same row
  // - posted within WINDOW_DAYS
  const rows = await sql`
    SELECT
      jr.id            AS job_id,
      jr.canonical_id,
      jr.posted_at
    FROM jobs_raw jr
    JOIN jobs_scored js ON js.job_id = jr.id
    WHERE
      lower(regexp_replace(COALESCE(jr.company, ''), '\s*(ltd\.?|limited|inc\.?|llc\.?|plc\.?|corp\.?|corporation|gmbh|bv|ag|sa|co\.?)\s*$', '', 'gi'))
        = ${normCompany}
      AND lower(
            regexp_replace(
              regexp_replace(COALESCE(jr.title, ''), '^(senior|lead|principal|staff|sr\.?|jr\.?|associate|junior|mid.?level|intermediate|entry.?level)\s+', '', 'gi'),
              '\s*[-–|]\s*(london|manchester|edinburgh|bristol|uk|remote|hybrid).*$', '', 'gi'
            )
          ) = ${normTitle}
      AND jr.id != ${params.job_id}
      AND js.evaluation_path != 'reject_fast'
      AND (
        ${params.posted_at}::timestamptz IS NULL
        OR jr.posted_at IS NULL
        OR ABS(EXTRACT(EPOCH FROM (jr.posted_at::timestamptz - ${params.posted_at}::timestamptz)) / 86400) <= ${WINDOW_DAYS}
      )
    ORDER BY jr.ingested_at ASC
    LIMIT 1
  `;

  if (rows.length === 0) return null;

  const match = rows[0];

  // If the matched row already has a canonical_id, reuse it.
  // Otherwise we need to create a canonical group for it.
  if (match.canonical_id) {
    return { canonical_id: String(match.canonical_id), representative_job_id: String(match.job_id) };
  }

  // Create a new canonical group rooted at the existing (scored) job
  const canonical = await sql`
    INSERT INTO jobs_canonical (representative_job_id, title_normalized, company_normalized, posted_date)
    VALUES (
      ${match.job_id},
      ${normTitle},
      ${normCompany},
      ${params.posted_at ? new Date(params.posted_at).toISOString().split('T')[0] : null}
    )
    RETURNING id
  `;

  const canonicalId = String(canonical[0].id);

  // Back-fill canonical_id on the representative job row
  await sql`
    UPDATE jobs_raw SET canonical_id = ${canonicalId} WHERE id = ${match.job_id}
  `;

  return { canonical_id: canonicalId, representative_job_id: String(match.job_id) };
}

/**
 * Mark a job as a canonical duplicate: set canonical_id on jobs_raw and
 * bump source_count on the canonical group.
 */
export async function markAsCanonicalDuplicate(params: {
  job_id:       string;
  canonical_id: string;
}): Promise<void> {
  const sql = getDb();
  await Promise.all([
    sql`UPDATE jobs_raw SET canonical_id = ${params.canonical_id} WHERE id = ${params.job_id}`,
    sql`UPDATE jobs_canonical SET source_count = source_count + 1 WHERE id = ${params.canonical_id}`,
  ]);
}
