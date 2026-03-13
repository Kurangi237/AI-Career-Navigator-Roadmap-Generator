type JobEvent = {
  id: string;
  createdAt: number;
  title: string;
  company: string;
  location: string;
  link: string;
  source?: string;
};

type RealtimeState = {
  seen: Set<string>;
  events: JobEvent[];
};

declare global {
  // eslint-disable-next-line no-var
  var __kbvJobRealtime: RealtimeState | undefined;
}

const state: RealtimeState =
  globalThis.__kbvJobRealtime ||
  (globalThis.__kbvJobRealtime = {
    seen: new Set<string>(),
    events: [],
  });

const eventId = (seed: string) => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${seed.slice(0, 24)}`;

export const ingestJobsForEvents = (jobs: Array<{ title?: string; company?: string; location?: string; link?: string; source?: string }>) => {
  const now = Date.now();
  const newEvents: JobEvent[] = [];

  for (const job of jobs) {
    const title = `${job.title || ''}`.trim();
    const company = `${job.company || ''}`.trim();
    const link = `${job.link || ''}`.trim();
    if (!title || !link) continue;

    const key = `${title}|${company}|${link}`.toLowerCase();
    if (state.seen.has(key)) continue;
    state.seen.add(key);

    newEvents.push({
      id: eventId(key),
      createdAt: now,
      title,
      company,
      location: `${job.location || ''}`.trim(),
      link,
      source: job.source || '',
    });
  }

  if (newEvents.length) {
    state.events.push(...newEvents);
    if (state.events.length > 8000) {
      state.events = state.events.slice(-8000);
    }
    if (state.seen.size > 20000) {
      const latestKeys = new Set(state.events.map((e) => `${e.title}|${e.company}|${e.link}`.toLowerCase()));
      state.seen = latestKeys;
    }
  }

  return newEvents.length;
};

export const getJobEventsSince = (cursor: number, limit = 100): { events: JobEvent[]; cursor: number } => {
  const safeCursor = Number.isFinite(cursor) ? cursor : 0;
  const events = state.events.filter((e) => e.createdAt > safeCursor).slice(-Math.max(1, Math.min(limit, 300)));
  const nextCursor = events.length ? events[events.length - 1].createdAt : safeCursor;
  return { events, cursor: nextCursor };
};

