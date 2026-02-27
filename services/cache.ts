type CacheValue = unknown;

interface CacheEntry {
  value: CacheValue;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number;
}

class InMemoryCacheService {
  private readonly store = new Map<string, CacheEntry>();
  private readonly defaultTtlSeconds = 3600;

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const ttl = options?.ttl ?? this.defaultTtlSeconds;
    const expiresAt = Date.now() + ttl * 1000;
    this.store.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async getOrCompute<T>(
    key: string,
    compute: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const value = await compute();
    await this.set(key, value, options);
    return value;
  }
}

export const cacheService = new InMemoryCacheService();
export default cacheService;
