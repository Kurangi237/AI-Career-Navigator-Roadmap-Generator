export default async function handler(req: any, res: any) {
  const cursor = Number(req.query?.cursor || 0);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const send = (payload: any) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  send({ type: 'ready', cursor, ts: Date.now() });

  const timer = setInterval(() => {
    send({ type: 'heartbeat', cursor, ts: Date.now() });
  }, 5000);

  req.on('close', () => {
    clearInterval(timer);
    try { res.end(); } catch { /* ignore */ }
  });
}
