import { getJob } from './_queue-store.ts';

export default async function handler(req: any, res: any) {
  try {
    const id = `${req.query?.id || req.body?.id || ''}`.trim();
    if (!id) return res.status(400).json({ error: 'missing id' });
    const job = await getJob(id);
    if (!job) return res.status(404).json({ error: 'job not found' });
    return res.status(200).json(job);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'queue status error' });
  }
}
