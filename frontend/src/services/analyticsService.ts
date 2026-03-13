type AnalyticsEvent = {
  id: string;
  name: string;
  at: number;
  meta?: Record<string, any>;
};

const KEY = 'KBV_analytics_events';

const readEvents = (): AnalyticsEvent[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeEvents = (events: AnalyticsEvent[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(events.slice(-500)));
  } catch {
    // ignore analytics write failures
  }
};

export const trackEvent = (name: string, meta?: Record<string, any>) => {
  const event: AnalyticsEvent = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    at: Date.now(),
    meta,
  };
  const events = readEvents();
  events.push(event);
  writeEvents(events);
};

export const getTrackedEvents = () => readEvents();
