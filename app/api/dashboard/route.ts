import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const sql = getDb();

    const [tierRows, funnelRows, queueRows] = await Promise.all([
      sql`
        SELECT
          s.tier,
          COUNT(*)::int                                                         AS total,
          ROUND(AVG(s.score))::int                                              AS avg_score,
          SUM(CASE WHEN r.status = 'shortlist' THEN 1 ELSE 0 END)::int         AS shortlisted,
          SUM(CASE WHEN r.status = 'applied'   THEN 1 ELSE 0 END)::int         AS applied,
          SUM(CASE WHEN r.status = 'skip'      THEN 1 ELSE 0 END)::int         AS skipped
        FROM jobs_scored s
        LEFT JOIN job_review r ON r.job_id = s.job_id
        GROUP BY s.tier
        ORDER BY
          CASE s.tier WHEN 'A' THEN 1 WHEN 'B' THEN 2 WHEN 'C' THEN 3 ELSE 4 END
      `,
      sql`
        SELECT
          COALESCE(r.status, 'new') AS status,
          COUNT(*)::int             AS count
        FROM jobs_scored s
        LEFT JOIN job_review r ON r.job_id = s.job_id
        GROUP BY COALESCE(r.status, 'new')
        ORDER BY
          CASE COALESCE(r.status, 'new')
            WHEN 'new'       THEN 1
            WHEN 'shortlist' THEN 2
            WHEN 'applied'   THEN 3
            WHEN 'skip'      THEN 4
          END
      `,
      sql`
        SELECT status, COUNT(*)::int AS count
        FROM jobs_queue
        GROUP BY status
        ORDER BY status
      `,
    ]);

    return NextResponse.json({
      tierStats:    tierRows,
      reviewFunnel: funnelRows,
      queueHealth:  queueRows,
    });
  } catch (err) {
    console.error('[dashboard]', err);
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 });
  }
}
