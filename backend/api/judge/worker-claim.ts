import { claimNextQueuedJob } from './_queue-store.ts';

const TOKEN = process.env.JUDGE_WORKER_TOKEN || 'local-worker-token';

export default async function handler(req: any, res: any) {
  try {
    const token = `${req.headers?.['x-worker-token'] || ''}`;
    if (token !== TOKEN) return res.status(401).json({ error: 'unauthorized worker' });
    const job = await claimNextQueuedJob();
    if (!job) return res.status(200).json({ job: null });
    return res.status(200).json({ job });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'worker claim error' });
  }
}
