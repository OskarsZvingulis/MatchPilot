import { neon } from '@neondatabase/serverless';
import { ENV } from '@/lib/env';

export function getDb() {
  return neon(ENV.DATABASE_URL);
}

export async function getJobsRawCount(): Promise<number> {
  const sql = getDb();
  const result = await sql`SELECT COUNT(*) AS count FROM jobs_raw`;
  return Number(result[0].count);
}
