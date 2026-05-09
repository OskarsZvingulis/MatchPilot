'use client';

import { useState, useTransition } from 'react';
import { triggerFetchJobs, type FetchJobsResult } from '@/app/actions/fetchJobs';

export function FetchJobsButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<FetchJobsResult | null>(null);

  function handleClick() {
    setResult(null);
    startTransition(async () => {
      const r = await triggerFetchJobs();
      setResult(r);
    });
  }

  const btnStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 14px',
    borderRadius: '8px',
    border: '1px solid #2a2a2a',
    backgroundColor: isPending ? '#1a1a1a' : '#1f1f1f',
    color: isPending ? '#555' : '#e5e5e5',
    fontSize: '12px',
    fontWeight: '600',
    cursor: isPending ? 'not-allowed' : 'pointer',
    transition: 'background 0.15s',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <button onClick={handleClick} disabled={isPending} style={btnStyle}>
        {isPending ? (
          <>
            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
            Fetching…
          </>
        ) : (
          <>↓ Fetch new jobs</>
        )}
      </button>

      {result && !isPending && (
        <span style={{ fontSize: '12px', color: result.ok ? '#6ee7b7' : '#fca5a5' }}>
          {result.ok
            ? `+${result.ingested} new, ${result.skipped} dupes${result.errors.length > 0 ? `, ${result.errors.length} err` : ''}`
            : result.errorMessage ?? 'Failed'}
        </span>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
