import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateAssets } from '@/lib/openai';

export async function POST(req: NextRequest) {
  // 1. Parse and validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { job_id } = body as Record<string, unknown>;
  if (!job_id || typeof job_id !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid "job_id"' }, { status: 400 });
  }

  const sql = getDb();

  // 2. Fetch job from jobs_raw
  const rows = await sql`
    SELECT id, title, company, description
    FROM jobs_raw
    WHERE id = ${job_id}
    LIMIT 1
  `;
  if (rows.length === 0) {
    return NextResponse.json({ error: `Job not found: ${job_id}` }, { status: 404 });
  }

  const { title, company, description } = rows[0];

  // 3. Generate assets
  let assets;
  try {
    assets = await generateAssets(title ?? '', company ?? '', description ?? '');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Asset generation failed: ${message}` }, { status: 500 });
  }

  // 4. Upsert into job_assets
  try {
    await sql`
      INSERT INTO job_assets
        (job_id, intro_paragraph, cover_letter, cv_emphasis)
      VALUES
        (
          ${job_id},
          ${assets.intro_paragraph},
          ${assets.cover_letter},
          ${JSON.stringify(assets.cv_emphasis)}
        )
      ON CONFLICT (job_id)
      DO UPDATE SET
        intro_paragraph = EXCLUDED.intro_paragraph,
        cover_letter = EXCLUDED.cover_letter,
        cv_emphasis = EXCLUDED.cv_emphasis,
        updated_at = now()
    `;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `DB upsert failed: ${message}` }, { status: 500 });
  }

  // 5. Return result
  return NextResponse.json({ job_id, ...assets });
}
