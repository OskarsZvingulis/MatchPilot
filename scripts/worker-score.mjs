/**
 * MatchPilot scoring worker.
 * Runs as a standalone Railway service — loops forever, draining jobs_queue
 * by calling the web service's existing /api/worker/score endpoint.
 *
 * Required env vars:
 *   WORKER_ENDPOINT   e.g. https://matchpilot-web.up.railway.app/api/worker/score
 *   WORKER_SECRET     same value as on the web service
 */

const ENDPOINT      = process.env.WORKER_ENDPOINT;
const SECRET        = process.env.WORKER_SECRET;
const SLEEP_EMPTY   = parseInt(process.env.WORKER_SLEEP_EMPTY_MS  ?? '3000', 10);
const SLEEP_ERROR   = parseInt(process.env.WORKER_SLEEP_ERROR_MS  ?? '5000', 10);

if (!ENDPOINT) {
  console.error('[worker] WORKER_ENDPOINT is not set. Exiting.');
  process.exit(1);
}

let running = true;

process.on('SIGTERM', () => {
  console.log('[worker] SIGTERM received — finishing current job then stopping.');
  running = false;
});

process.on('SIGINT', () => {
  console.log('[worker] SIGINT received — stopping.');
  running = false;
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tick() {
  const headers = { 'Content-Type': 'application/json' };
  if (SECRET) headers['x-worker-secret'] = SECRET;

  const res = await fetch(ENDPOINT, { method: 'POST', headers });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  return await res.json();
}

async function main() {
  console.log(`[worker] Started. Endpoint: ${ENDPOINT}`);

  while (running) {
    try {
      const result = await tick();

      if (result.processed > 0) {
        const tag = result.skipped ? 'skip(already scored)' : 'scored';
        console.log(`[worker] Job processed — id=${result.job_id} (${tag})`);
        // No sleep — immediately try next job
      } else {
        // Queue empty
        await sleep(SLEEP_EMPTY);
      }
    } catch (err) {
      console.error(`[worker] Error: ${err.message}`);
      await sleep(SLEEP_ERROR);
    }
  }

  console.log('[worker] Stopped cleanly.');
}

main();
