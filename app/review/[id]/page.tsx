import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import StatusButtons from './StatusButtons';
import { parseJobDetailResponse } from '@/lib/reviewContract';

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

const REC_LABEL: Record<string, string> = {
  strong_match:   'Strong Match',
  possible_match: 'Possible Match',
  weak_match:     'Weak Match',
  ineligible:     'Ineligible',
};

const REC_COLOR: Record<string, string> = {
  strong_match:   '#86efac',
  possible_match: '#93c5fd',
  weak_match:     '#fcd34d',
  ineligible:     '#fca5a5',
};

const REC_BG: Record<string, string> = {
  strong_match:   '#14532d',
  possible_match: '#1e3a5f',
  weak_match:     '#451a03',
  ineligible:     '#450a0a',
};

const STATUS_COLOR: Record<string, string> = {
  new: '#64748b', shortlist: '#86efac', applied: '#93c5fd', skip: '#fca5a5',
};

const STATUS_BG: Record<string, string> = {
  new: '#2a2a2a', shortlist: '#14532d', applied: '#1e3a5f', skip: '#450a0a',
};

// Derive recommendation from tier for backward-compat
function recFromTier(tier: string): string {
  if (tier === 'A') return 'strong_match';
  if (tier === 'B') return 'possible_match';
  if (tier === 'C') return 'weak_match';
  return 'ineligible';
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      border: '1px solid #2a2a2a',
      borderRadius: '10px',
      padding: '20px 24px',
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: '11px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: '#555',
      margin: '0 0 14px',
    }}>
      {children}
    </h2>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: '12px', padding: '7px 0', borderBottom: '1px solid #141414' }}>
      <span style={{ width: '180px', flexShrink: 0, color: '#475569', fontSize: '12px' }}>{label}</span>
      <span style={{ fontSize: '13px', wordBreak: 'break-word', color: '#cbd5e1' }}>{value ?? '—'}</span>
    </div>
  );
}

function formatSalary(min: number | null, max: number | null): string {
  if (!min && !max) return '—';
  if (min && max)  return `£${min.toLocaleString()} – £${max.toLocaleString()}`;
  if (min)         return `from £${min.toLocaleString()}`;
  return `up to £${max!.toLocaleString()}`;
}

function EvalPathLabel({ path }: { path: string | null | undefined }) {
  if (!path || path === 'evaluate') return null;
  const label = path === 'reject_fast' ? 'Fast rejected' : 'Evaluated — ineligible';
  return (
    <span style={{
      fontSize: '11px',
      color: '#6b7280',
      backgroundColor: '#1f1f1f',
      border: '1px solid #2a2a2a',
      borderRadius: '4px',
      padding: '2px 8px',
    }}>
      {label}
    </span>
  );
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const hdrs = await headers();
  const baseUrl = getBaseUrl(hdrs);
  const url = new URL(`/api/review/job/${encodeURIComponent(id)}`, baseUrl);
  const cookieHeader = headerValue(hdrs, 'cookie');
  let res: Response;
  try {
    res = await fetch(url, {
      cache: 'no-store',
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    });
  } catch (err) {
    return (
      <main>
        <a href="/review" style={{ fontSize: '12px', color: '#64748b', textDecoration: 'none' }}>← Back to queue</a>
        <p style={{ color: '#f87171', marginTop: '16px', fontSize: '13px' }}>Network error: {err instanceof Error ? err.message : String(err)}</p>
      </main>
    );
  }

  if (res.status === 404) notFound();

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = (body as Record<string, unknown>).error ?? `HTTP ${res.status}`;
    return (
      <main>
        <a href="/review" style={{ fontSize: '12px', color: '#64748b', textDecoration: 'none' }}>← Back to queue</a>
        <p style={{ color: '#f87171', marginTop: '16px', fontSize: '13px' }}>Error: {String(msg)}</p>
      </main>
    );
  }

  let data: ReturnType<typeof parseJobDetailResponse>;
  try {
    data = parseJobDetailResponse(await res.json());
  } catch (err) {
    return (
      <main>
        <a href="/review" style={{ fontSize: '12px', color: '#64748b', textDecoration: 'none' }}>← Back to queue</a>
        <p style={{ color: '#f87171', marginTop: '16px', fontSize: '13px' }}>Parse error: {err instanceof Error ? err.message : String(err)}</p>
      </main>
    );
  }

  const raw          = data.raw;
  const scored       = data.scored;
  const reviewStatus = data.review?.status ?? 'new';

  const rec      = String(scored?.recommendation ?? (scored ? recFromTier(String(scored.tier)) : 'ineligible'));
  const recColor = REC_COLOR[rec] ?? '#cbd5e1';
  const recBg    = REC_BG[rec]    ?? '#2a2a2a';
  const recLabel = REC_LABEL[rec] ?? rec;

  const reasons  = Array.isArray(scored?.reasons)  ? (scored!.reasons  as string[]) : [];
  const redFlags = Array.isArray(scored?.red_flags) ? (scored!.red_flags as string[]) : [];
  const blockers = Array.isArray(scored?.blockers)  ? (scored!.blockers  as string[]) : [];

  return (
    <main style={{ maxWidth: '820px' }}>

      {/* Back */}
      <a href="/review" style={{
        fontSize: '12px',
        color: '#64748b',
        textDecoration: 'none',
        display: 'inline-block',
        marginBottom: '20px',
      }}>
        ← Back to queue
      </a>

      {/* Header card */}
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 4px', fontWeight: '500' }}>
              {raw?.company ?? 'Unknown company'}
            </p>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#f1f5f9', margin: '0 0 12px', lineHeight: '1.3' }}>
              {raw?.title ?? 'Untitled'}
            </h1>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                color: STATUS_COLOR[reviewStatus] ?? '#64748b',
                backgroundColor: STATUS_BG[reviewStatus] ?? '#2a2a2a',
                borderRadius: '5px',
                padding: '3px 10px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                {reviewStatus}
              </span>
              {scored && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: recColor,
                  backgroundColor: recBg,
                  borderRadius: '5px',
                  padding: '3px 10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}>
                  {recLabel}
                </span>
              )}
              {scored && (
                <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>
                  {String(scored.score)}
                </span>
              )}
              {scored && <EvalPathLabel path={scored.evaluation_path} />}
            </div>
          </div>
          {raw?.url && (
            <a
              href={String(raw.url)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: '600',
                backgroundColor: '#2a2a2a',
                color: '#e5e5e5',
                border: '1px solid #3a3a3a',
                borderRadius: '7px',
                textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              Open Job ↗
            </a>
          )}
        </div>
      </Card>

      {/* ── Blockers ──────────────────────────────────────────────────────── */}
      {blockers.length > 0 && (
        <Card style={{ marginBottom: '16px', border: '1px solid rgba(220,38,38,0.3)', backgroundColor: 'rgba(69,10,10,0.4)' }}>
          <SectionHeading>Hard blockers</SectionHeading>
          <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
            {blockers.map((b: string, i: number) => (
              <li key={i} style={{ fontSize: '13px', color: '#fca5a5', padding: '4px 0', lineHeight: '1.5' }}>
                {b}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* ── Reasons FOR ───────────────────────────────────────────────────── */}
      {reasons.length > 0 && (
        <Card style={{ marginBottom: '16px' }}>
          <SectionHeading>Why it fits</SectionHeading>
          <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
            {reasons.map((r: string, i: number) => (
              <li key={i} style={{ fontSize: '13px', color: '#86efac', padding: '4px 0', lineHeight: '1.5' }}>
                {r}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* ── Red Flags ─────────────────────────────────────────────────────── */}
      {redFlags.length > 0 && (
        <Card style={{ marginBottom: '16px' }}>
          <SectionHeading>Red flags</SectionHeading>
          <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
            {redFlags.map((f: string, i: number) => (
              <li key={i} style={{ fontSize: '13px', color: '#fcd34d', padding: '4px 0', lineHeight: '1.5' }}>
                {f}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* ── Evaluation metadata ───────────────────────────────────────────── */}
      {scored && (
        <Card style={{ marginBottom: '16px' }}>
          <SectionHeading>Evaluation details</SectionHeading>
          <Field label="Role category"    value={String(scored.role_category ?? '—')} />
          <Field label="Seniority"        value={String(scored.seniority_level ?? '—')} />
          <Field label="Infra depth"      value={String(scored.infra_depth ?? '—')} />
          <Field label="Tech mismatch"    value={String(scored.tech_mismatch_level ?? '—')} />
          <Field label="Experience band"  value={String(scored.experience_band ?? '—')} />
          <Field label="Remote"           value={String(scored.remote_feasibility ?? '—')} />
          <Field label="Onsite required"  value={scored.onsite_required  ? 'Yes' : 'No'} />
          <Field label="Visa restriction" value={scored.visa_restriction  ? 'Yes' : 'No'} />
          <Field label="Salary range"
            value={formatSalary(
              scored.salary_min_gbp as number | null,
              scored.salary_max_gbp as number | null,
            )}
          />
          <Field label="Source"           value={String(raw?.source ?? '—')} />
          <Field label="Posted"           value={raw?.posted_at ? new Date(String(raw.posted_at)).toLocaleDateString('en-GB') : '—'} />
          <Field label="Scored"           value={(scored.created_at || scored.scored_at) ? new Date(String(scored.created_at ?? scored.scored_at)).toLocaleDateString('en-GB') : '—'} />
        </Card>
      )}

      {/* ── Action ─────────────────────────────────────────────────────── */}
      <Card style={{ marginBottom: '16px' }}>
        <SectionHeading>Action</SectionHeading>
        <StatusButtons jobId={id} initialStatus={reviewStatus === 'new' ? null : reviewStatus as 'shortlist' | 'applied' | 'skip'} />
      </Card>

      {/* ── Full description ───────────────────────────────────────────── */}
      <details style={{ marginBottom: '8px' }}>
        <summary style={{
          cursor: 'pointer',
          fontSize: '12px',
          color: '#555',
          userSelect: 'none',
          padding: '8px 0',
          fontWeight: '500',
        }}>
          Full Description
        </summary>
        <pre style={{
          marginTop: '10px',
          fontSize: '12px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          background: '#1a1a1a',
          padding: '16px',
          borderRadius: '10px',
          lineHeight: '1.7',
          border: '1px solid #2a2a2a',
          color: '#888',
        }}>
          {String(raw?.description ?? '')}
        </pre>
      </details>

    </main>
  );
}
