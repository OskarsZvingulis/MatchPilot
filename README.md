# MatchPilot
AI-powered job scoring and review pipeline.

## Architecture
Reed API → n8n (normalize) → jobs_raw → trigger → jobs_queue → worker → jobs_scored → Review UI

## Tech Stack
- Next.js 16 (App Router)
- Neon Postgres (@neondatabase/serverless)
- OpenAI (scoring)
- Telegram (notifications)
- n8n (ingestion automation)

## Database Schema

### jobs_raw
id UUID, external_id TEXT, company TEXT, title TEXT, location TEXT, remote TEXT, url TEXT, description TEXT, posted_at TIMESTAMPTZ, content_hash TEXT, ingested_at TIMESTAMPTZ, source_id UUID, source TEXT

### jobs_queue
job_id UUID PK → jobs_raw(id), status TEXT, attempts INT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, locked_at TIMESTAMPTZ, error TEXT

### jobs_scored
job_id UUID PK, score INT, tier TEXT, score_version INT, created_at TIMESTAMPTZ

### jobs_failures
id UUID, job_id UUID, source TEXT, error TEXT, payload JSONB, created_at TIMESTAMPTZ

## Worker Logic
- FOR UPDATE SKIP LOCKED (safe concurrency)
- Stale lock recovery after 10 minutes
- Idempotent: skips jobs already in jobs_scored
- Failure logged to jobs_failures

## Environment Variables
DATABASE_URL, OPENAI_API_KEY, TELEGRAM_BOT_TOKEN, WORKER_SECRET

## Getting Started
npm install → copy .env.local.example → npm run dev → npm run seed → POST /api/worker/score

## API Routes
- POST /api/worker/score — process one queued job (requires x-worker-secret header)
- GET  /api/health — DB connectivity + pending queue count
- GET  /api/review/jobs — paginated scored job list
- GET  /api/review/jobs/[id] — job detail
