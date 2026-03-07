import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const VALID_TIERS    = new Set(['A', 'B', 'C', 'reject']);
const VALID_STATUSES = new Set(['new', 'shortlist', 'applied', 'skip']);
const DEFAULT_LIMIT  = 50;
const MAX_LIMIT      = 200;

const VALID_SORT_BY  = new Set(['posted_at', 'location', 'company', 'score', 'tier']);
const VALID_SORT_DIR = new Set(['asc', 'desc']);

// Whitelist mapping for security
const SORT_COLUMN_MAP: Record<string, string> = {
  posted_at: 'j.posted_at',
  location:  'j.location',
  company:   'j.company',
  score:     's.score',
  tier:      's.tier',
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  // Parse tiers
  const tiersParam = searchParams.get('tiers');
  const tiers = tiersParam
    ? tiersParam.split(',').map((t) => t.trim()).filter((t) => VALID_TIERS.has(t))
    : ['A', 'B'];

  // Parse limit
  const rawLimit = parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10);
  const limit = isNaN(rawLimit) ? DEFAULT_LIMIT : Math.min(Math.max(rawLimit, 1), MAX_LIMIT);

  // Parse offset
  const rawOffset = parseInt(searchParams.get('offset') ?? '0', 10);
  const offset = isNaN(rawOffset) || rawOffset < 0 ? 0 : rawOffset;

  if (tiersParam && tiers.length === 0) {
    return NextResponse.json({
      tiers: [],
      limit,
      offset,
      count: 0,
      totalCount: 0,
      jobs: [],
    });
  }

  // Parse optional status filter
  const statusParam = searchParams.get('status');
  const statusFilter: string | null =
    statusParam && VALID_STATUSES.has(statusParam) ? statusParam : null;

  // Parse sorting params
  const sortBy  = searchParams.get('sort_by') ?? 'score';
  const sortDir = searchParams.get('sort_dir') ?? 'desc';

  const validSortBy = VALID_SORT_BY.has(sortBy) ? sortBy : 'score';
  const validSortDir = VALID_SORT_DIR.has(sortDir) ? sortDir : 'desc';

  const sql = getDb();

  // Dynamically build ORDER BY clause
  let orderByClause;
  const primarySortCol = SORT_COLUMN_MAP[validSortBy];

  if (validSortBy === 'tier') {
    const direction = validSortDir === 'asc' ? sql`ASC` : sql`DESC`;
    orderByClause = sql`
      ORDER BY
        CASE s.tier
          WHEN 'A' THEN 1
          WHEN 'B' THEN 2
          WHEN 'C' THEN 3
          ELSE 4
        END ${direction},
        s.score DESC,
        j.posted_at DESC NULLS LAST
    `;
  } else {
    const primaryDirection = validSortDir === 'asc' ? sql`ASC` : sql`DESC`;
    // For text-based fields, add a secondary sort to keep order deterministic
    const secondarySort = (validSortBy === 'company' || validSortBy === 'location')
      ? sql`, s.score DESC`
      : sql``;
      
    // Handle NULLS for posted_at
    const nullsHandling = validSortBy === 'posted_at' ? sql`NULLS LAST` : sql``;

    orderByClause = sql`
      ORDER BY ${sql(primarySortCol)} ${primaryDirection} ${nullsHandling} ${secondarySort}, j.ingested_at DESC
    `;
  }


  try {
    const rows = await sql`
      SELECT
        s.job_id,
        s.tier,
        s.score,
        s.role_category,
        s.experience_band,
        s.remote_feasibility,
        j.company,
        j.title,
        j.location,
        j.remote,
        j.url,
        j.posted_at,
        j.ingested_at,
        EXISTS (
          SELECT 1 FROM job_assets ja WHERE ja.job_id = s.job_id
        ) AS has_assets,
        COALESCE(r.status, 'new') AS status
      FROM jobs_scored s
      JOIN jobs_raw j ON j.id = s.job_id
      LEFT JOIN job_review r ON r.job_id = s.job_id
      WHERE (${tiers}::text[] IS NULL OR s.tier = ANY (${tiers}))
        AND (${statusFilter}::text IS NULL OR COALESCE(r.status, 'new') = ${statusFilter}::text)
      ${orderByClause}
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    // Fetch total count without limit and offset for "Showing X jobs"
    const countRows = await sql`
      SELECT
        COUNT(s.job_id) AS total_count
      FROM jobs_scored s
      JOIN jobs_raw j ON j.id = s.job_id
      LEFT JOIN job_review r ON r.job_id = s.job_id
      WHERE (${tiers}::text[] IS NULL OR s.tier = ANY (${tiers}))
        AND (${statusFilter}::text IS NULL OR COALESCE(r.status, 'new') = ${statusFilter}::text)
    `;

    const totalCount = countRows[0]?.total_count || 0;


    const jobs = rows.map((r) => ({ ...r, score: Number(r.score) }));
    return NextResponse.json({ tiers, limit, offset, count: jobs.length, totalCount: Number(totalCount), jobs });
  }catch (err) {
    console.error('Review jobs route failed:', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
