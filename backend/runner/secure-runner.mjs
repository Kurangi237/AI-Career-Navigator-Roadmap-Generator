// Secure judge worker process
// Run separately from API server:
// node backend/runner/secure-runner.mjs

const API_BASE = process.env.JUDGE_API_BASE || 'http://localhost:3004';
const TOKEN = process.env.JUDGE_WORKER_TOKEN || 'local-worker-token';
const POLL_MS = Number(process.env.JUDGE_WORKER_POLL_MS || 1200);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const claim = async () => {
  const resp = await fetch(`${API_BASE}/api/judge/worker-claim`, {
    method: 'POST',
    headers: { 'x-worker-token': TOKEN, 'content-type': 'application/json' },
    body: '{}',
  });
  if (!resp.ok) throw new Error(`claim failed ${resp.status}`);
  return resp.json();
};

const complete = async (id, result, error) => {
  await fetch(`${API_BASE}/api/judge/worker-complete`, {
    method: 'POST',
    headers: { 'x-worker-token': TOKEN, 'content-type': 'application/json' },
    body: JSON.stringify({ id, result, error }),
  });
};

const execute = async (job) => {
  const resp = await fetch(`${API_BASE}/api/judge/run`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(job),
  });
  if (!resp.ok) throw new Error(`run failed ${resp.status}`);
  return resp.json();
};

async function main() {
  console.log(`[runner] started -> ${API_BASE}`);
  while (true) {
    try {
      const { job } = await claim();
      if (!job) {
        await sleep(POLL_MS);
        continue;
      }
      try {
        const result = await execute(job);
        await complete(job.id, result, null);
      } catch (e) {
        await complete(job.id, null, e?.message || 'execution failed');
      }
    } catch (e) {
      console.error('[runner] error', e?.message || e);
      await sleep(POLL_MS);
    }
  }
}

main();
