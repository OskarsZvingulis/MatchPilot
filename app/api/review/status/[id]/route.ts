import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const VALID_STATUSES = new Set(['new', 'shortlist', 'applied', 'skip']);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: job_id } = await params;

  if (!job_id) {
    return NextResponse.json({ error: 'Missing job id' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { status } = body as Record<string, unknown>;

  if (!status || typeof status !== 'string' || !VALID_STATUSES.has(status)) {
    return NextResponse.json(
      { error: `Invalid "status" — must be one of: ${[...VALID_STATUSES].join(', ')}` },
      { status: 400 },
    );
  }

  const sql = getDb();

  try {
    await sql`
      insert into job_review (job_id, status)
      values (${job_id}, ${status})
      on conflict (job_id)
      do update set
        status = excluded.status,
        updated_at = now()
    `;

    return NextResponse.json({
      ok: true,
      review: {
        job_id,
        status,
        updated_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `DB upsert failed: ${message}` }, { status: 500 });
  }
}