// ─── Authoritative types ──────────────────────────────────────────────────────

export type ReviewStatus = 'new' | 'shortlist' | 'applied' | 'skip';

export type JobRow = {
  job_id: string;
  tier: 'A' | 'B' | 'C' | 'reject';
  score: number;
  company?: string | null;
  title?: string | null;
  location?: string | null;
  remote?: string | null;
  posted_at?: string | null;
  scored_at?: string | null;
  status?: ReviewStatus | null;
};

export type RawJob = {
  id: string;
  company?: string | null;
  title?: string | null;
  location?: string | null;
  remote?: string | null;
  url?: string | null;
  description?: string | null;
  posted_at?: string | null;
  ingested_at?: string | null;
  source?: string | null;
  external_id?: string | null;
};

export type ScoredJob = {
  job_id: string;
  tier: 'A' | 'B' | 'C' | 'reject';
  score: number;
  role_category?: string | null;
  experience_band?: string | null;
  remote_feasibility?: string | null;
  red_flags?: string[] | null;
  onsite_required?: boolean | null;
  visa_restriction?: boolean | null;
  tech_mismatch?: boolean | null;
  salary_min_gbp?: number | null;
  salary_max_gbp?: number | null;
};

export type AssetsJob = {
  job_id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  intro_paragraph?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cover_letter?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cv_emphasis?: any;
};

export type ReviewState = {
  job_id: string;
  status: ReviewStatus;
  notes?: string | null;
  updated_at: string;
};

// ─── Runtime validators ───────────────────────────────────────────────────────

const VALID_TIERS = new Set(['A', 'B', 'C', 'reject']);

export function parseJobsResponse(json: unknown): { jobs: JobRow[] } {
  if (!json || typeof json !== 'object') throw new Error('Invalid jobs response shape');
  const obj = json as Record<string, unknown>;
  if (!Array.isArray(obj.jobs)) throw new Error('Invalid jobs response shape');
  const jobs: JobRow[] = obj.jobs.map((item: unknown) => {
    if (!item || typeof item !== 'object') throw new Error('Invalid jobs response shape');
    const row = item as Record<string, unknown>;
    if (typeof row.job_id !== 'string') throw new Error('Invalid jobs response shape');
    if (typeof row.tier !== 'string' || !VALID_TIERS.has(row.tier)) throw new Error('Invalid jobs response shape');
    if (typeof row.score !== 'number') throw new Error('Invalid jobs response shape');
    return row as unknown as JobRow;
  });
  return { jobs };
}

export function parseJobDetailResponse(json: unknown): {
  raw: RawJob;
  scored: ScoredJob | null;
  assets: AssetsJob | null;
  review: ReviewState | null;
} {
  if (!json || typeof json !== 'object') throw new Error('Invalid job detail response shape');
  const obj = json as Record<string, unknown>;

  if (!obj.raw || typeof obj.raw !== 'object') throw new Error('Invalid job detail response shape');
  const raw = obj.raw as Record<string, unknown>;
  if (typeof raw.id !== 'string') throw new Error('Invalid job detail response shape');

  let scored: ScoredJob | null = null;
  if (obj.scored && typeof obj.scored === 'object') {
    const s = obj.scored as Record<string, unknown>;
    if (typeof s.score !== 'number' || typeof s.tier !== 'string') throw new Error('Invalid job detail response shape');
    scored = s as unknown as ScoredJob;
  }

  const assets =
    obj.assets && typeof obj.assets === 'object' ? (obj.assets as AssetsJob) : null;
  const review =
    obj.review && typeof obj.review === 'object' ? (obj.review as ReviewState) : null;

  return { raw: raw as unknown as RawJob, scored, assets, review };
}
