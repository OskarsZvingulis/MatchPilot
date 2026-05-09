/**
 * firecrawl-ingest.mjs
 *
 * Scrapes all 8 job sources via the Firecrawl REST API and posts each job
 * to the MatchPilot /api/ingest endpoint for scoring + storage.
 *
 * Usage:
 *   FIRECRAWL_API_KEY=fc-xxx INGEST_URL=https://your-app.railway.app node scripts/firecrawl-ingest.mjs
 *
 * Or against local dev server:
 *   FIRECRAWL_API_KEY=fc-xxx INGEST_URL=http://localhost:3000 WORKER_SECRET=xxx node scripts/firecrawl-ingest.mjs
 */

import { createHash } from 'node:crypto';

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const INGEST_URL        = process.env.INGEST_URL ?? 'http://localhost:3000';
const WORKER_SECRET     = process.env.WORKER_SECRET ?? '';
const DRY_RUN           = process.env.DRY_RUN === '1';

if (!FIRECRAWL_API_KEY) {
  console.error('❌  FIRECRAWL_API_KEY is required. Get yours at https://firecrawl.dev');
  process.exit(1);
}

// ─── Firecrawl helper ─────────────────────────────────────────────────────────

async function firecrawlScrape(url) {
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${FIRECRAWL_API_KEY}` },
    body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: false }),
  });
  if (!res.ok) throw new Error(`Firecrawl ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.data?.markdown ?? '';
}

// ─── Content hash (matches n8n pipeline) ─────────────────────────────────────

function contentHash(source, externalId, company, title, url) {
  const base = [source, externalId, company, title, url].join('|');
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    hash = ((hash << 5) - hash) + base.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// ─── HTML strip ───────────────────────────────────────────────────────────────

function stripHtml(html = '') {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ').trim()
    .slice(0, 5000);
}

// ─── Ingest a single normalised job ──────────────────────────────────────────

let ingestCount = 0;
let skipCount   = 0;

async function ingestJob(job) {
  if (DRY_RUN) {
    console.log(`  [dry-run] ${job.source} | ${job.company} | ${job.title}`);
    return;
  }
  const hash = contentHash(job.source, job.external_id, job.company, job.title, job.url);
  const body = { ...job, content_hash: hash };
  const res  = await fetch(`${INGEST_URL}/api/ingest`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  if (!res.ok) {
    console.error(`  ⚠️  Ingest failed (${res.status}) for ${job.title} @ ${job.company}`);
    return;
  }
  const data = await res.json();
  if (data.skipped) { skipCount++; return; }
  ingestCount++;

  // Trigger scoring immediately after ingest
  if (data.job_id && WORKER_SECRET) {
    await fetch(`${INGEST_URL}/api/worker/score`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'x-worker-secret': WORKER_SECRET },
      body:    JSON.stringify({ job_id: data.job_id }),
    }).catch(() => {});
  }
}

// ─── Source 1: Remotive ───────────────────────────────────────────────────────

async function scrapeRemotive() {
  console.log('\n🔍 Remotive...');
  const md = await firecrawlScrape('https://remotive.com/api/remote-jobs?category=software-dev&limit=100');
  const m  = md.match(/\{[\s\S]*\}/);
  if (!m) return;
  const { jobs = [] } = JSON.parse(m[0]);
  for (const j of jobs) {
    await ingestJob({
      source:      'remotive',
      external_id: String(j.id ?? ''),
      company:     j.company_name ?? '',
      title:       j.title ?? '',
      location:    j.candidate_required_location ?? 'remote',
      remote:      'remote',
      url:         j.url ?? '',
      description: stripHtml(j.description ?? ''),
      posted_at:   j.publication_date ? new Date(j.publication_date).toISOString() : null,
    });
  }
  console.log(`  ✓ ${jobs.length} jobs`);
}

// ─── Source 2: Jobicy ─────────────────────────────────────────────────────────

async function scrapeJobicy() {
  console.log('\n🔍 Jobicy...');
  const md = await firecrawlScrape('https://jobicy.com/api/v2/remote-jobs?count=50&tag=engineer');
  const m  = md.match(/\{[\s\S]*\}/);
  if (!m) return;
  const { jobs = [] } = JSON.parse(m[0]);
  for (const j of jobs) {
    await ingestJob({
      source:      'jobicy',
      external_id: String(j.id ?? ''),
      company:     j.companyName ?? '',
      title:       j.jobTitle ?? '',
      location:    j.jobGeo ?? 'remote',
      remote:      'remote',
      url:         j.url ?? '',
      description: stripHtml(j.jobDescription ?? ''),
      posted_at:   j.pubDate ? new Date(j.pubDate).toISOString() : null,
    });
  }
  console.log(`  ✓ ${jobs.length} jobs`);
}

// ─── Source 3: We Work Remotely ───────────────────────────────────────────────

async function scrapeWeWorkRemotely() {
  console.log('\n🔍 We Work Remotely...');
  const md = await firecrawlScrape('https://weworkremotely.com/categories/remote-programming-jobs.rss');
  const items = [...md.matchAll(/<item>([\s\S]*?)<\/item>/g)];

  function tag(text, t) {
    const m = text.match(new RegExp(`<${t}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${t}>`)) ??
              text.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)<\\/${t}>`));
    return m?.[1]?.trim() ?? '';
  }

  let count = 0;
  for (const [, item] of items) {
    const titleFull = tag(item, 'title');
    if (!titleFull || titleFull.toLowerCase() === 'view all jobs') continue;
    const [companyRaw, ...titleParts] = titleFull.split(':');
    const company = titleParts.length ? companyRaw.trim() : 'Unknown';
    const title   = titleParts.length ? titleParts.join(':').trim() : titleFull;
    const url     = tag(item, 'guid') || tag(item, 'link');
    await ingestJob({
      source:      'weworkremotely',
      external_id: url,
      company,
      title,
      location:    'remote',
      remote:      'remote',
      url,
      description: stripHtml(tag(item, 'description')),
      posted_at:   tag(item, 'pubDate') ? new Date(tag(item, 'pubDate')).toISOString() : null,
    });
    count++;
  }
  console.log(`  ✓ ${count} jobs`);
}

// ─── Source 4: Ashby (job board web pages) ───────────────────────────────────

const ASHBY_COMPANIES = [
  'vercel', 'linear', 'clerk', 'posthog', 'resend',
  'novu', 'liveblocks', 'raycast', 'plain', 'incident.io',
  'sequin', 'knock', 'infisical', 'trigger.dev', 'cal.com',
];

async function scrapeAshby() {
  console.log('\n🔍 Ashby...');
  let total = 0;

  for (const slug of ASHBY_COMPANIES) {
    try {
      const md = await firecrawlScrape(`https://jobs.ashbyhq.com/${slug}`);
      if (md.includes('Page not found')) continue;

      const matches = [...md.matchAll(/\[(\*\*[^\]]+?\*\*(?:[\s\S]*?))\]\((https:\/\/jobs\.ashbyhq\.com\/[^)]+)\)/g)];
      for (const [, raw, url] of matches) {
        const title    = raw.replace(/\*\*/g, '').split('\\')[0].trim();
        if (!title || title.length < 3) continue;
        const isRemote = /remote/i.test(raw);
        const locMatch = raw.replace(/\\\\/g, '|').match(/•\s*([^•\n]+?)\s*•\s*Full time/);
        const location = locMatch?.[1]?.trim() ?? '';
        const jobId    = url.split('/').at(-1);
        await ingestJob({
          source:      'ashby',
          external_id: jobId,
          company:     slug,
          title,
          location,
          remote:      isRemote ? 'remote' : null,
          url,
          description: `${slug} | ${title} | ${location}`,
          posted_at:   null,
        });
        total++;
      }
    } catch (err) {
      console.warn(`  ⚠️  Ashby ${slug}: ${err.message}`);
    }
  }
  console.log(`  ✓ ${total} jobs across ${ASHBY_COMPANIES.length} companies`);
}

// ─── Source 5: Greenhouse ─────────────────────────────────────────────────────

const GREENHOUSE_COMPANIES = [
  'monzo', 'wise', 'starling-bank', 'cleo', 'revolut', 'curve',
  'pismo', 'checkout-com', 'duolingo', 'intercom', 'notion', 'loom',
  'plaid', 'brex', 'vercel', 'supabase', 'posthog', 'linear',
];

async function scrapeGreenhouse() {
  console.log('\n🔍 Greenhouse...');
  let total = 0;

  for (const slug of GREENHOUSE_COMPANIES) {
    try {
      const md = await firecrawlScrape(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`);
      const jsonMatch = md.match(/\{[\s\S]*\}/);
      if (!jsonMatch) continue;
      const data = JSON.parse(jsonMatch[0]);
      if (data.status === 404 || data.error) continue;
      const companyName = data.company?.name ?? slug;
      for (const j of data.jobs ?? []) {
        const loc = j.location?.name ?? '';
        await ingestJob({
          source:      'greenhouse',
          external_id: String(j.id),
          company:     companyName,
          title:       j.title ?? '',
          location:    loc,
          remote:      /remote/i.test(loc) ? 'remote' : null,
          url:         j.absolute_url ?? '',
          description: stripHtml(j.content ?? ''),
          posted_at:   j.updated_at ?? null,
        });
        total++;
      }
    } catch (err) {
      console.warn(`  ⚠️  Greenhouse ${slug}: ${err.message}`);
    }
  }
  console.log(`  ✓ ${total} jobs across ${GREENHOUSE_COMPANIES.length} companies`);
}

// ─── Source 6: Lever ──────────────────────────────────────────────────────────

const LEVER_COMPANIES = [
  'contentful', 'netlify', 'elastic', 'shopify', 'auth0', 'twilio',
  'heap', 'bitrise', 'miro', 'hotjar', 'personio', 'pleo',
  'deliveroo', 'babylon', 'transfer-wise', 'bereal',
];

async function scrapeLever() {
  console.log('\n🔍 Lever...');
  let total = 0;

  for (const slug of LEVER_COMPANIES) {
    try {
      const md = await firecrawlScrape(`https://api.lever.co/v0/postings/${slug}?mode=json`);
      const jsonMatch = md.match(/\[[\s\S]*\]/) ?? md.match(/\{[\s\S]*\}/);
      if (!jsonMatch) continue;
      const raw  = JSON.parse(jsonMatch[0]);
      const jobs = Array.isArray(raw) ? raw : raw.data ?? [];
      for (const j of jobs) {
        const loc = j.categories?.location ?? '';
        const desc = j.descriptionPlain ?? j.description ?? '';
        await ingestJob({
          source:      'lever',
          external_id: j.id ?? '',
          company:     slug,
          title:       j.text ?? '',
          location:    loc,
          remote:      /remote/i.test(loc) ? 'remote' : null,
          url:         j.hostedUrl ?? '',
          description: stripHtml(desc).slice(0, 5000),
          posted_at:   null,
        });
        total++;
      }
    } catch (err) {
      console.warn(`  ⚠️  Lever ${slug}: ${err.message}`);
    }
  }
  console.log(`  ✓ ${total} jobs across ${LEVER_COMPANIES.length} companies`);
}

// ─── Source 7: Reed (requires API key) ───────────────────────────────────────
//
// Reed uses HTTP Basic auth: API key as username, empty password.
// Set REED_API_KEY env var to enable.

async function scrapeReed() {
  const key = process.env.REED_API_KEY;
  if (!key) { console.log('\n⏭  Reed: skipped (REED_API_KEY not set)'); return; }
  console.log('\n🔍 Reed...');

  const keywords = ['TypeScript', 'React', 'Next.js', 'Node.js', 'implementation engineer', 'technical support'];
  const base64   = Buffer.from(`${key}:`).toString('base64');
  let   total    = 0;

  for (const kw of keywords) {
    try {
      const url = `https://www.reed.co.uk/api/1.0/search?keywords=${encodeURIComponent(kw)}&resultsToTake=50`;
      const res = await fetch(url, { headers: { Authorization: `Basic ${base64}` } });
      if (!res.ok) continue;
      const { results = [] } = await res.json();
      for (const j of results) {
        await ingestJob({
          source:      'reed',
          external_id: String(j.jobId),
          company:     j.employerName ?? '',
          title:       j.jobTitle ?? '',
          location:    j.locationName ?? '',
          remote:      j.locationName?.toLowerCase().includes('remote') ? 'remote' : null,
          url:         j.jobUrl ?? '',
          description: stripHtml(j.jobDescription ?? ''),
          posted_at:   j.date ?? null,
        });
        total++;
      }
    } catch (err) {
      console.warn(`  ⚠️  Reed "${kw}": ${err.message}`);
    }
  }
  console.log(`  ✓ ${total} jobs`);
}

// ─── Source 8: Adzuna (requires API key + app ID) ────────────────────────────
//
// Set ADZUNA_APP_ID and ADZUNA_API_KEY env vars to enable.

async function scrapeAdzuna() {
  const appId = process.env.ADZUNA_APP_ID;
  const apiKey = process.env.ADZUNA_API_KEY;
  if (!appId || !apiKey) { console.log('\n⏭  Adzuna: skipped (ADZUNA_APP_ID / ADZUNA_API_KEY not set)'); return; }
  console.log('\n🔍 Adzuna...');

  const keywords = ['typescript react', 'nextjs developer', 'node.js engineer'];
  let total = 0;

  for (const kw of keywords) {
    try {
      const url = `https://api.adzuna.com/v1/api/jobs/gb/search/1?app_id=${appId}&app_key=${apiKey}&results_per_page=50&what=${encodeURIComponent(kw)}&content-type=application/json`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const { results = [] } = await res.json();
      for (const j of results) {
        await ingestJob({
          source:      'adzuna',
          external_id: j.id ?? '',
          company:     j.company?.display_name ?? '',
          title:       j.title ?? '',
          location:    j.location?.display_name ?? '',
          remote:      j.title?.toLowerCase().includes('remote') ? 'remote' : null,
          url:         j.redirect_url ?? '',
          description: stripHtml(j.description ?? ''),
          posted_at:   j.created ?? null,
        });
        total++;
      }
    } catch (err) {
      console.warn(`  ⚠️  Adzuna "${kw}": ${err.message}`);
    }
  }
  console.log(`  ✓ ${total} jobs`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 MatchPilot Firecrawl Ingest');
  console.log(`   Target: ${INGEST_URL}`);
  console.log(`   Mode:   ${DRY_RUN ? 'dry-run (no DB writes)' : 'live'}`);
  const start = Date.now();

  await scrapeRemotive();
  await scrapeJobicy();
  await scrapeWeWorkRemotely();
  await scrapeAshby();
  await scrapeGreenhouse();
  await scrapeLever();
  await scrapeReed();
  await scrapeAdzuna();

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n✅ Done in ${elapsed}s`);
  console.log(`   New jobs ingested : ${ingestCount}`);
  console.log(`   Duplicates skipped: ${skipCount}`);
}

main().catch(err => { console.error(err); process.exit(1); });
