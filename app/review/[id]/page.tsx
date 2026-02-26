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
  A: '#16a34a', B: '#2563eb', C: '#d97706', reject: '#dc2626',
};

const STATUS_COLOR: Record<string, string> = {
  new: '#555', shortlist: '#16a34a', applied: '#2563eb', skip: '#dc2626',
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: '12px', padding: '5px 0', borderBottom: '1px solid #f0f0f0' }}>
      <span style={{ width: '180px', flexShrink: 0, color: '#666', fontSize: '12px' }}>{label}</span>
      <span style={{ fontSize: '13px', wordBreak: 'break-word' }}>{value ?? '—'}</span>
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
      <main style={{ fontFamily: 'monospace', padding: '24px' }}>
        <a href="/review" style={{ fontSize: '12px', color: '#555', textDecoration: 'underline' }}>← Back to queue</a>
        <p style={{ color: '#dc2626', marginTop: '16px' }}>Error: {String(msg)}</p>
      </main>
    );
  }

  const data         = parseJobDetailResponse(await res.json());
  const raw          = data.raw;
  const scored       = data.scored;
  const assets       = data.assets;
  const reviewStatus = data.review?.status ?? 'new';

  const tierColor = scored ? (TIER_COLOR[String(scored.tier)] ?? '#000') : '#000';

  return (
    <main style={{ fontFamily: 'monospace', padding: '24px', maxWidth: '860px', margin: '0 auto' }}>

      {/* Back */}
      <a href="/review" style={{ fontSize: '12px', color: '#555', textDecoration: 'underline' }}>
        ← Back to queue
      </a>

      {/* Header */}
      <h1 style={{ fontSize: '20px', margin: '16px 0 4px' }}>
        {raw?.company ?? 'Unknown company'} — {raw?.title ?? 'Untitled'}
      </h1>

      {/* Status badge */}
      <div style={{ marginBottom: '12px' }}>
        <span style={{
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontWeight: 'bold',
          color: STATUS_COLOR[reviewStatus] ?? '#555',
          border: `1px solid ${STATUS_COLOR[reviewStatus] ?? '#555'}`,
          borderRadius: '3px',
          padding: '2px 8px',
        }}>
          {reviewStatus}
        </span>
      </div>

      {/* Open job link */}
      {raw?.url && (
        <a
          href={String(raw.url)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            marginBottom: '24px',
            padding: '7px 16px',
            fontSize: '13px',
            border: '2px solid #000',
            borderRadius: '4px',
            textDecoration: 'none',
            color: '#000',
          }}
        >
          Open Job ↗
        </a>
      )}

      {/* ── Score block ─────────────────────────────────────────────────── */}
      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
          Score
        </h2>
        {scored ? (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '12px 16px' }}>
            <Field label="Tier"
              value={
                <span style={{ color: tierColor, fontWeight: 'bold' }}>
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
              <Field key={i} label={i === 0 ? 'Red flags' : ''} value={<span style={{ color: '#dc2626' }}>{f}</span>} />
            )) : null}
          </div>
        ) : (
          <p style={{ color: '#888', fontSize: '13px' }}>Not yet scored.</p>
        )}
      </section>

      {/* ── Assets block ────────────────────────────────────────────────── */}
      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
          Assets
        </h2>
        {assets ? (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '12px 16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Intro paragraph</p>
              <p style={{ fontSize: '13px', lineHeight: '1.6' }}>{String(assets.intro_paragraph)}</p>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Cover letter</p>
              <pre style={{
                fontSize: '12px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                background: '#f9fafb',
                padding: '12px',
                borderRadius: '4px',
                margin: 0,
                lineHeight: '1.6',
              }}>
                {String(assets.cover_letter)}
              </pre>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>CV emphasis</p>
              <pre style={{
                fontSize: '12px',
                background: '#f9fafb',
                padding: '12px',
                borderRadius: '4px',
                margin: 0,
                overflow: 'auto',
              }}>
                {JSON.stringify(assets.cv_emphasis, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <p style={{ color: '#888', fontSize: '13px' }}>No assets generated.</p>
        )}
      </section>

      {/* ── Status buttons ──────────────────────────────────────────────── */}
      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
          Action
        </h2>
        <StatusButtons jobId={id} initialStatus={reviewStatus === 'new' ? null : reviewStatus as 'shortlist' | 'applied' | 'skip'} />
      </section>

      {/* ── Raw description ─────────────────────────────────────────────── */}
      <details style={{ marginBottom: '28px' }}>
        <summary style={{ cursor: 'pointer', fontSize: '13px', color: '#555', userSelect: 'none' }}>
          Full Description
        </summary>
        <pre style={{
          marginTop: '10px',
          fontSize: '12px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          background: '#f9fafb',
          padding: '12px',
          borderRadius: '4px',
          lineHeight: '1.6',
          border: '1px solid #e5e7eb',
        }}>
          {String(raw?.description ?? '')}
        </pre>
      </details>

    </main>
  );
}
