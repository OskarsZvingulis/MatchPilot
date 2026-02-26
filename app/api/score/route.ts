import { NextRequest, NextResponse } from 'next/server';
import { runScoringForJob } from '@/lib/scoringPipeline';

export async function POST(req: NextRequest) {
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

  try {
    const result = await runScoringForJob(job_id);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.startsWith('Job not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
