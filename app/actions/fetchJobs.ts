'use server';

import { headers } from 'next/headers';

function getBaseUrl(hdrs: Awaited<ReturnType<typeof headers>>): string {
  const get = (k: string) =>
    typeof (hdrs as unknown as { get(k: string): string | null }).get === 'function'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (hdrs as any).get(k)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      : (hdrs as any)[k.toLowerCase()] ?? null;

  const host  = get('x-forwarded-host') ?? get('host') ?? 'localhost:3000';
  const proto = get('x-forwarded-proto') ?? (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  return `${proto}://${host}`;
}

export interface FetchJobsResult {
  ok: boolean;
  ingested: number;
  skipped: number;
  errors: string[];
  errorMessage?: string;
}

export async function triggerFetchJobs(sources?: string[]): Promise<FetchJobsResult> {
  try {
    const hdrs   = await headers();
    const base   = getBaseUrl(hdrs);
    const secret = process.env.WORKER_SECRET;

    const res = await fetch(`${base}/api/fetch-jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret ? { 'x-worker-secret': secret } : {}),
      },
      body: sources && sources.length > 0
        ? JSON.stringify({ sources })
        : JSON.stringify({}),
    });

    if (!res.ok) {
      return { ok: false, ingested: 0, skipped: 0, errors: [], errorMessage: `HTTP ${res.status}` };
    }

    return await res.json() as FetchJobsResult;
  } catch (err) {
    return {
      ok: false,
      ingested: 0,
      skipped: 0,
      errors: [],
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  }
}
