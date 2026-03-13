import { getJobEventsSince } from '../../services/jobRealtime';

export default async function handler(req: any, res: any) {
  try {
    const cursor = Number(req.query?.cursor || 0);
    const limit = Number(req.query?.limit || 100);
    const data = getJobEventsSince(cursor, limit);
    return res.status(200).json({
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'events error' });
  }
}

