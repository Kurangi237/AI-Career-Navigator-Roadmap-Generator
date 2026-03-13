import { getJobEventsSince } from '../../services/jobRealtime';

export default async function handler(req: any, res: any) {
  const cursorStart = Number(req.query?.cursor || 0);
  let cursor = Number.isFinite(cursorStart) ? cursorStart : 0;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const send = (payload: any) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  send({ type: 'ready', cursor, ts: Date.now() });

  const timer = setInterval(() => {
    const data = getJobEventsSince(cursor, 120);
    if (data.events.length > 0) {
      cursor = data.cursor;
      send({ type: 'events', cursor, events: data.events, ts: Date.now() });
    } else {
      send({ type: 'heartbeat', cursor, ts: Date.now() });
    }
  }, 5000);

  req.on('close', () => {
    clearInterval(timer);
    try { res.end(); } catch { /* ignore */ }
  });
}

