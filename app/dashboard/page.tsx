import { headers } from 'next/headers';

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

interface TierStat {
  tier: string;
  total: number;
  avg_score: number;
  shortlisted: number;
  applied: number;
  skipped: number;
}

interface FunnelRow {
  status: string;
  count: number;
}

interface QueueRow {
  status: string;
  count: number;
}

const TIER_COLOR: Record<string, string> = {
  A: '#6ee7b7', B: '#93c5fd', C: '#fcd34d', reject: '#fca5a5',
};

const FUNNEL_LABEL: Record<string, string> = {
  new: 'New', shortlist: 'Shortlisted', applied: 'Applied', skip: 'Skipped',
};

const FUNNEL_COLOR: Record<string, string> = {
  new: '#555', shortlist: '#6ee7b7', applied: '#93c5fd', skip: '#fca5a5',
};

const QUEUE_LABEL: Record<string, string> = {
  pending: 'Pending', processing: 'Processing', done: 'Done', failed: 'Failed',
};

const QUEUE_COLOR: Record<string, string> = {
  pending: '#888', processing: '#fcd34d', done: '#6ee7b7', failed: '#fca5a5',
};

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      border: '1px solid #2a2a2a',
      borderRadius: '10px',
      padding: '20px 24px',
    }}>
      <h2 style={{
        fontSize: '11px',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: '#555',
        margin: '0 0 18px',
      }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      border: '1px solid #2a2a2a',
      borderRadius: '10px',
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
    }}>
      <span style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#555' }}>
        {label}
      </span>
      <span style={{ fontSize: '32px', fontWeight: '700', color: '#e8e8e8', lineHeight: 1 }}>
        {value.toLocaleString()}
      </span>
      {sub && <span style={{ fontSize: '11px', color: '#555' }}>{sub}</span>}
    </div>
  );
}

export default async function DashboardPage() {
  const hdrs = await headers();
  const baseUrl = getBaseUrl(hdrs);
  const cookieHeader = headerValue(hdrs, 'cookie');

  let tierStats: TierStat[]  = [];
  let reviewFunnel: FunnelRow[] = [];
  let queueHealth: QueueRow[]  = [];
  let error: string | null = null;

  try {
    const res = await fetch(new URL('/api/dashboard', baseUrl), {
      cache: 'no-store',
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    });
    if (res.ok) {
      const data = await res.json();
      tierStats    = data.tierStats    ?? [];
      reviewFunnel = data.reviewFunnel ?? [];
      queueHealth  = data.queueHealth  ?? [];
    } else {
      error = `API error ${res.status}`;
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  const totalScored   = tierStats.reduce((s, r) => s + r.total, 0);
  const tierACount    = tierStats.find((r) => r.tier === 'A')?.total ?? 0;
  const shortlisted   = reviewFunnel.find((r) => r.status === 'shortlist')?.count ?? 0;
  const applied       = reviewFunnel.find((r) => r.status === 'applied')?.count ?? 0;

  const TIER_ORDER = ['A', 'B', 'C', 'reject'];
  const sortedTiers = [...tierStats].sort(
    (a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier),
  );

  return (
    <main style={{ color: '#e8e8e8' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#e8e8e8', margin: '0 0 4px' }}>
          Dashboard
        </h1>
        <p style={{ fontSize: '12px', color: '#555', margin: 0 }}>Pipeline overview</p>
      </div>

      {error && (
        <p style={{ color: '#fca5a5', fontSize: '13px', marginBottom: '20px' }}>Error: {error}</p>
      )}

      {/* Stat cards row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
        <StatCard label="Total scored"  value={totalScored} />
        <StatCard label="Tier A"        value={tierACount}  sub="top matches" />
        <StatCard label="Shortlisted"   value={shortlisted} />
        <StatCard label="Applied"       value={applied} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>

        {/* Tier breakdown */}
        <Card title="Tier breakdown">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2a2a2a' }}>
                {['Tier', 'Jobs', 'Avg score', 'Shortlist', 'Applied', 'Skipped'].map((h) => (
                  <th key={h} style={{
                    padding: '6px 10px 10px',
                    textAlign: h === 'Tier' ? 'left' : 'right',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#444',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedTiers.map((row) => (
                <tr key={row.tier} style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ padding: '10px 10px' }}>
                    <span style={{
                      fontWeight: '700',
                      fontSize: '12px',
                      color: TIER_COLOR[row.tier] ?? '#e8e8e8',
                    }}>
                      {row.tier}
                    </span>
                  </td>
                  <td style={{ padding: '10px 10px', textAlign: 'right', color: '#e8e8e8', fontWeight: '600' }}>{row.total}</td>
                  <td style={{ padding: '10px 10px', textAlign: 'right', color: '#888' }}>{row.avg_score ?? '—'}</td>
                  <td style={{ padding: '10px 10px', textAlign: 'right', color: '#6ee7b7' }}>{row.shortlisted}</td>
                  <td style={{ padding: '10px 10px', textAlign: 'right', color: '#93c5fd' }}>{row.applied}</td>
                  <td style={{ padding: '10px 10px', textAlign: 'right', color: '#fca5a5' }}>{row.skipped}</td>
                </tr>
              ))}
              {sortedTiers.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '24px 10px', textAlign: 'center', color: '#444', fontSize: '12px' }}>
                    No data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Review funnel */}
          <Card title="Review funnel">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(['new', 'shortlist', 'applied', 'skip'] as const).map((status) => {
                const row = reviewFunnel.find((r) => r.status === status);
                const count = row?.count ?? 0;
                const pct = totalScored > 0 ? Math.round((count / totalScored) * 100) : 0;
                return (
                  <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ width: '76px', fontSize: '12px', color: FUNNEL_COLOR[status] ?? '#888', fontWeight: '500' }}>
                      {FUNNEL_LABEL[status]}
                    </span>
                    <div style={{ flex: 1, height: '4px', backgroundColor: '#2a2a2a', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        backgroundColor: FUNNEL_COLOR[status] ?? '#888',
                        borderRadius: '2px',
                        minWidth: count > 0 ? '4px' : '0',
                      }} />
                    </div>
                    <span style={{ width: '36px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#e8e8e8' }}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Queue health */}
          <Card title="Queue health">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(['pending', 'processing', 'done', 'failed'] as const).map((status) => {
                const row = queueHealth.find((r) => r.status === status);
                const count = row?.count ?? 0;
                return (
                  <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#888', fontWeight: '500' }}>
                      {QUEUE_LABEL[status]}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: QUEUE_COLOR[status] ?? '#888' }}>
                      {count}
                    </span>
                  </div>
                );
              })}
              {queueHealth.length === 0 && (
                <p style={{ fontSize: '12px', color: '#444', margin: 0 }}>No queue data</p>
              )}
            </div>
          </Card>

        </div>
      </div>
    </main>
  );
}
