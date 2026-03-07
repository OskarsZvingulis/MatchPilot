## Vercel Deployment Checklist

1. Push all changes to GitHub main branch
2. Connect repo to Vercel (vercel.com/new)
3. Set these environment variables in Vercel dashboard:
   - DATABASE_URL
   - OPENAI_API_KEY
   - TELEGRAM_BOT_TOKEN
   - TELEGRAM_CHAT_ID
   - WORKER_SECRET
   - ADMIN_USERNAME
   - ADMIN_PASSWORD
   - NEXTAUTH_SECRET
   - NEXTAUTH_URL (set to your vercel deployment URL)
4. Deploy
5. Run migrations against production DB in Neon (run each migrations/*.sql file in order)
6. Update Telegram webhook URL:
   POST https://api.telegram.org/bot{TOKEN}/setWebhook
   Body: { url: "https://your-vercel-url/api/telegram/webhook" }
7. Smoke test:
   - GET /api/health
   - POST /api/worker/score (with x-worker-secret header)
   - Visit /review (should redirect to /login)

## Worker Trigger
The worker is triggered by n8n on Railway via HTTP POST to /api/worker/score.
No Vercel cron required. Configure n8n to call the worker after each ingestion run.
