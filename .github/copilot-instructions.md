# MatchPilot — Copilot Instructions

## Commands

```bash
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run lint         # ESLint (no test suite exists)
npm run seed         # Seed DB via scripts/seed.ts
npm run worker:score # Run scoring worker (node scripts/worker-score.mjs)
```

No automated test suite. Manual testing is done via `POST /api/worker/score` and `GET /api/health`.

## Architecture

```
Reed API → n8n (normalization) → POST /api/ingest
  → jobs_raw (content-hash dedup, ON CONFLICT DO NOTHING)
  → jobs_queue (status: pending → processing → done/failed)
  → POST /api/worker/score (FOR UPDATE SKIP LOCKED, one job per call)
    → lib/scoringPipeline.ts
      1. Canonical dedup check (lib/canonicalDedup.ts)
      2. URL liveness check (expired → reject_fast)
      3. Gemini LLM extraction (lib/gemini.ts → JobExtraction)
      4. Deterministic score computation (computeScore)
      5. Upsert to jobs_scored + job_review + job_notifications
  → Review UI (/review) + Telegram alerts (strong_match only)
```

**Key constraint**: Gemini's `raw_score` is **never used directly** as the final score. It's an input to `computeScore()` in `lib/scoringPipeline.ts`, which applies deterministic ceilings and penalties defined in `lib/candidateProfile.ts`.

## Database

Neon Postgres via `@neondatabase/serverless`. All DB access goes through `getDb()` in `lib/db.ts`, which returns a tagged-template SQL client. Use template literals, not string concatenation:

```ts
const sql = getDb();
const rows = await sql`SELECT * FROM jobs_raw WHERE id = ${id}`;
```

Migrations are plain SQL files in `migrations/` (applied manually). Schema has two dedup layers:
- **Level 1**: `content_hash` unique constraint on `jobs_raw` (`ON CONFLICT DO NOTHING`)
- **Level 2**: `jobs_canonical` table — cross-source dedup by normalized company+title+date window (see `lib/canonicalDedup.ts`)

## Scoring System

The scoring model is fully contained in two files:

- **`lib/candidateProfile.ts`** — single source of truth for all thresholds, penalties, ceilings, and stack definitions. Edit this file to change scoring behavior.
- **`lib/scoringPipeline.ts`** — implements `computeScore()` and `deriveRecommendation()` deterministically from `JobExtraction` signals.

Tier mapping: `strong_match → A`, `possible_match → B`, `weak_match → C`, `ineligible → reject`

Score thresholds: `≥86 + no major stretch → strong_match`, `≥72 → possible_match`, else `weak_match`.

Major stretch signals (block `strong_match`): `seniority_level === 'senior' | 'lead_plus'`, `infra_depth === 'heavy'`, `management_expectation === true`.

## Key Conventions

**Environment variables** are accessed only through `lib/env.ts` (`ENV` object). `ADMIN_PASSWORD_HASH` is stored base64-encoded to prevent Next.js dotenv `$` interpolation; `lib/env.ts` decodes it at runtime.

**Auth**: NextAuth.js with credentials provider. The `middleware.ts` protects `/review` and `/api/review` routes by JWT token check. Worker routes are protected by `x-worker-secret` header check against `ENV.WORKER_SECRET`.

**Logging**: Use `logger` from `lib/logger.ts` (structured JSON: `{ level, msg, ...meta, ts }`). Do not use `console.log` directly in application code.

**Type contracts**: `lib/reviewContract.ts` is the authoritative source for shared types (`JobRow`, `ScoredJob`, `RawJob`, `ReviewState`) and runtime validators (`parseJobsResponse`, `parseJobDetailResponse`). Use these instead of defining local types in components or API routes.

**Worker safety**: The scoring worker uses `FOR UPDATE SKIP LOCKED` for concurrency safety. Stale `processing` locks are recovered after 10 minutes. Failures are written to `jobs_failures` with full payload. Worker retries up to 3 attempts before marking `failed`.

**Ingest idempotency**: `POST /api/ingest` uses `ON CONFLICT DO NOTHING` on both `jobs_raw` (by content_hash) and `jobs_queue`. Safe to call multiple times with the same payload.

## Environment Variables

```
DATABASE_URL          # Neon Postgres connection string (required)
GEMINI_API_KEY        # Google Gemini API (required for scoring)
TELEGRAM_BOT_TOKEN    # Telegram bot notifications
TELEGRAM_SECRET_TOKEN # Webhook validation
WORKER_SECRET         # x-worker-secret header for /api/worker/score
ADMIN_USERNAME        # Credentials auth username
ADMIN_PASSWORD_HASH   # bcrypt hash, base64-encoded
NEXTAUTH_SECRET       # NextAuth signing secret
```
