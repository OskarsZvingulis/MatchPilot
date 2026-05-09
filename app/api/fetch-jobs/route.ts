/**
 * POST /api/fetch-jobs
 *
 * Server-side job ingestion — fetches all 8 sources using native fetch
 * (no Firecrawl, no external scraping service) and writes directly to the DB.
 *
 * Secured by WORKER_SECRET header, same as the scoring worker.
 *
 * Body (optional JSON):
 *   { sources?: string[] }  — e.g. ["remotive","jobicy"] to run a subset
 *
 * Returns:
 *   { ok: true, ingested: number, skipped: number, errors: string[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ENV } from '@/lib/env';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NormalisedJob {
  source:      string;
  external_id: string;
  company:     string;
  title:       string;
  location:    string | null;
  remote:      string | null;
  url:         string;
  description: string;
  posted_at:   string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html = ''): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ').trim()
    .slice(0, 5000);
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

async function fetchJson(url: string, opts?: RequestInit) {
  const res = await fetch(url, {
    ...opts,
    headers: { 'User-Agent': 'MatchPilot/1.0', ...(opts?.headers ?? {}) },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  return res.json();
}

// ─── Source fetchers ──────────────────────────────────────────────────────────

async function fetchRemotive(): Promise<NormalisedJob[]> {
  const data = await fetchJson(
    'https://remotive.com/api/remote-jobs?category=software-dev&limit=100'
  );
  return (data.jobs ?? []).map((j: Record<string, unknown>) => ({
    source:      'remotive',
    external_id: String(j.id ?? ''),
    company:     String(j.company_name ?? ''),
    title:       String(j.title ?? ''),
    location:    String(j.candidate_required_location ?? 'remote'),
    remote:      'remote',
    url:         String(j.url ?? ''),
    description: stripHtml(String(j.description ?? '')),
    posted_at:   j.publication_date ? new Date(String(j.publication_date)).toISOString() : null,
  }));
}

async function fetchJobicy(): Promise<NormalisedJob[]> {
  const data = await fetchJson(
    'https://jobicy.com/api/v2/remote-jobs?count=50&tag=engineer'
  );
  return (data.jobs ?? []).map((j: Record<string, unknown>) => ({
    source:      'jobicy',
    external_id: String(j.id ?? ''),
    company:     String(j.companyName ?? ''),
    title:       String(j.jobTitle ?? ''),
    location:    String(j.jobGeo ?? 'remote'),
    remote:      'remote',
    url:         String(j.url ?? ''),
    description: stripHtml(String(j.jobDescription ?? '')),
    posted_at:   j.pubDate ? new Date(String(j.pubDate)).toISOString() : null,
  }));
}

async function fetchWeWorkRemotely(): Promise<NormalisedJob[]> {
  const res = await fetch(
    'https://weworkremotely.com/categories/remote-programming-jobs.rss',
    { headers: { 'User-Agent': 'MatchPilot/1.0' }, signal: AbortSignal.timeout(15_000) }
  );
  if (!res.ok) throw new Error(`WWR ${res.status}`);
  const xml = await res.text();

  function tagVal(item: string, tag: string): string {
    const m = item.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i'))
           ?? item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
    return m?.[1]?.trim() ?? '';
  }

  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
  const jobs: NormalisedJob[] = [];
  for (const [, item] of items) {
    const titleFull = tagVal(item, 'title');
    if (!titleFull || titleFull.toLowerCase() === 'view all jobs') continue;
    const colonIdx = titleFull.indexOf(':');
    const company  = colonIdx > 0 ? titleFull.slice(0, colonIdx).trim() : 'Unknown';
    const title    = colonIdx > 0 ? titleFull.slice(colonIdx + 1).trim() : titleFull;
    const url      = tagVal(item, 'guid') || tagVal(item, 'link');
    jobs.push({
      source:      'weworkremotely',
      external_id: url,
      company,
      title,
      location:    'remote',
      remote:      'remote',
      url,
      description: stripHtml(tagVal(item, 'description')),
      posted_at:   tagVal(item, 'pubDate') ? new Date(tagVal(item, 'pubDate')).toISOString() : null,
    });
  }
  return jobs;
}

const ASHBY_COMPANIES = [
  'vercel', 'linear', 'clerk', 'posthog', 'resend',
  'novu', 'liveblocks', 'raycast', 'plain', 'incident.io',
  'sequin', 'knock', 'infisical', 'trigger.dev', 'cal.com',
];

const ASHBY_GQL = `query ApiJobBoardWithTeams($organizationHostedJobsPageName: String!) {
  jobBoard: jobBoardWithTeams(organizationHostedJobsPageName: $organizationHostedJobsPageName) {
    jobPostings { id title locationName isRemote employmentType descriptionHtml }
  }
}`;

async function fetchAshby(): Promise<NormalisedJob[]> {
  const jobs: NormalisedJob[] = [];
  for (const slug of ASHBY_COMPANIES) {
    try {
      const data = await fetchJson(
        'https://jobs.ashbyhq.com/api/non-authenticated-graphql',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operationName: 'ApiJobBoardWithTeams',
            variables: { organizationHostedJobsPageName: slug },
            query: ASHBY_GQL,
          }),
        }
      );
      const postings: Record<string, unknown>[] =
        data?.data?.jobBoard?.jobPostings ?? [];
      for (const j of postings) {
        jobs.push({
          source:      'ashby',
          external_id: String(j.id ?? ''),
          company:     slug,
          title:       String(j.title ?? '').trim(),
          location:    String(j.locationName ?? ''),
          remote:      j.isRemote ? 'remote' : null,
          url:         `https://jobs.ashbyhq.com/${slug}/${j.id}`,
          description: stripHtml(String(j.descriptionHtml ?? '')),
          posted_at:   null,
        });
      }
    } catch {
      // company not on Ashby or API error — skip silently
    }
  }
  return jobs;
}

const GREENHOUSE_COMPANIES = [
  'monzo', 'wise', 'starling-bank', 'cleo', 'revolut', 'curve',
  'pismo', 'checkout-com', 'duolingo', 'intercom', 'notion', 'loom',
  'plaid', 'brex', 'vercel', 'supabase', 'posthog', 'linear',
];

async function fetchGreenhouse(): Promise<NormalisedJob[]> {
  const jobs: NormalisedJob[] = [];
  for (const slug of GREENHOUSE_COMPANIES) {
    try {
      const data = await fetchJson(
        `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`
      );
      const companyName: string = (data.company as Record<string,string>)?.name ?? slug;
      for (const j of (data.jobs ?? []) as Record<string, unknown>[]) {
        const loc = (j.location as Record<string, string>)?.name ?? '';
        jobs.push({
          source:      'greenhouse',
          external_id: String(j.id ?? ''),
          company:     companyName,
          title:       String(j.title ?? ''),
          location:    loc,
          remote:      /remote/i.test(loc) ? 'remote' : null,
          url:         String(j.absolute_url ?? ''),
          description: stripHtml(String(j.content ?? '')),
          posted_at:   j.updated_at ? String(j.updated_at) : null,
        });
      }
    } catch {
      // slug not found or API error — skip
    }
  }
  return jobs;
}

const LEVER_COMPANIES = [
  'contentful', 'netlify', 'elastic', 'shopify', 'auth0', 'twilio',
  'heap', 'bitrise', 'miro', 'hotjar', 'personio', 'pleo',
  'deliveroo', 'babylon', 'transfer-wise', 'bereal',
];

async function fetchLever(): Promise<NormalisedJob[]> {
  const jobs: NormalisedJob[] = [];
  for (const slug of LEVER_COMPANIES) {
    try {
      const raw = await fetchJson(`https://api.lever.co/v0/postings/${slug}?mode=json`);
      const postings: Record<string, unknown>[] = Array.isArray(raw) ? raw : (raw as Record<string, unknown[]>).data ?? [];
      for (const j of postings) {
        const cats = j.categories as Record<string, string> | undefined;
        const loc  = cats?.location ?? '';
        const descPlain = String((j.descriptionPlain ?? j.description ?? '') as string);
        jobs.push({
          source:      'lever',
          external_id: String(j.id ?? ''),
          company:     slug,
          title:       String(j.text ?? ''),
          location:    loc,
          remote:      /remote/i.test(loc) ? 'remote' : null,
          url:         String(j.hostedUrl ?? ''),
          description: stripHtml(descPlain).slice(0, 5000),
          posted_at:   null,
        });
      }
    } catch {
      // slug not found or API error — skip
    }
  }
  return jobs;
}

const REED_KEYWORDS = ['TypeScript', 'React', 'Next.js', 'Node.js', 'implementation engineer', 'technical support'];

async function fetchReed(): Promise<NormalisedJob[]> {
  const apiKey = process.env.REED_API_KEY;
  if (!apiKey) return [];
  const auth  = Buffer.from(`${apiKey}:`).toString('base64');
  const jobs: NormalisedJob[] = [];
  const seen  = new Set<string>();
  for (const kw of REED_KEYWORDS) {
    try {
      const data = await fetchJson(
        `https://www.reed.co.uk/api/1.0/search?keywords=${encodeURIComponent(kw)}&resultsToTake=50`,
        { headers: { Authorization: `Basic ${auth}` } }
      );
      for (const j of (data.results ?? []) as Record<string, unknown>[]) {
        const id = String(j.jobId ?? '');
        if (seen.has(id)) continue;
        seen.add(id);
        jobs.push({
          source:      'reed',
          external_id: id,
          company:     String(j.employerName ?? ''),
          title:       String(j.jobTitle ?? ''),
          location:    String(j.locationName ?? ''),
          remote:      /remote/i.test(String(j.locationName ?? '')) ? 'remote' : null,
          url:         String(j.jobUrl ?? ''),
          description: stripHtml(String(j.jobDescription ?? '')),
          posted_at:   j.date ? String(j.date) : null,
        });
      }
    } catch {
      // ignore per-keyword errors
    }
  }
  return jobs;
}

async function fetchAdzuna(): Promise<NormalisedJob[]> {
  const appId  = process.env.ADZUNA_APP_ID;
  const apiKey = process.env.ADZUNA_API_KEY;
  if (!appId || !apiKey) return [];
  const keywords = ['typescript react', 'nextjs developer', 'node.js engineer'];
  const jobs: NormalisedJob[] = [];
  const seen = new Set<string>();
  for (const kw of keywords) {
    try {
      const data = await fetchJson(
        `https://api.adzuna.com/v1/api/jobs/gb/search/1?app_id=${appId}&app_key=${apiKey}&results_per_page=50&what=${encodeURIComponent(kw)}&content-type=application/json`
      );
      for (const j of (data.results ?? []) as Record<string, unknown>[]) {
        const id = String(j.id ?? '');
        if (seen.has(id)) continue;
        seen.add(id);
        const co = j.company as Record<string,string> | undefined;
        const lo = j.location as Record<string,string> | undefined;
        jobs.push({
          source:      'adzuna',
          external_id: id,
          company:     co?.display_name ?? '',
          title:       String(j.title ?? ''),
          location:    lo?.display_name ?? '',
          remote:      /remote/i.test(String(j.title ?? '')) ? 'remote' : null,
          url:         String(j.redirect_url ?? ''),
          description: stripHtml(String(j.description ?? '')),
          posted_at:   j.created ? String(j.created) : null,
        });
      }
    } catch {
      // ignore per-keyword errors
    }
  }
  return jobs;
}

// ─── DB write ─────────────────────────────────────────────────────────────────

async function writeJob(
  sql: ReturnType<typeof getDb>,
  job: NormalisedJob
): Promise<'inserted' | 'skipped'> {
  const hash = simpleHash(
    [job.source, job.external_id, job.company, job.title, job.url].join('|')
  );
  const rows = await sql`
    INSERT INTO jobs_raw (
      id, title, company, description, location, remote,
      url, posted_at, source, external_id, content_hash
    ) VALUES (
      gen_random_uuid(),
      ${job.title},
      ${job.company},
      ${job.description},
      ${job.location},
      ${job.remote},
      ${job.url},
      ${job.posted_at},
      ${job.source},
      ${job.external_id},
      ${hash}
    )
    ON CONFLICT (content_hash) DO NOTHING
    RETURNING id
  `;
  if (rows.length === 0) return 'skipped';

  const jobId = String(rows[0].id);
  await sql`
    INSERT INTO jobs_queue (job_id, status, attempts)
    VALUES (${jobId}, 'pending', 0)
    ON CONFLICT (job_id) DO NOTHING
  `;
  return 'inserted';
}

// ─── Route handler ────────────────────────────────────────────────────────────

const ALL_SOURCES: Record<string, () => Promise<NormalisedJob[]>> = {
  remotive:        fetchRemotive,
  jobicy:          fetchJobicy,
  weworkremotely:  fetchWeWorkRemotely,
  ashby:           fetchAshby,
  greenhouse:      fetchGreenhouse,
  lever:           fetchLever,
  reed:            fetchReed,
  adzuna:          fetchAdzuna,
};

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-worker-secret');
  if (ENV.WORKER_SECRET && secret !== ENV.WORKER_SECRET) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let requestedSources: string[] = Object.keys(ALL_SOURCES);
  try {
    const body = await req.json().catch(() => ({})) as { sources?: string[] };
    if (Array.isArray(body.sources) && body.sources.length > 0) {
      requestedSources = body.sources.filter(s => s in ALL_SOURCES);
    }
  } catch { /* no body */ }

  const sql     = getDb();
  const errors: string[] = [];
  let   ingested = 0;
  let   skipped  = 0;

  for (const source of requestedSources) {
    try {
      const jobs = await ALL_SOURCES[source]();
      for (const job of jobs) {
        try {
          const result = await writeJob(sql, job);
          if (result === 'inserted') ingested++;
          else skipped++;
        } catch (err) {
          errors.push(`${source}/${job.external_id}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    } catch (err) {
      errors.push(`${source}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({ ok: true, ingested, skipped, errors: errors.slice(0, 20) });
}
