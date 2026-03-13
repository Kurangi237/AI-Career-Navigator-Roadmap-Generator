export default async function handler(req: any, res: any) {
  try {
    const cursor = Number(req.query?.cursor || 0);
    const limit = Math.min(300, Math.max(1, Number(req.query?.limit || 100)));
    return res.status(200).json({ events: [], cursor, limit, updatedAt: new Date().toISOString() });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'events error' });
  }
}
