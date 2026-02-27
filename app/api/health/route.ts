import { getDb } from "../../../lib/db";

export async function GET() {
  let dbOk = false;
  let pendingJobs = 0;

  try {
    const sql = getDb();
    // Test database connection
    await sql`SELECT 1`;
    dbOk = true;

    // Count pending jobs
    const pendingResult = await sql`SELECT COUNT(*) FROM jobs_queue WHERE status = 'pending'`;
    pendingJobs = Number(pendingResult[0].count);

  } catch (error) {
    console.error("Health check failed:", error);
    dbOk = false;
    pendingJobs = 0; // Ensure a default value in case of error
  }

  return new Response(JSON.stringify({
    ok: dbOk,
    db: dbOk ? "OK" : "Error",
    pending: pendingJobs,
  }), {
    status: dbOk ? 200 : 500,
    headers: { 'Content-Type': 'application/json' },
  });
}