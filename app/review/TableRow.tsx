"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { JobRow } from '@/lib/reviewContract';
import React from 'react';

const REC_STYLES: Record<string, React.CSSProperties> = {
  strong_match:   { backgroundColor: '#14532d', color: '#86efac', borderRadius: '5px', padding: '2px 8px', fontWeight: '700', fontSize: '11px', whiteSpace: 'nowrap' },
  possible_match: { backgroundColor: '#1e3a5f', color: '#93c5fd', borderRadius: '5px', padding: '2px 8px', fontWeight: '700', fontSize: '11px', whiteSpace: 'nowrap' },
  weak_match:     { backgroundColor: '#451a03', color: '#fcd34d', borderRadius: '5px', padding: '2px 8px', fontWeight: '700', fontSize: '11px', whiteSpace: 'nowrap' },
  ineligible:     { backgroundColor: '#450a0a', color: '#fca5a5', borderRadius: '5px', padding: '2px 8px', fontWeight: '700', fontSize: '11px', whiteSpace: 'nowrap' },
};

const REC_LABELS: Record<string, string> = {
  strong_match:   'Strong',
  possible_match: 'Possible',
  weak_match:     'Weak',
  ineligible:     'Ineligible',
};

// Fallback: derive recommendation label from tier when recommendation field not yet populated
function recFromTier(tier: string): string {
  if (tier === 'A')      return 'strong_match';
  if (tier === 'B')      return 'possible_match';
  if (tier === 'C')      return 'weak_match';
  return 'ineligible';
}

const STATUS_STYLES: Record<string, React.CSSProperties> = {
  new:       { backgroundColor: '#2a2a2a', color: '#888', borderRadius: '5px', padding: '2px 8px', fontSize: '11px', fontWeight: '500' },
  shortlist: { backgroundColor: '#14532d', color: '#86efac', borderRadius: '5px', padding: '2px 8px', fontSize: '11px', fontWeight: '500' },
  applied:   { backgroundColor: '#1e3a5f', color: '#93c5fd', borderRadius: '5px', padding: '2px 8px', fontSize: '11px', fontWeight: '500' },
  skip:      { backgroundColor: '#450a0a', color: '#fca5a5', borderRadius: '5px', padding: '2px 8px', fontSize: '11px', fontWeight: '500' },
};

const SOURCE_LABELS: Record<string, string> = {
  reed:            'Reed',
  remotive:        'Remotive',
  weworkremotely:  'WWR',
  jobicy:          'Jobicy',
  adzuna:          'Adzuna',
  greenhouse:      'Greenhouse',
  lever:           'Lever',
  ashby:           'Ashby',
};

export function TableRow({ job }: { job: JobRow }) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/review/${job.job_id}`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this job?')) return;
    await fetch(`/api/review/job/${job.job_id}`, { method: 'DELETE' });
    router.refresh();
  };

  const sourceLabel = SOURCE_LABELS[String(job.source ?? '').toLowerCase()] ?? String(job.source ?? '—');
  const rec = String(job.recommendation ?? recFromTier(String(job.tier)));
  const recLabel = REC_LABELS[rec] ?? rec;

  return (
    <tr
      style={{ borderBottom: '1px solid #222', cursor: 'pointer', backgroundColor: '#1a1a1a' }}
      className="hover:bg-neutral-700"
      onClick={handleClick}
    >
      <td style={{ padding: '11px 14px' }}>
        <span style={REC_STYLES[rec] ?? {}}>
          {recLabel}
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
      <td style={{ padding: '11px 14px', color: '#888', fontSize: '11px' }}>
        {sourceLabel}
      </td>
      <td style={{ padding: '11px 14px', color: '#ccc', fontWeight: '500', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {String(job.company ?? '—')}
      </td>
      <td style={{ padding: '11px 14px', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        <Link
          href={`/review/${job.job_id}`}
          style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: '500' }}
          className="hover:underline"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          {String(job.title ?? '—')}
        </Link>
      </td>
      <td style={{ padding: '11px 14px', color: '#888', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(job.location ?? '—')}</td>
      <td style={{ padding: '11px 14px', color: '#888' }}>{String(job.remote ?? '—')}</td>
      <td style={{ padding: '11px 14px', color: '#555' }}>
        {job.posted_at
          ? new Date(String(job.posted_at)).toLocaleDateString('en-GB')
          : '—'}
      </td>
      <td style={{ padding: '11px 14px', color: '#555' }}>
        {job.scored_at
          ? new Date(String(job.scored_at)).toLocaleDateString('en-GB')
          : '—'}
      </td>
      <td style={{ padding: '11px 14px' }}>
        <button
          onClick={handleDelete}
          style={{
            background: 'none',
            border: '1px solid #3a3a3a',
            borderRadius: '5px',
            color: '#6b7280',
            cursor: 'pointer',
            fontSize: '11px',
            padding: '2px 8px',
            lineHeight: '1.5',
          }}
        >
          ✕
        </button>
      </td>
    </tr>
  );
}
