const DEFAULT_QUERIES = ['software engineer', 'data analyst', 'frontend developer', 'backend developer', 'devops engineer'];
const COUNTRIES = ['India', 'USA', 'UK', 'Australia', 'Dubai'];

export default async function handler(req: any, res: any) {
  try {
    const token = `${req.query?.token || req.headers?.['x-sync-token'] || ''}`.trim();
    const expected = `${process.env.JOB_SYNC_TOKEN || ''}`.trim();
    if (expected && token !== expected) {
      return res.status(401).json({ error: 'invalid sync token' });
    }

    const host = `${req.headers['x-forwarded-host'] || req.headers.host || ''}`.trim();
    const proto = `${req.headers['x-forwarded-proto'] || 'https'}`.trim();
    if (!host) return res.status(400).json({ error: 'missing host context' });
    const base = `${proto}://${host}`;

    const tasks: Array<{ query: string; country: string }> = [];
    for (const q of DEFAULT_QUERIES) {
      tasks.push({ query: q, country: 'All' });
      COUNTRIES.forEach((c) => tasks.push({ query: q, country: c }));
    }

    const startedAt = Date.now();
    const results = await Promise.all(
      tasks.map(async (t) => {
        try {
          const url = `${base}/api/jobs/search?q=${encodeURIComponent(t.query)}&country=${encodeURIComponent(t.country)}&roleType=All&visa=Any&workMode=Any&roleFocus=All%20Roles&max=3000&forceSync=true`;
          const resp = await fetch(url);
          const data: any = await resp.json();
          return { ...t, ok: resp.ok, total: data?.total || 0 };
        } catch (e: any) {
          return { ...t, ok: false, total: 0, error: e?.message || 'sync failed' };
        }
      })
    );

    return res.status(200).json({
      ok: true,
      jobsSynced: results.reduce((sum, r) => sum + (r.total || 0), 0),
      tasks: results.length,
      success: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      durationMs: Date.now() - startedAt,
      results,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'sync error' });
  }
}

