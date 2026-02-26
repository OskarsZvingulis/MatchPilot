import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Missing job id' }, { status: 400 });
  }

  const sql = getDb();

  // Fetch raw job — 404 if not found
  const rawRows = await sql`
    SELECT id, company, title, location, remote, url, description,
           posted_at, ingested_at, source, external_id
    FROM jobs_raw
    WHERE id = ${id}
    LIMIT 1
  `;
  if (rawRows.length === 0) {
    return NextResponse.json({ error: `Job not found: ${id}` }, { status: 404 });
  }

  // Fetch scored row and assets in parallel
  const [scoredRows, assetRows] = await Promise.all([
    sql`SELECT * FROM jobs_scored WHERE job_id = ${id} LIMIT 1`,
    sql`SELECT * FROM job_assets  WHERE job_id = ${id} LIMIT 1`,
  ]);

  return NextResponse.json({
    raw:    rawRows[0],
    scored: scoredRows[0] ?? null,
    assets: assetRows[0] ?? null,
  });
}
