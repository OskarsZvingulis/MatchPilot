'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Status = 'shortlist' | 'applied' | 'skip';

const BUTTONS: { label: string; value: Status; color: string }[] = [
  { label: 'Shortlist', value: 'shortlist', color: '#16a34a' },
  { label: 'Applied',   value: 'applied',   color: '#2563eb' },
  { label: 'Skip',      value: 'skip',      color: '#dc2626' },
];

export default function StatusButtons({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [active, setActive]   = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleClick(status: Status) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/review/status/${jobId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error((data as Record<string, unknown>).error as string ?? `HTTP ${res.status}`);
      }
      const d = data as Record<string, unknown>;
      if (d.ok !== true || !d.review || typeof (d.review as Record<string, unknown>).status !== 'string') {
        throw new Error('Unexpected response shape from status API');
      }
      setActive(status);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {BUTTONS.map(({ label, value, color }) => (
          <button
            key={value}
            onClick={() => handleClick(value)}
            disabled={loading}
            style={{
              padding: '8px 18px',
              fontSize: '13px',
              fontFamily: 'monospace',
              cursor: loading ? 'not-allowed' : 'pointer',
              border: `2px solid ${color}`,
              borderRadius: '4px',
              backgroundColor: active === value ? color : '#fff',
              color: active === value ? '#fff' : color,
              fontWeight: active === value ? 'bold' : 'normal',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {active === value ? `✓ ${label}` : label}
          </button>
        ))}
      </div>
      {error && (
        <p style={{ marginTop: '8px', fontSize: '12px', color: '#dc2626' }}>
          Error: {error}
        </p>
      )}
    </div>
  );
}
