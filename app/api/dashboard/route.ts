import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const sql = getDb();

    const [
      tierRows,
      funnelRows,
      queueRows,
      sourceRows,
      recRows,
      seniorityRows,
      infraRows,
      techMismatchRows,
      evalPathRows,
      redFlagRows,
      blockerRows,
    ] = await Promise.all([

      // ── Existing: tier breakdown ─────────────────────────────────────────
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

      // ── Existing: review funnel ──────────────────────────────────────────
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

      // ── Existing: queue health ───────────────────────────────────────────
      sql`
        SELECT status, COUNT(*)::int AS count
        FROM jobs_queue
        GROUP BY status
        ORDER BY status
      `,

      // ── New: source quality ──────────────────────────────────────────────
      sql`
        SELECT
          COALESCE(j.source, 'unknown')                                                         AS source,
          COUNT(*)::int                                                                          AS total,
          SUM(CASE WHEN s.evaluation_path = 'reject_fast'           THEN 1 ELSE 0 END)::int    AS reject_fast,
          SUM(CASE WHEN s.evaluation_path = 'evaluate_but_ineligible' THEN 1 ELSE 0 END)::int  AS ineligible,
          SUM(CASE WHEN s.recommendation  = 'strong_match'           THEN 1 ELSE 0 END)::int   AS strong,
          SUM(CASE WHEN s.recommendation  = 'possible_match'         THEN 1 ELSE 0 END)::int   AS possible,
          SUM(CASE WHEN s.recommendation  = 'weak_match'             THEN 1 ELSE 0 END)::int   AS weak,
          ROUND(AVG(CASE WHEN s.evaluation_path = 'evaluate' THEN s.score ELSE NULL END))::int AS avg_score
        FROM jobs_scored s
        JOIN jobs_raw j ON j.id = s.job_id
        GROUP BY COALESCE(j.source, 'unknown')
        ORDER BY total DESC
      `,

      // ── New: recommendation distribution ────────────────────────────────
      sql`
        SELECT
          COALESCE(recommendation, 'unknown') AS recommendation,
          COUNT(*)::int                        AS count
        FROM jobs_scored
        GROUP BY COALESCE(recommendation, 'unknown')
        ORDER BY
          CASE COALESCE(recommendation, 'unknown')
            WHEN 'strong_match'   THEN 1
            WHEN 'possible_match' THEN 2
            WHEN 'weak_match'     THEN 3
            WHEN 'ineligible'     THEN 4
            ELSE 5
          END
      `,

      // ── New: seniority distribution ──────────────────────────────────────
      sql`
        SELECT
          COALESCE(seniority_level, 'unknown') AS seniority_level,
          COUNT(*)::int                         AS count
        FROM jobs_scored
        WHERE evaluation_path != 'reject_fast' OR evaluation_path IS NULL
        GROUP BY COALESCE(seniority_level, 'unknown')
        ORDER BY
          CASE COALESCE(seniority_level, 'unknown')
            WHEN 'junior'    THEN 1
            WHEN 'mid'       THEN 2
            WHEN 'senior'    THEN 3
            WHEN 'lead_plus' THEN 4
            ELSE 5
          END
      `,

      // ── New: infra depth distribution ────────────────────────────────────
      sql`
        SELECT
          COALESCE(infra_depth, 'unknown') AS infra_depth,
          COUNT(*)::int                     AS count
        FROM jobs_scored
        WHERE evaluation_path != 'reject_fast' OR evaluation_path IS NULL
        GROUP BY COALESCE(infra_depth, 'unknown')
        ORDER BY
          CASE COALESCE(infra_depth, 'unknown')
            WHEN 'none'  THEN 1
            WHEN 'light' THEN 2
            WHEN 'heavy' THEN 3
            ELSE 4
          END
      `,

      // ── New: tech mismatch distribution ─────────────────────────────────
      sql`
        SELECT
          COALESCE(tech_mismatch_level, 'unknown') AS tech_mismatch_level,
          COUNT(*)::int                              AS count
        FROM jobs_scored
        WHERE evaluation_path != 'reject_fast' OR evaluation_path IS NULL
        GROUP BY COALESCE(tech_mismatch_level, 'unknown')
        ORDER BY
          CASE COALESCE(tech_mismatch_level, 'unknown')
            WHEN 'none'  THEN 1
            WHEN 'some'  THEN 2
            WHEN 'major' THEN 3
            ELSE 4
          END
      `,

      // ── New: evaluation path breakdown ───────────────────────────────────
      sql`
        SELECT
          COALESCE(evaluation_path, 'unknown') AS evaluation_path,
          COUNT(*)::int                         AS count
        FROM jobs_scored
        GROUP BY COALESCE(evaluation_path, 'unknown')
        ORDER BY count DESC
      `,

      // ── New: top red flags ───────────────────────────────────────────────
      sql`
        SELECT
          flag,
          COUNT(*)::int AS count
        FROM jobs_scored,
             jsonb_array_elements_text(red_flags) AS flag
        WHERE red_flags IS NOT NULL
          AND jsonb_array_length(red_flags) > 0
        GROUP BY flag
        ORDER BY count DESC
        LIMIT 15
      `,

      // ── New: top blockers ────────────────────────────────────────────────
      sql`
        SELECT
          blocker,
          COUNT(*)::int AS count
        FROM jobs_scored,
             jsonb_array_elements_text(blockers) AS blocker
        WHERE blockers IS NOT NULL
          AND jsonb_array_length(blockers) > 0
        GROUP BY blocker
        ORDER BY count DESC
        LIMIT 10
      `,
    ]);

    return NextResponse.json({
      // Existing
      tierStats:        tierRows,
      reviewFunnel:     funnelRows,
      queueHealth:      queueRows,
      // New
      sourceQuality:    sourceRows,
      recDistribution:  recRows,
      seniorityDist:    seniorityRows,
      infraDist:        infraRows,
      techMismatchDist: techMismatchRows,
      evalPathDist:     evalPathRows,
      topRedFlags:      redFlagRows,
      topBlockers:      blockerRows,
    });
  } catch (err) {
    console.error('[dashboard]', err);
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 });
  }
}
