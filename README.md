# MatchPilot — AI Job Ingestion & Deterministic Scoring Engine

## Overview

MatchPilot is an AI-driven job ingestion and scoring system.

It collects job postings from external sources, normalizes them, stores them in a structured schema, processes them through a queue-based worker, and assigns deterministic tiers using an AI scoring layer.

Designed for controlled, idempotent processing with safe concurrency.

---

## Architecture

Reed API  
→ n8n (normalization layer)  
→ jobs_raw  
→ jobs_queue  
→ scoring worker  
→ jobs_scored  
→ Review UI + Telegram alerts  

---

## Core Design Principles

- Atomic upsert ingestion (content-hash based deduplication)
- Queue-based processing (no uncontrolled parallelism)
- Deterministic tiering
- Explicit score_version tracking
- Idempotent worker logic
- Safe concurrency via `FOR UPDATE SKIP LOCKED`
- Failure logging with full payload capture

---

## Tech Stack

- Next.js (App Router)
- Neon Postgres (`@neondatabase/serverless`)
- OpenAI (structured scoring)
- Telegram Bot API (notifications)
- n8n (ingestion automation)

---

## Database Schema

### jobs_raw

- id UUID
- external_id TEXT
- company TEXT
- title TEXT
- location TEXT
- remote TEXT
- url TEXT
- description TEXT
- posted_at TIMESTAMPTZ
- content_hash TEXT
- ingested_at TIMESTAMPTZ
- source_id UUID
- source TEXT

---

### jobs_queue

- job_id UUID (PK → jobs_raw.id)
- status TEXT
- attempts INT
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ
- locked_at TIMESTAMPTZ
- error TEXT

---

### jobs_scored

- job_id UUID (PK)
- score INT
- tier TEXT
- score_version INT
- created_at TIMESTAMPTZ

---

### jobs_failures

- id UUID
- job_id UUID
- source TEXT
- error TEXT
- payload JSONB
- created_at TIMESTAMPTZ

---

## Worker Logic

- Selects jobs using `FOR UPDATE SKIP LOCKED`
- Single-job deterministic processing
- Skips jobs already present in `jobs_scored`
- Recovers stale locks after 10 minutes
- Logs structured failures to `jobs_failures`
- Requires `x-worker-secret` header for execution

---

## API Routes

POST `/api/worker/score`  
Process one queued job.

GET `/api/health`  
Database connectivity + pending queue count.

GET `/api/review/jobs`  
Paginated scored job list.

GET `/api/review/jobs/[id]`  
Detailed job view.

---

## Environment Variables

Required:

- DATABASE_URL
- OPENAI_API_KEY
- TELEGRAM_BOT_TOKEN
- WORKER_SECRET

---

## Getting Started

```
npm install
cp .env.local.example .env.local
npm run dev
npm run seed
```

Trigger worker:

```
POST /api/worker/score
```

---

## Status

Core ingestion, queue processing, scoring, review endpoints, and Telegram alerts are operational.

Currently optimizing worker throughput and scaling strategy.