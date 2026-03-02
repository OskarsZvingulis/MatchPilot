"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { JobRow } from '@/lib/reviewContract';
import React from 'react';

const TIER_STYLES: Record<string, React.CSSProperties> = {
  A:      { backgroundColor: '#14532d', color: '#86efac', borderRadius: '5px', padding: '2px 8px', fontWeight: '700', fontSize: '11px' },
  B:      { backgroundColor: '#1e3a5f', color: '#93c5fd', borderRadius: '5px', padding: '2px 8px', fontWeight: '700', fontSize: '11px' },
  C:      { backgroundColor: '#451a03', color: '#fcd34d', borderRadius: '5px', padding: '2px 8px', fontWeight: '700', fontSize: '11px' },
  reject: { backgroundColor: '#450a0a', color: '#fca5a5', borderRadius: '5px', padding: '2px 8px', fontWeight: '700', fontSize: '11px' },
};

const STATUS_STYLES: Record<string, React.CSSProperties> = {
  new:       { backgroundColor: '#2a2a2a', color: '#888', borderRadius: '5px', padding: '2px 8px', fontSize: '11px', fontWeight: '500' },
  shortlist: { backgroundColor: '#14532d', color: '#86efac', borderRadius: '5px', padding: '2px 8px', fontSize: '11px', fontWeight: '500' },
  applied:   { backgroundColor: '#1e3a5f', color: '#93c5fd', borderRadius: '5px', padding: '2px 8px', fontSize: '11px', fontWeight: '500' },
  skip:      { backgroundColor: '#450a0a', color: '#fca5a5', borderRadius: '5px', padding: '2px 8px', fontSize: '11px', fontWeight: '500' },
};

export function TableRow({ job }: { job: JobRow }) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/review/${job.job_id}`);
  };

  return (
    <tr
      style={{ borderBottom: '1px solid #222', cursor: 'pointer', backgroundColor: '#1e1e1e' }}
      className="hover:bg-neutral-700"
      onClick={handleClick}
    >
      <td style={{ padding: '11px 14px' }}>
        <span style={TIER_STYLES[String(job.tier)] ?? {}}>
          {String(job.tier)}
        </span>
      </td>
      <td style={{ padding: '11px 14px', fontWeight: '600', color: '#e8e8e8' }}>
        {String(job.score)}
      </td>
      <td style={{ padding: '11px 14px' }}>
        <span style={STATUS_STYLES[String(job.status ?? 'new')] ?? {}}>
          {String(job.status ?? 'new')}
        </span>
      </td>
      <td style={{ padding: '11px 14px', color: '#ccc', fontWeight: '500' }}>
        {String(job.company ?? '—')}
      </td>
      <td style={{ padding: '11px 14px' }}>
        <Link
          href={`/review/${job.job_id}`}
          style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: '500' }}
          className="hover:underline"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          {String(job.title ?? '—')}
        </Link>
      </td>
      <td style={{ padding: '11px 14px', color: '#888' }}>{String(job.location ?? '—')}</td>
      <td style={{ padding: '11px 14px', color: '#888' }}>{String(job.remote ?? '—')}</td>
      <td style={{ padding: '11px 14px', color: '#555' }}>
        {job.posted_at
          ? new Date(String(job.posted_at)).toLocaleDateString('en-GB')
          : '—'}
      </td>
    </tr>
  );
}
