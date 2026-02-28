import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const VALID_TIERS    = new Set(['A', 'B', 'C', 'reject']);
const VALID_STATUSES = new Set(['new', 'shortlist', 'applied', 'skip']);
const DEFAULT_LIMIT  = 50;
const MAX_LIMIT      = 200;

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

  const sql = getDb();

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
      ORDER BY
        CASE s.tier
          WHEN 'A' THEN 1
          WHEN 'B' THEN 2
          WHEN 'C' THEN 3
          ELSE 4
        END ASC,
        s.score DESC,
        j.posted_at DESC NULLS LAST,
        j.ingested_at DESC
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


    return NextResponse.json({ tiers, limit, offset, count: rows.length, totalCount, jobs: rows });
  }catch (err) {
    console.error('Review jobs route failed:', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
