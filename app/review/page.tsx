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
  { label: 'All',    value: 'A,B,C,reject', isReject: false },
  { label: 'A',      value: 'A',            isReject: false },
  { label: 'B',      value: 'B',            isReject: false },
  { label: 'C',      value: 'C',            isReject: false },
  { label: 'Reject', value: 'reject',       isReject: true  },
];

const STATUS_FILTERS = [
  { label: 'All',       value: 'all'       },
  { label: 'New',       value: 'new'       },
  { label: 'Shortlist', value: 'shortlist' },
  { label: 'Applied',   value: 'applied'   },
  { label: 'Skip',      value: 'skip'      },
];

function queueUrl(params: {
  tiers: string;
  status: string;
  offset: number;
  sortBy?: string;
  sortDir?: string;
}): string {
  const p = new URLSearchParams({
    tiers: params.tiers,
    status: params.status,
  });

  if (params.offset > 0) p.set('offset', String(params.offset));
  if (params.sortBy) p.set('sort_by', params.sortBy);
  if (params.sortDir) p.set('sort_dir', params.sortDir);

  return `/review?${p.toString()}`;
}

function SortableHeader({
  label,
  value,
  sortBy,
  sortDir,
  url,
}: {
  label: string;
  value: string;
  sortBy: string;
  sortDir: string;
  url: string;
}) {
  const isSorting = sortBy === value;
  const newSortDir = isSorting ? (sortDir === 'asc' ? 'desc' : 'asc') : 'asc';
  const sortIndicator = isSorting ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';

  const newUrl = new URL(url, 'http://localhost');
  newUrl.searchParams.set('sort_by', value);
  newUrl.searchParams.set('sort_dir', newSortDir);
  newUrl.searchParams.set('offset', '0');


  return (
    <th style={{
      padding: '10px 14px',
      whiteSpace: 'nowrap',
      textAlign: 'left',
      fontSize: '11px',
      fontWeight: '600',
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
    }}>
      <Link href={newUrl.search} style={{ textDecoration: 'none', color: 'inherit' }}>
        {label}{sortIndicator}
      </Link>
    </th>
  );
}

const PILL = (active: boolean): React.CSSProperties => ({
  display: 'inline-block',
  padding: '4px 12px',
  borderRadius: '9999px',
  fontSize: '12px',
  fontWeight: active ? '600' : '400',
  textDecoration: 'none',
  backgroundColor: active ? '#2a2a2a' : '#1a1a1a',
  color: '#e5e5e5',
  border: '1px solid',
  borderColor: active ? '#444444' : '#2a2a2a',
  whiteSpace: 'nowrap' as const,
});

const REJECT_PILL = (active: boolean): React.CSSProperties => ({
  display: 'inline-block',
  padding: '4px 12px',
  borderRadius: '9999px',
  fontSize: '12px',
  fontWeight: active ? '600' : '400',
  textDecoration: 'none',
  backgroundColor: active ? 'rgba(220,38,38,0.15)' : '#1a1a1a',
  color: '#fca5a5',
  border: '1px solid',
  borderColor: active ? 'rgba(220,38,38,0.4)' : 'rgba(220,38,38,0.2)',
  whiteSpace: 'nowrap' as const,
});

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{
    tiers?: string;
    status?: string;
    offset?: string;
    sort_by?: string;
    sort_dir?: string;
  }>;
}) {
  const {
    tiers: tiersParam,
    status: statusParam,
    offset: offsetParam,
    sort_by: sortByParam,
    sort_dir: sortDirParam,
  } = await searchParams;

  const activeTiers  = tiersParam ?? 'A,B,C,reject';
  const activeStatus = statusParam && VALID_STATUSES.has(statusParam) ? statusParam : 'new';
  const offset       = Math.max(0, parseInt(offsetParam ?? '0', 10) || 0);
  const sortBy       = sortByParam ?? 'score';
  const sortDir      = sortDirParam ?? 'desc';

  const tiers = activeTiers
    .split(',')
    .map((t) => t.trim())
    .filter((t) => VALID_TIERS.has(t));
  const validTiers = tiers.length > 0 ? tiers : ['A', 'B', 'C', 'reject'];

  const hdrs    = await headers();
  const baseUrl = getBaseUrl(hdrs);

  const apiUrl = new URL('/api/review/jobs', baseUrl);
  apiUrl.searchParams.set('tiers',    validTiers.join(','));
  apiUrl.searchParams.set('limit',    String(LIMIT));
  apiUrl.searchParams.set('offset',   String(offset));
  apiUrl.searchParams.set('sort_by',  sortBy);
  apiUrl.searchParams.set('sort_dir', sortDir);
  if (activeStatus !== 'all') apiUrl.searchParams.set('status', activeStatus);

  const cookieHeader = headerValue(hdrs, 'cookie');

  let jobs: JobRow[]     = [];
  let count              = 0;
  let totalCount         = 0;
  let fetchError: string | null = null;

  try {
    const res = await fetch(apiUrl, {
      cache: 'no-store',
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    });
    if (!res.ok) {
      fetchError = `API error ${res.status}`;
    } else {
      const raw = await res.json();
      const data = parseJobsResponse(raw);
      jobs  = data.jobs;
      count = typeof raw.count === 'number' ? raw.count : jobs.length;
      totalCount = typeof raw.totalCount === 'number' ? raw.totalCount : jobs.length;
    }
  } catch (err) {
    fetchError = err instanceof Error ? err.message : String(err);
  }

  const from    = offset + 1;
  const to      = offset + count;
  const hasNext = count === LIMIT;
  const hasPrev = offset > 0;

  return (
    <main>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#e5e5e5', margin: '0 0 2px' }}>
            Review Queue
          </h1>
          <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
            {totalCount > 0 ? `${totalCount} jobs` : 'No jobs'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '12px', flexWrap: 'wrap' as const }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
          {TIER_FILTERS.map(({ label, value, isReject }) => (
            <Link
              key={value}
              href={queueUrl({ tiers: value, status: activeStatus, offset: 0, sortBy, sortDir })}
              style={isReject ? REJECT_PILL(activeTiers === value) : PILL(activeTiers === value)}
            >
              {label}
            </Link>
          ))}
        </div>
        <div style={{ width: '1px', backgroundColor: '#2a2a2a', margin: '0 4px' }} />
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
          {STATUS_FILTERS.map(({ label, value }) => (
            <Link
              key={value}
              href={queueUrl({ tiers: activeTiers, status: value, offset: 0, sortBy, sortDir })}
              style={PILL(activeStatus === value)}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {fetchError && (
        <p style={{ color: '#f87171', fontSize: '13px', marginBottom: '12px' }}>
          Error: {fetchError}
        </p>
      )}

      {/* Pagination row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        fontSize: '12px',
        color: '#6b7280',
      }}>
        <span>
          {totalCount === 0 ? '—' : `Showing ${from}–${to} of ${totalCount}`}
        </span>
        <div style={{ display: 'flex', gap: '12px' }}>
          {hasPrev && (
            <Link
              href={queueUrl({ tiers: activeTiers, status: activeStatus, offset: Math.max(0, offset - LIMIT), sortBy, sortDir })}
              style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: '500' }}
            >
              ← Prev
            </Link>
          )}
          {hasNext && (
            <Link
              href={queueUrl({ tiers: activeTiers, status: activeStatus, offset: offset + LIMIT, sortBy, sortDir })}
              style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: '500' }}
            >
              Next →
            </Link>
          )}
        </div>
      </div>

      {/* Table card */}
      <div style={{
        backgroundColor: '#1a1a1a',
        borderRadius: '10px',
        border: '1px solid #2a2a2a',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#141414', borderBottom: '1px solid #2a2a2a' }}>
              <SortableHeader label="Tier" value="tier" sortBy={sortBy} sortDir={sortDir} url={queueUrl({ tiers: activeTiers, status: activeStatus, offset: 0, sortBy, sortDir })} />
              <SortableHeader label="Score" value="score" sortBy={sortBy} sortDir={sortDir} url={queueUrl({ tiers: activeTiers, status: activeStatus, offset: 0, sortBy, sortDir })} />
              <th style={{ padding: '10px 14px', whiteSpace: 'nowrap', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</th>
              <SortableHeader label="Company" value="company" sortBy={sortBy} sortDir={sortDir} url={queueUrl({ tiers: activeTiers, status: activeStatus, offset: 0, sortBy, sortDir })} />
              <th style={{ padding: '10px 14px', whiteSpace: 'nowrap', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Title</th>
              <SortableHeader label="Location" value="location" sortBy={sortBy} sortDir={sortDir} url={queueUrl({ tiers: activeTiers, status: activeStatus, offset: 0, sortBy, sortDir })} />
              <th style={{ padding: '10px 14px', whiteSpace: 'nowrap', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Remote</th>
              <SortableHeader label="Posted" value="posted_at" sortBy={sortBy} sortDir={sortDir} url={queueUrl({ tiers: activeTiers, status: activeStatus, offset: 0, sortBy, sortDir })} />
            </tr>
          </thead>
          <tbody>
            {jobs.map((job: JobRow) => (
              <TableRow key={String(job.job_id)} job={job} />
            ))}
            {jobs.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: '48px 14px', color: '#6b7280', textAlign: 'center', fontSize: '13px' }}>
                  No jobs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
