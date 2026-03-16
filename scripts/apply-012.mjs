/**
 * One-shot script: apply migration 012 columns to jobs_scored.
 * Run: DATABASE_URL=... node scripts/apply-012.mjs
 */
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }

const sql = neon(DATABASE_URL);

console.log('Adding columns...');
await sql`ALTER TABLE jobs_scored ADD COLUMN IF NOT EXISTS tech_mismatch_level TEXT`;
console.log('  tech_mismatch_level OK');
await sql`ALTER TABLE jobs_scored ADD COLUMN IF NOT EXISTS salary_currency TEXT`;
console.log('  salary_currency OK');
await sql`ALTER TABLE jobs_scored ADD COLUMN IF NOT EXISTS evaluation_path TEXT`;
console.log('  evaluation_path OK');
await sql`ALTER TABLE jobs_scored ADD COLUMN IF NOT EXISTS recommendation TEXT`;
console.log('  recommendation OK');
await sql`ALTER TABLE jobs_scored ADD COLUMN IF NOT EXISTS blockers JSONB`;
console.log('  blockers OK');

console.log('Backfilling...');
await sql`UPDATE jobs_scored SET recommendation = CASE tier WHEN 'A' THEN 'strong_match' WHEN 'B' THEN 'possible_match' WHEN 'C' THEN 'weak_match' WHEN 'reject' THEN 'ineligible' ELSE 'ineligible' END WHERE recommendation IS NULL`;
console.log('  recommendation backfilled');
await sql`UPDATE jobs_scored SET evaluation_path = 'evaluate' WHERE evaluation_path IS NULL`;
console.log('  evaluation_path backfilled');
await sql`UPDATE jobs_scored SET blockers = '[]'::jsonb WHERE blockers IS NULL`;
console.log('  blockers backfilled');

const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'jobs_scored' AND column_name IN ('tech_mismatch_level','salary_currency','evaluation_path','recommendation','blockers') ORDER BY column_name`;
console.log('\nColumns now present:', cols.map(r => r.column_name).join(', '));
