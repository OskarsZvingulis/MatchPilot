import Link from 'next/link';
import { headers } from 'next/headers';
import { parseJobsResponse, type JobRow } from '@/lib/reviewContract';

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

const VALID_TIERS = new Set(['A', 'B', 'C', 'reject']);

const TIER_COLOR: Record<string, string> = {
  A: '#16a34a',
  B: '#2563eb',
  C: '#d97706',
  reject: '#dc2626',
};

const FILTERS = [
  { label: 'All A+B', value: 'A,B' },
  { label: 'Tier A',  value: 'A'   },
  { label: 'Tier B',  value: 'B'   },
  { label: 'Tier C',  value: 'C'   },
];

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ tiers?: string }>;
}) {
  const { tiers: tiersParam } = await searchParams;
  const active = tiersParam ?? 'A,B';

  const tiers = active
    .split(',')
    .map((t) => t.trim())
    .filter((t) => VALID_TIERS.has(t));

  const validTiers = tiers.length > 0 ? tiers : ['A', 'B'];

  // Build absolute URL from the incoming request host
  const hdrs = await headers();
  const baseUrl = getBaseUrl(hdrs);
  const url = new URL(`/api/review/jobs?tiers=${encodeURIComponent(validTiers.join(','))}&limit=50`, baseUrl);
  const res = await fetch(url, { cache: 'no-store' });

  let jobs: JobRow[] = [];
  let fetchError: string | null = null;

  if (!res.ok) {
    fetchError = `API error ${res.status}`;
  } else {
    try {
      const data = parseJobsResponse(await res.json());
      jobs = data.jobs;
    } catch (err) {
      fetchError = err instanceof Error ? err.message : String(err);
    }
  }

  return (
    <main style={{ fontFamily: 'monospace', padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '20px', marginBottom: '20px' }}>MatchPilot — Review Queue</h1>

      {/* Filter links */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '16px', fontSize: '13px' }}>
        {FILTERS.map(({ label, value }) => (
          <Link
            key={value}
            href={`/review?tiers=${value}`}
            style={{
              textDecoration: active === value ? 'none' : 'underline',
              fontWeight:     active === value ? 'bold' : 'normal',
              color:          active === value ? '#000' : '#555',
            }}
          >
            {label}
          </Link>
        ))}
      </div>

      {fetchError && (
        <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '12px' }}>
          Error: {fetchError}
        </p>
      )}

      <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>
        {jobs.length} job{jobs.length !== 1 ? 's' : ''}
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #000', textAlign: 'left' }}>
            {['Tier', 'Score', 'Company', 'Title', 'Location', 'Remote', 'Posted'].map((h) => (
              <th key={h} style={{ padding: '6px 10px', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {jobs.map((job: JobRow) => (
            <tr key={String(job.job_id)} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '7px 10px' }}>
                <span style={{ color: TIER_COLOR[String(job.tier)] ?? '#000', fontWeight: 'bold' }}>
                  {String(job.tier)}
                </span>
              </td>
              <td style={{ padding: '7px 10px' }}>{String(job.score)}</td>
              <td style={{ padding: '7px 10px' }}>{String(job.company ?? '—')}</td>
              <td style={{ padding: '7px 10px' }}>
                <Link href={`/review/${job.job_id}`} style={{ color: '#1d4ed8' }}>
                  {String(job.title ?? '—')}
                </Link>
              </td>
              <td style={{ padding: '7px 10px', color: '#555' }}>{String(job.location ?? '—')}</td>
              <td style={{ padding: '7px 10px', color: '#555' }}>{String(job.remote ?? '—')}</td>
              <td style={{ padding: '7px 10px', color: '#555' }}>
                {job.posted_at
                  ? new Date(String(job.posted_at)).toLocaleDateString('en-GB')
                  : '—'}
              </td>
            </tr>
          ))}
          {jobs.length === 0 && (
            <tr>
              <td colSpan={7} style={{ padding: '20px 10px', color: '#888', textAlign: 'center' }}>
                No jobs found for selected tiers.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
