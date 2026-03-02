import React from 'react';
import Link from 'next/link';
import { headers } from 'next/headers';
import { parseJobsResponse, type JobRow } from '@/lib/reviewContract';
import { TableRow } from './TableRow';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function headerValue(hdrs: any, key: string): string | null {
  if (!hdrs) return null;
  if (typeof hdrs.get === 'function') return hdrs.get(key);
  const lower = key.toLowerCase();
  return hdrs[lower] ?? hdrs[key] ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getBaseUrl(hdrs: any): string {
  const host =
    headerValue(hdrs, 'x-forwarded-host') ??
    headerValue(hdrs, 'host') ??
    'localhost:3000';
  const proto =
    headerValue(hdrs, 'x-forwarded-proto') ??
    (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  return `${proto}://${host}`;
}

const VALID_TIERS    = new Set(['A', 'B', 'C', 'reject']);
const VALID_STATUSES = new Set(['new', 'shortlist', 'applied', 'skip', 'all']);
const LIMIT          = 50;

const TIER_FILTERS = [
  { label: 'All A+B+C', value: 'A,B,C' },
  { label: 'Tier A',  value: 'A'   },
  { label: 'Tier B',  value: 'B'   },
  { label: 'Tier C',  value: 'C'   },
];

const STATUS_FILTERS = [
  { label: 'All',       value: 'all'       },
  { label: 'New',       value: 'new'       },
  { label: 'Shortlist', value: 'shortlist' },
  { label: 'Applied',   value: 'applied'   },
  { label: 'Skip',      value: 'skip'      },
];

function queueUrl(tiers: string, status: string, offset: number): string {
  const p = new URLSearchParams({ tiers });
  if (status !== 'all') p.set('status', status);
  if (offset > 0) p.set('offset', String(offset));
  return `/review?${p.toString()}`;
}

const FILTER_LINK = (active: boolean): React.CSSProperties => ({
  textDecoration: active ? 'none' : 'underline',
  fontWeight:     active ? 'bold' : 'normal',
  color:          active ? '#000' : '#555',
});

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ tiers?: string; status?: string; offset?: string }>;
}) {
  const { tiers: tiersParam, status: statusParam, offset: offsetParam } = await searchParams;

  const activeTiers  = tiersParam ?? 'A,B,C';
  const activeStatus = statusParam && VALID_STATUSES.has(statusParam) ? statusParam : 'new';
  const offset       = Math.max(0, parseInt(offsetParam ?? '0', 10) || 0);

  const tiers = activeTiers
    .split(',')
    .map((t) => t.trim())
    .filter((t) => VALID_TIERS.has(t));
  const validTiers = tiers.length > 0 ? tiers : ['A', 'B', 'C'];

  const hdrs    = await headers();
  const baseUrl = getBaseUrl(hdrs);

  const apiUrl = new URL('/api/review/jobs', baseUrl);
  apiUrl.searchParams.set('tiers',  validTiers.join(','));
  apiUrl.searchParams.set('limit',  String(LIMIT));
  apiUrl.searchParams.set('offset', String(offset));
  if (activeStatus !== 'all') apiUrl.searchParams.set('status', activeStatus);

  const cookieHeader = headerValue(hdrs, 'cookie');
  const res = await fetch(apiUrl, {
    cache: 'no-store',
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });

  let jobs: JobRow[]     = [];
  let count              = 0;
  let totalCount         = 0;
  let fetchError: string | null = null;

  if (!res.ok) {
    fetchError = `API error ${res.status}`;
  } else {
    try {
      const raw = await res.json();
      const data = parseJobsResponse(raw);
      jobs  = data.jobs;
      count = typeof raw.count === 'number' ? raw.count : jobs.length;
      totalCount = typeof raw.totalCount === 'number' ? raw.totalCount : jobs.length;
    } catch (err) {
      fetchError = err instanceof Error ? err.message : String(err);
    }
  }

  const from    = offset + 1;
  const to      = offset + count;
  const hasNext = count === LIMIT;
  const hasPrev = offset > 0;

  return (
    <main style={{ fontFamily: 'monospace', padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '20px', marginBottom: '20px' }}>MatchPilot — Review Queue</h1>

      {/* Tier filters */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '10px', fontSize: '13px' }}>
        {TIER_FILTERS.map(({ label, value }) => (
          <Link key={value} href={queueUrl(value, activeStatus, 0)} style={FILTER_LINK(activeTiers === value)}>
            {label}
          </Link>
        ))}
      </div>

      {/* Status filters */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '16px', fontSize: '13px' }}>
        {STATUS_FILTERS.map(({ label, value }) => (
          <Link key={value} href={queueUrl(activeTiers, value, 0)} style={FILTER_LINK(activeStatus === value)}>
            {label}
          </Link>
        ))}
      </div>

      {fetchError && (
        <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '12px' }}>
          Error: {fetchError}
        </p>
      )}

      {/* Count + pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '12px', color: '#888' }}>
        <span>
          {totalCount === 0 ? '0 jobs' : `Showing ${from}-${to} of ${totalCount} jobs`}
        </span>
        <div style={{ display: 'flex', gap: '16px' }}>
          {hasPrev && (
            <Link href={queueUrl(activeTiers, activeStatus, Math.max(0, offset - LIMIT))} style={{ color: '#1d4ed8' }}>
              ← Prev
            </Link>
          )}
          {hasNext && (
            <Link href={queueUrl(activeTiers, activeStatus, offset + LIMIT)} style={{ color: '#1d4ed8' }}>
              Next →
            </Link>
          )}
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #000', textAlign: 'left' }}>
            {['Tier', 'Score', 'Status', 'Company', 'Title', 'Location', 'Remote', 'Posted'].map((h) => (
              <th key={h} style={{ padding: '6px 10px', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {jobs.map((job: JobRow) => (
            <TableRow key={String(job.job_id)} job={job} />
          ))}
          {jobs.length === 0 && (
            <tr>
              <td colSpan={8} style={{ padding: '20px 10px', color: '#888', textAlign: 'center' }}>
                No jobs found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
