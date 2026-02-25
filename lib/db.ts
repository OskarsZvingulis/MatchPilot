import { neon } from '@neondatabase/serverless';

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return neon(url);
}

export async function getJobsRawCount(): Promise<number> {
  const sql = getDb();
  const result = await sql`SELECT COUNT(*) AS count FROM jobs_raw`;
  return Number(result[0].count);
}
