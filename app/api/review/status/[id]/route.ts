import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Required migration (run once against your Neon database):
//
// CREATE TABLE IF NOT EXISTS job_review (
//   id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
//   job_id     UUID        UNIQUE NOT NULL,
//   status     TEXT        NOT NULL,
//   notes      TEXT,
//   updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
// );

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

  const { status, notes } = body as Record<string, unknown>;

  if (!status || typeof status !== 'string' || !VALID_STATUSES.has(status)) {
    return NextResponse.json(
      { error: `Invalid "status" — must be one of: ${[...VALID_STATUSES].join(', ')}` },
      { status: 400 },
    );
  }

  if (notes !== undefined && typeof notes !== 'string') {
    return NextResponse.json({ error: '"notes" must be a string' }, { status: 400 });
  }

  const sql = getDb();

  try {
    const rows = await sql`
      INSERT INTO job_review (job_id, status, notes, updated_at)
      VALUES (${job_id}, ${status}, ${notes ?? null}, now())
      ON CONFLICT (job_id)
      DO UPDATE SET
        status     = EXCLUDED.status,
        notes      = EXCLUDED.notes,
        updated_at = now()
      RETURNING *
    `;

    return NextResponse.json(rows[0]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `DB upsert failed: ${message}` }, { status: 500 });
  }
}
