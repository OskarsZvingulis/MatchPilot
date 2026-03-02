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

const TIER_COLOR: Record<string, string> = {
  A: '#86efac', B: '#93c5fd', C: '#fcd34d', reject: '#fca5a5',
};

const TIER_BG: Record<string, string> = {
  A: '#14532d', B: '#1e3a5f', C: '#451a03', reject: '#450a0a',
};

const STATUS_COLOR: Record<string, string> = {
  new: '#64748b', shortlist: '#86efac', applied: '#93c5fd', skip: '#fca5a5',
};

const STATUS_BG: Record<string, string> = {
  new: '#2a2a2a', shortlist: '#14532d', applied: '#1e3a5f', skip: '#450a0a',
};

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      backgroundColor: '#1e1e1e',
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

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const hdrs = await headers();
  const baseUrl = getBaseUrl(hdrs);
  const url = new URL(`/api/review/job/${encodeURIComponent(id)}`, baseUrl);
  const res = await fetch(url, { cache: 'no-store' });

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

  const data         = parseJobDetailResponse(await res.json());
  const raw          = data.raw;
  const scored       = data.scored;
  const assets       = data.assets;
  const reviewStatus = data.review?.status ?? 'new';

  const tierColor = scored ? (TIER_COLOR[String(scored.tier)] ?? '#cbd5e1') : '#cbd5e1';
  const tierBg    = scored ? (TIER_BG[String(scored.tier)]    ?? '#2a2a2a') : '#2a2a2a';

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
                  color: tierColor,
                  backgroundColor: tierBg,
                  borderRadius: '5px',
                  padding: '3px 10px',
                }}>
                  Tier {String(scored.tier)} · {String(scored.score)}
                </span>
              )}
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
                backgroundColor: '#f1f5f9',
                color: '#0f172a',
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

      {/* ── Score ──────────────────────────────────────────────────────── */}
      <Card style={{ marginBottom: '16px' }}>
        <SectionHeading>Score</SectionHeading>
        {scored ? (
          <div>
            <Field label="Tier"
              value={
                <span style={{ color: tierColor, fontWeight: '700', backgroundColor: tierBg, borderRadius: '4px', padding: '1px 7px' }}>
                  {String(scored.tier)}
                </span>
              }
            />
            <Field label="Score"            value={String(scored.score)} />
            <Field label="Role category"    value={String(scored.role_category)} />
            <Field label="Experience"       value={String(scored.experience_band)} />
            <Field label="Remote"           value={String(scored.remote_feasibility)} />
            <Field label="Onsite required"  value={scored.onsite_required  ? 'Yes' : 'No'} />
            <Field label="Visa restriction" value={scored.visa_restriction  ? 'Yes' : 'No'} />
            <Field label="Tech mismatch"    value={scored.tech_mismatch     ? 'Yes' : 'No'} />
            <Field label="Salary range"
              value={formatSalary(
                scored.salary_min_gbp as number | null,
                scored.salary_max_gbp as number | null,
              )}
            />
            {Array.isArray(scored.red_flags) ? scored.red_flags.map((f: string, i: number) => (
              <Field key={i} label={i === 0 ? 'Red flags' : ''} value={<span style={{ color: '#fca5a5' }}>{f}</span>} />
            )) : null}
          </div>
        ) : (
          <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>Not yet scored.</p>
        )}
      </Card>

      {/* ── Assets ─────────────────────────────────────────────────────── */}
      <Card style={{ marginBottom: '16px' }}>
        <SectionHeading>Assets</SectionHeading>
        {assets ? (
          <div>
            <div style={{ marginBottom: '18px' }}>
              <p style={{ fontSize: '11px', color: '#475569', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Intro paragraph</p>
              <p style={{ fontSize: '13px', lineHeight: '1.7', color: '#ccc', margin: 0 }}>{String(assets.intro_paragraph)}</p>
            </div>
            <div style={{ marginBottom: '18px' }}>
              <p style={{ fontSize: '11px', color: '#475569', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Cover letter</p>
              <pre style={{
                fontSize: '12px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                background: '#141414',
                padding: '14px',
                borderRadius: '7px',
                margin: 0,
                lineHeight: '1.7',
                border: '1px solid #2a2a2a',
                color: '#ccc',
              }}>
                {String(assets.cover_letter)}
              </pre>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#475569', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>CV emphasis</p>
              <pre style={{
                fontSize: '12px',
                background: '#141414',
                padding: '14px',
                borderRadius: '7px',
                margin: 0,
                overflow: 'auto',
                border: '1px solid #2a2a2a',
                color: '#ccc',
              }}>
                {JSON.stringify(assets.cv_emphasis, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>No assets generated.</p>
        )}
      </Card>

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
          background: '#1e1e1e',
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
