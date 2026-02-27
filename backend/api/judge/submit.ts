import { randomUUID } from 'node:crypto';
import { enqueueJob } from './_queue-store.ts';

export default async function handler(req: any, res: any) {
  try {
    const { code, testCases } = req.body || {};
    if (!code || !Array.isArray(testCases)) {
      return res.status(400).json({ error: 'missing code/testCases' });
    }
    const now = Date.now();
    const job = {
      id: randomUUID(),
      ...req.body,
      status: 'queued',
      createdAt: now,
      updatedAt: now,
    };
    await enqueueJob(job);
    return res.status(200).json({ jobId: job.id, status: 'queued' });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'queue submit error' });
  }
}
