import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

function str(v: unknown): string | null {
  return v && typeof v === 'string' ? v : null;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const b = body as Record<string, unknown>;

  const title       = str(b.title);
  const company     = str(b.company);
  const description = str(b.description);

  if (!title)       return NextResponse.json({ error: 'Missing or invalid "title"' },       { status: 400 });
  if (!company)     return NextResponse.json({ error: 'Missing or invalid "company"' },     { status: 400 });
  if (!description) return NextResponse.json({ error: 'Missing or invalid "description"' }, { status: 400 });

  const sql = getDb();

  try {
    const rows = await sql`
      INSERT INTO jobs_raw (id, title, company, description, location, remote, url, posted_at, source, external_id)
      VALUES (
        gen_random_uuid(),
        ${title},
        ${company},
        ${description},
        ${str(b.location)},
        ${str(b.remote)},
        ${str(b.url)},
        ${str(b.posted_at)},
        ${str(b.source)},
        ${str(b.external_id)}
      )
      ON CONFLICT DO NOTHING
      RETURNING id
    `;

    if (rows.length === 0) {
      return NextResponse.json({ ok: true, job_id: null, skipped: true });
    }

    const job_id = String(rows[0].id);

    await sql`
      INSERT INTO jobs_queue (job_id, status, attempts)
      VALUES (${job_id}, 'pending', 0)
      ON CONFLICT (job_id) DO NOTHING
    `;

    return NextResponse.json({ ok: true, job_id });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Ingest failed: ${message}` }, { status: 500 });
  }
}
