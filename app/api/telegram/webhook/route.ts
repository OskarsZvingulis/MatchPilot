import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ENV } from '@/lib/env';
import { sendTelegramMessage } from '@/lib/telegram';

export async function POST(req: NextRequest) {
  const secretToken = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
  if (secretToken !== ENV.TELEGRAM_SECRET_TOKEN) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const sql = getDb();
  try {
    const body = await req.json();
    const callbackQuery = body.callback_query;

    if (!callbackQuery || !callbackQuery.data) {
      return NextResponse.json({ ok: false, error: 'Invalid callback query' }, { status: 400 });
    }

    const [action, jobId] = callbackQuery.data.split(':');
    if (!action || !jobId) {
      return NextResponse.json({ ok: false, error: 'Invalid callback data format' }, { status: 400 });
    }

    const knownActions = ['shortlist', 'skip', 'apply', 'open'];

    switch (action) {
      case 'shortlist':
        await sql`
          INSERT INTO job_review (job_id, status) VALUES (${jobId}, 'shortlist')
          ON CONFLICT (job_id) DO UPDATE SET status = 'shortlist'
        `;
        break;
      case 'skip':
        await sql`
          INSERT INTO job_review (job_id, status) VALUES (${jobId}, 'skip')
          ON CONFLICT (job_id) DO UPDATE SET status = 'skip'
        `;
        break;
      case 'apply':
        await sql`
          INSERT INTO job_review (job_id, status) VALUES (${jobId}, 'apply')
          ON CONFLICT (job_id) DO UPDATE SET status = 'apply'
        `;
        await sql`
          INSERT INTO job_apply (job_id, status) VALUES (${jobId}, 'queued')
          ON CONFLICT (job_id) DO NOTHING
        `;
        const [jobAssets, jobRaw] = await Promise.all([
          sql`SELECT cover_letter, intro_paragraph FROM job_assets WHERE job_id = ${jobId}`.then(
            (rows) => rows[0]
          ),
          sql`SELECT url FROM jobs_raw WHERE id = ${jobId}`.then((rows) => rows[0]),
        ]);

        if (jobAssets && jobRaw) {
          const { cover_letter, intro_paragraph } = jobAssets;
          const { url } = jobRaw;
          let message = `Apply to: ${url}\n\n${intro_paragraph}\n\n${cover_letter}`;
          if (message.length > 4000) {
            message = message.substring(0, 4000);
          }
          await sendTelegramMessage(message, {
            disable_web_page_preview: true,
          });
        }
        break;
      case 'open':
        // No DB change, just acknowledge
        break;
      default:
        console.warn(`Unknown telegram action: ${action}`);
    }

    if (knownActions.includes(action)) {
      await sql`
            UPDATE job_notifications
            SET last_action = ${action}, action_at = now()
            WHERE job_id = ${jobId}
        `;
    }

    await fetch(`https://api.telegram.org/bot${ENV.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQuery.id,
        text: 'Done',
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Telegram webhook failed:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
