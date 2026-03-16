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

// ─── Types ────────────────────────────────────────────────────────────────────

interface TierStat        { tier: string; total: number; avg_score: number; shortlisted: number; applied: number; skipped: number; }
interface FunnelRow       { status: string; count: number; }
interface QueueRow        { status: string; count: number; }
interface SourceRow       { source: string; total: number; reject_fast: number; ineligible: number; strong: number; possible: number; weak: number; avg_score: number | null; }
interface RecRow          { recommendation: string; count: number; }
interface DistRow         { [key: string]: string | number; count: number; }
interface EvalPathRow     { evaluation_path: string; count: number; }
interface FreqRow         { flag?: string; blocker?: string; count: number; }

// ─── Styles ───────────────────────────────────────────────────────────────────

const REC_COLOR: Record<string, string> = {
  strong_match: '#6ee7b7', possible_match: '#93c5fd', weak_match: '#fcd34d', ineligible: '#fca5a5', unknown: '#555',
};

const REC_LABEL: Record<string, string> = {
  strong_match: 'Strong', possible_match: 'Possible', weak_match: 'Weak', ineligible: 'Ineligible', unknown: '—',
};

const FUNNEL_COLOR: Record<string, string> = {
  new: '#555', shortlist: '#6ee7b7', applied: '#93c5fd', skip: '#fca5a5',
};

const FUNNEL_LABEL: Record<string, string> = {
  new: 'New', shortlist: 'Shortlisted', applied: 'Applied', skip: 'Skipped',
};

const QUEUE_LABEL: Record<string, string> = {
  pending: 'Pending', processing: 'Processing', done: 'Done', failed: 'Failed',
};

const QUEUE_COLOR: Record<string, string> = {
  pending: '#888', processing: '#fcd34d', done: '#6ee7b7', failed: '#fca5a5',
};

const EVAL_PATH_LABEL: Record<string, string> = {
  evaluate: 'Evaluated', evaluate_but_ineligible: 'Ineligible', reject_fast: 'Fast rejected', unknown: 'Unknown',
};

const EVAL_PATH_COLOR: Record<string, string> = {
  evaluate: '#6ee7b7', evaluate_but_ineligible: '#fcd34d', reject_fast: '#fca5a5', unknown: '#555',
};

// ─── Components ───────────────────────────────────────────────────────────────

function Card({ title, children, style }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      border: '1px solid #2a2a2a',
      borderRadius: '10px',
      padding: '20px 24px',
      ...style,
    }}>
      <h2 style={{
        fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
        letterSpacing: '0.08em', color: '#555', margin: '0 0 18px',
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
      backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px',
      padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '6px',
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

const TH: React.CSSProperties = {
  padding: '6px 10px 10px', fontSize: '11px', fontWeight: '600',
  color: '#444', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
};
const TD: React.CSSProperties = { padding: '9px 10px', fontSize: '13px', borderBottom: '1px solid #1f1f1f' };
const TD_NUM: React.CSSProperties = { ...TD, textAlign: 'right', color: '#e8e8e8', fontWeight: '600' };
const TD_DIM: React.CSSProperties = { ...TD, textAlign: 'right', color: '#555' };

function pct(n: number, total: number): string {
  if (total === 0) return '—';
  return `${Math.round((n / total) * 100)}%`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const hdrs = await headers();
  const baseUrl = getBaseUrl(hdrs);
  const cookieHeader = headerValue(hdrs, 'cookie');

  let tierStats: TierStat[]     = [];
  let reviewFunnel: FunnelRow[] = [];
  let queueHealth: QueueRow[]   = [];
  let sourceQuality: SourceRow[] = [];
  let recDistribution: RecRow[]  = [];
  let seniorityDist: DistRow[]   = [];
  let infraDist: DistRow[]       = [];
  let techMismatchDist: DistRow[] = [];
  let evalPathDist: EvalPathRow[] = [];
  let topRedFlags: FreqRow[]     = [];
  let topBlockers: FreqRow[]     = [];
  let error: string | null = null;

  try {
    const res = await fetch(new URL('/api/dashboard', baseUrl), {
      cache: 'no-store',
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    });
    if (res.ok) {
      const data = await res.json();
      tierStats        = data.tierStats        ?? [];
      reviewFunnel     = data.reviewFunnel     ?? [];
      queueHealth      = data.queueHealth      ?? [];
      sourceQuality    = data.sourceQuality    ?? [];
      recDistribution  = data.recDistribution  ?? [];
      seniorityDist    = data.seniorityDist    ?? [];
      infraDist        = data.infraDist        ?? [];
      techMismatchDist = data.techMismatchDist ?? [];
      evalPathDist     = data.evalPathDist     ?? [];
      topRedFlags      = data.topRedFlags      ?? [];
      topBlockers      = data.topBlockers      ?? [];
    } else {
      error = `API error ${res.status}`;
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  const totalScored = tierStats.reduce((s, r) => s + r.total, 0);
  const strongCount = recDistribution.find((r) => r.recommendation === 'strong_match')?.count ?? 0;
  const shortlisted = reviewFunnel.find((r) => r.status === 'shortlist')?.count ?? 0;
  const applied     = reviewFunnel.find((r) => r.status === 'applied')?.count ?? 0;

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
        <p style={{ fontSize: '12px', color: '#555', margin: 0 }}>Pipeline observability</p>
      </div>

      {error && (
        <p style={{ color: '#fca5a5', fontSize: '13px', marginBottom: '20px' }}>Error: {error}</p>
      )}

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
        <StatCard label="Total scored"  value={totalScored} />
        <StatCard label="Strong match"  value={strongCount} sub="strong_match recommendation" />
        <StatCard label="Shortlisted"   value={shortlisted} />
        <StatCard label="Applied"       value={applied} />
      </div>

      {/* ── Row 1: Tier breakdown + funnel + queue ───────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>

        <Card title="Recommendation breakdown">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2a2a2a' }}>
                {['Match', 'Jobs', '%', 'Shortlist', 'Applied', 'Skipped'].map((h, i) => (
                  <th key={h} style={{ ...TH, textAlign: i === 0 ? 'left' : 'right' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedTiers.map((row) => {
                const rec = row.tier === 'A' ? 'strong_match' : row.tier === 'B' ? 'possible_match' : row.tier === 'C' ? 'weak_match' : 'ineligible';
                return (
                  <tr key={row.tier}>
                    <td style={TD}>
                      <span style={{ fontWeight: '700', fontSize: '12px', color: REC_COLOR[rec] ?? '#e8e8e8' }}>
                        {REC_LABEL[rec] ?? row.tier}
                      </span>
                    </td>
                    <td style={TD_NUM}>{row.total}</td>
                    <td style={TD_DIM}>{pct(row.total, totalScored)}</td>
                    <td style={{ ...TD_NUM, color: '#6ee7b7' }}>{row.shortlisted}</td>
                    <td style={{ ...TD_NUM, color: '#93c5fd' }}>{row.applied}</td>
                    <td style={{ ...TD_NUM, color: '#fca5a5' }}>{row.skipped}</td>
                  </tr>
                );
              })}
              {sortedTiers.length === 0 && (
                <tr><td colSpan={6} style={{ ...TD, textAlign: 'center', color: '#444' }}>No data</td></tr>
              )}
            </tbody>
          </table>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Card title="Review funnel">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(['new', 'shortlist', 'applied', 'skip'] as const).map((status) => {
                const count = reviewFunnel.find((r) => r.status === status)?.count ?? 0;
                const p = totalScored > 0 ? Math.round((count / totalScored) * 100) : 0;
                return (
                  <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ width: '76px', fontSize: '12px', color: FUNNEL_COLOR[status] ?? '#888', fontWeight: '500' }}>
                      {FUNNEL_LABEL[status]}
                    </span>
                    <div style={{ flex: 1, height: '4px', backgroundColor: '#2a2a2a', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${p}%`, backgroundColor: FUNNEL_COLOR[status] ?? '#888', borderRadius: '2px', minWidth: count > 0 ? '4px' : '0' }} />
                    </div>
                    <span style={{ width: '36px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#e8e8e8' }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="Queue health">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(['pending', 'processing', 'done', 'failed'] as const).map((status) => {
                const count = queueHealth.find((r) => r.status === status)?.count ?? 0;
                return (
                  <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#888', fontWeight: '500' }}>{QUEUE_LABEL[status]}</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: QUEUE_COLOR[status] ?? '#888' }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* ── Row 2: Source quality ─────────────────────────────────────────────── */}
      <Card title="Source quality" style={{ marginBottom: '14px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2a2a2a' }}>
              {['Source', 'Total', 'Fast-rej', 'Ineligible', 'Strong', 'Possible', 'Weak', 'Eligible %', 'Avg score'].map((h, i) => (
                <th key={h} style={{ ...TH, textAlign: i === 0 ? 'left' : 'right' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sourceQuality.map((row) => {
              const eligible = row.total - row.reject_fast - row.ineligible;
              return (
                <tr key={row.source}>
                  <td style={{ ...TD, color: '#ccc', fontWeight: '500' }}>{row.source}</td>
                  <td style={TD_NUM}>{row.total}</td>
                  <td style={{ ...TD_DIM, color: row.reject_fast > 0 ? '#fca5a5' : '#555' }}>{row.reject_fast}</td>
                  <td style={{ ...TD_DIM, color: row.ineligible > 0 ? '#fcd34d' : '#555' }}>{row.ineligible}</td>
                  <td style={{ ...TD_DIM, color: '#6ee7b7' }}>{row.strong}</td>
                  <td style={{ ...TD_DIM, color: '#93c5fd' }}>{row.possible}</td>
                  <td style={TD_DIM}>{row.weak}</td>
                  <td style={TD_DIM}>{pct(eligible, row.total)}</td>
                  <td style={TD_DIM}>{row.avg_score ?? '—'}</td>
                </tr>
              );
            })}
            {sourceQuality.length === 0 && (
              <tr><td colSpan={9} style={{ ...TD, textAlign: 'center', color: '#444' }}>No data</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* ── Row 3: Evaluation distributions ──────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '14px' }}>

        <Card title="Eval path">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(['evaluate', 'evaluate_but_ineligible', 'reject_fast', 'unknown'] as const).map((path) => {
              const count = evalPathDist.find((r) => r.evaluation_path === path)?.count ?? 0;
              const total = evalPathDist.reduce((s, r) => s + r.count, 0);
              return (
                <div key={path} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: EVAL_PATH_COLOR[path] ?? '#888' }}>{EVAL_PATH_LABEL[path]}</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#e8e8e8' }}>
                    {count} <span style={{ fontSize: '10px', color: '#555', fontWeight: '400' }}>{pct(count, total)}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Seniority">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(['junior', 'mid', 'senior', 'lead_plus', 'unknown'] as const).map((level) => {
              const row = seniorityDist.find((r) => r['seniority_level'] === level);
              const count = (row?.count as number) ?? 0;
              const total = seniorityDist.reduce((s, r) => s + (r.count as number), 0);
              const color = level === 'senior' || level === 'lead_plus' ? '#fcd34d' : '#888';
              return (
                <div key={level} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color }}>{level}</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#e8e8e8' }}>
                    {count} <span style={{ fontSize: '10px', color: '#555', fontWeight: '400' }}>{pct(count, total)}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Infra depth">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(['none', 'light', 'heavy', 'unknown'] as const).map((level) => {
              const row = infraDist.find((r) => r['infra_depth'] === level);
              const count = (row?.count as number) ?? 0;
              const total = infraDist.reduce((s, r) => s + (r.count as number), 0);
              const color = level === 'heavy' ? '#fca5a5' : '#888';
              return (
                <div key={level} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color }}>{level}</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#e8e8e8' }}>
                    {count} <span style={{ fontSize: '10px', color: '#555', fontWeight: '400' }}>{pct(count, total)}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Tech mismatch">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(['none', 'some', 'major', 'unknown'] as const).map((level) => {
              const row = techMismatchDist.find((r) => r['tech_mismatch_level'] === level);
              const count = (row?.count as number) ?? 0;
              const total = techMismatchDist.reduce((s, r) => s + (r.count as number), 0);
              const color = level === 'major' ? '#fca5a5' : level === 'some' ? '#fcd34d' : '#888';
              return (
                <div key={level} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color }}>{level}</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#e8e8e8' }}>
                    {count} <span style={{ fontSize: '10px', color: '#555', fontWeight: '400' }}>{pct(count, total)}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

      </div>

      {/* ── Row 4: Top red flags + blockers ──────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>

        <Card title="Top red flags">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <tbody>
              {topRedFlags.map((row, i) => (
                <tr key={i}>
                  <td style={{ ...TD, color: '#fcd34d', paddingLeft: 0 }}>{row.flag}</td>
                  <td style={{ ...TD_NUM, width: '40px', paddingRight: 0 }}>{row.count}</td>
                </tr>
              ))}
              {topRedFlags.length === 0 && (
                <tr><td colSpan={2} style={{ ...TD, color: '#444' }}>No data</td></tr>
              )}
            </tbody>
          </table>
        </Card>

        <Card title="Top blockers">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <tbody>
              {topBlockers.map((row, i) => (
                <tr key={i}>
                  <td style={{ ...TD, color: '#fca5a5', paddingLeft: 0 }}>{row.blocker}</td>
                  <td style={{ ...TD_NUM, width: '40px', paddingRight: 0 }}>{row.count}</td>
                </tr>
              ))}
              {topBlockers.length === 0 && (
                <tr><td colSpan={2} style={{ ...TD, color: '#444' }}>No blockers yet</td></tr>
              )}
            </tbody>
          </table>
        </Card>

      </div>
    </main>
  );
}
