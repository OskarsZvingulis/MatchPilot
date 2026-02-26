import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const VALID_TIERS    = new Set(['A', 'B', 'C', 'reject']);
const VALID_STATUSES = new Set(['new', 'shortlist', 'applied', 'skip']);
const DEFAULT_TIERS  = ['A', 'B'];
const DEFAULT_LIMIT  = 50;
const MAX_LIMIT      = 200;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  // Parse tiers
  const tiersParam = searchParams.get('tiers');
  const tiers = tiersParam
    ? tiersParam.split(',').map((t) => t.trim()).filter((t) => VALID_TIERS.has(t))
    : DEFAULT_TIERS;

  if (tiers.length === 0) {
    return NextResponse.json({ error: 'No valid tiers provided' }, { status: 400 });
  }

  // Parse limit
  const rawLimit = parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10);
  const limit = isNaN(rawLimit) ? DEFAULT_LIMIT : Math.min(Math.max(rawLimit, 1), MAX_LIMIT);

  // Parse offset
  const rawOffset = parseInt(searchParams.get('offset') ?? '0', 10);
  const offset = isNaN(rawOffset) || rawOffset < 0 ? 0 : rawOffset;

  // Parse optional status filter
  const statusParam = searchParams.get('status');
  const statusFilter: string | null =
    statusParam && VALID_STATUSES.has(statusParam) ? statusParam : null;

  const sql = getDb();

  try {
    const rows = await sql`
      SELECT
        js.job_id,
        js.tier,
        js.score,
        js.role_category,
        js.experience_band,
        js.remote_feasibility,
        jr.company,
        jr.title,
        jr.location,
        jr.remote,
        jr.url,
        jr.posted_at,
        jr.ingested_at,
        EXISTS (
          SELECT 1 FROM job_assets ja WHERE ja.job_id = js.job_id
        ) AS has_assets,
        COALESCE(r.status, 'new') AS status
      FROM jobs_scored js
      JOIN jobs_raw jr ON jr.id = js.job_id
      LEFT JOIN job_review r ON r.job_id = js.job_id
      WHERE js.tier = ANY (${tiers})
        AND (${statusFilter} IS NULL OR COALESCE(r.status, 'new') = ${statusFilter})
      ORDER BY
        CASE js.tier
          WHEN 'A' THEN 1
          WHEN 'B' THEN 2
          WHEN 'C' THEN 3
          ELSE 4
        END ASC,
        js.score DESC,
        jr.posted_at DESC NULLS LAST,
        jr.ingested_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return NextResponse.json({ tiers, limit, offset, count: rows.length, jobs: rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Query failed: ${message}` }, { status: 500 });
  }
}
