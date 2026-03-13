import fs from 'fs';
import path from 'path';

type CachePayload<T> = {
  updatedAt: number;
  data: T;
};

type CacheStore = Record<string, CachePayload<any>>;

const CACHE_FILE = path.resolve(process.cwd(), 'backend', '.cache', 'jobs-cache.json');
const CACHE_DIR = path.dirname(CACHE_FILE);

let memStore: CacheStore | null = null;

const ensureLoaded = () => {
  if (memStore) return;
  memStore = {};
  try {
    if (!fs.existsSync(CACHE_FILE)) return;
    const raw = fs.readFileSync(CACHE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') memStore = parsed;
  } catch {
    memStore = {};
  }
};

const persist = () => {
  if (!memStore) return;
  try {
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(memStore), 'utf8');
  } catch {
    // non-fatal in serverless/readonly env
  }
};

export const getCacheRecord = <T>(key: string, maxAgeMs: number): T | null => {
  ensureLoaded();
  const row = memStore?.[key];
  if (!row) return null;
  if (Date.now() - row.updatedAt > maxAgeMs) return null;
  return row.data as T;
};

export const setCacheRecord = <T>(key: string, data: T): void => {
  ensureLoaded();
  if (!memStore) memStore = {};
  memStore[key] = { updatedAt: Date.now(), data };
  const keys = Object.keys(memStore);
  if (keys.length > 400) {
    const sorted = keys
      .map((k) => ({ k, updatedAt: memStore?.[k]?.updatedAt || 0 }))
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 250);
    const next: CacheStore = {};
    sorted.forEach((x) => {
      if (memStore && memStore[x.k]) next[x.k] = memStore[x.k];
    });
    memStore = next;
  }
  persist();
};

