import { updateJob } from './_queue-store.ts';

const TOKEN = process.env.JUDGE_WORKER_TOKEN || 'local-worker-token';

export default async function handler(req: any, res: any) {
  try {
    const token = `${req.headers?.['x-worker-token'] || ''}`;
    if (token !== TOKEN) return res.status(401).json({ error: 'unauthorized worker' });
    const { id, result, error } = req.body || {};
    if (!id) return res.status(400).json({ error: 'missing id' });
    const status = error ? 'failed' : 'completed';
    const job = await updateJob(id, { status, result, error, updatedAt: Date.now() });
    if (!job) return res.status(404).json({ error: 'job not found' });
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'worker complete error' });
  }
}
