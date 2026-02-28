"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { JobRow } from '@/lib/reviewContract';
import React from 'react';

const TIER_STYLES: Record<string, React.CSSProperties> = {
  A:      { backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: '4px', padding: '2px 6px', fontWeight: 'bold' },
  B:      { backgroundColor: '#e0f2fe', color: '#2563eb', borderRadius: '4px', padding: '2px 6px', fontWeight: 'bold' },
  C:      { backgroundColor: '#fff7ed', color: '#d97706', borderRadius: '4px', padding: '2px 6px', fontWeight: 'bold' },
  reject: { backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '4px', padding: '2px 6px', fontWeight: 'bold' },
};

const STATUS_STYLES: Record<string, React.CSSProperties> = {
  new:       { backgroundColor: '#e5e7eb', color: '#4b5563', borderRadius: '4px', padding: '2px 6px', fontSize: '11px' },
  shortlist: { backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: '4px', padding: '2px 6px', fontSize: '11px' },
  applied:   { backgroundColor: '#e0f2fe', color: '#2563eb', borderRadius: '4px', padding: '2px 6px', fontSize: '11px' },
  skip:      { backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '4px', padding: '2px 6px', fontSize: '11px' },
};

export function TableRow({ job }: { job: JobRow }) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/review/${job.job_id}`);
  };

  return (
    <tr
      style={{
        borderBottom: '1px solid #e5e7eb',
        cursor: 'pointer',
      }}
      className="hover:bg-gray-50"
      onClick={handleClick}
    >
      <td style={{ padding: '7px 10px' }}>
        <span style={TIER_STYLES[String(job.tier)] ?? {}}>
          {String(job.tier)}
        </span>
      </td>
      <td style={{ padding: '7px 10px' }}>{String(job.score)}</td>
      <td style={{ padding: '7px 10px' }}>
        <span style={STATUS_STYLES[String(job.status ?? 'new')] ?? {}}>
          {String(job.status ?? 'new')}
        </span>
      </td>
      <td style={{ padding: '7px 10px' }}>{String(job.company ?? '—')}</td>
      <td style={{ padding: '7px 10px' }}>
        <Link
          href={`/review/${job.job_id}`}
          style={{ color: '#1d4ed8', textDecoration: 'none' }}
          className="hover:underline"
          onClick={(e: React.MouseEvent) => e.stopPropagation()} // Prevents row's onClick from firing
        >
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
  );
}
