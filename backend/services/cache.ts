/**
 * Cache Service
 * Redis caching layer for performance optimization
 */

import Redis from 'ioredis';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
}

class CacheService {
  private redis: Redis;
  private defaultTTL = 3600; // 1 hour

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redis = new Redis(redisUrl);

    this.redis.on('connect', () => {
      console.log('Cache connected to Redis');
    });

    this.redis.on('error', (err) => {
      console.error('Cache error:', err);
    });
  }

  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (err) {
      console.error(`Cache get error for ${key}:`, err);
      return null;
    }
  }

  /**
   * Set cached value
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    try {
      const ttl = options?.ttl || this.defaultTTL;
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } catch (err) {
      console.error(`Cache set error for ${key}:`, err);
    }
  }

  /**
   * Delete cached value
   */
  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (err) {
      console.error(`Cache delete error for ${key}:`, err);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      await this.redis.flushdb();
    } catch (err) {
      console.error('Cache clear error:', err);
    }
  }

  /**
   * Get or compute cached value
   */
  async getOrCompute<T>(
    key: string,
    compute: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    try {
      // Try to get from cache
      const cached = await this.get<T>(key);
      if (cached) return cached;

      // Compute and cache
      const value = await compute();
      await this.set(key, value, options);
      return value;
    } catch (err) {
      console.error(`Cache getOrCompute error for ${key}:`, err);
      // Return computed value without caching
      return compute();
    }
  }

  // Cache key generators
  static problemKeys = {
    metadata: (id: string) => `problem:${id}:metadata`,
    withTestCases: (id: string) => `problem:${id}:with-cases`,
    byDifficulty: (difficulty: string) => `problems:difficulty:${difficulty}`,
    byTopic: (topic: string) => `problems:topic:${topic}`,
  };

  static leaderboardKeys = {
    contest: (contestId: string) => `leaderboard:contest:${contestId}`,
    global: () => 'leaderboard:global',
    weekly: () => 'leaderboard:weekly',
  };

  static userKeys = {
    stats: (userId: string) => `user:${userId}:stats`,
    submissions: (userId: string) => `user:${userId}:submissions`,
    profile: (userId: string) => `user:${userId}:profile`,
  };

  static discussionKeys = {
    thread: (discussionId: string) => `discussion:${discussionId}`,
    byProblem: (problemId: string) => `discussions:problem:${problemId}`,
    trending: () => 'discussions:trending',
  };

  /**
   * Invalidate problem cache
   */
  async invalidateProblem(id: string): Promise<void> {
    await Promise.all([
      this.delete(CacheService.problemKeys.metadata(id)),
      this.delete(CacheService.problemKeys.withTestCases(id)),
    ]);
  }

  /**
   * Invalidate leaderboard cache
   */
  async invalidateLeaderboard(contestId: string): Promise<void> {
    await this.delete(CacheService.leaderboardKeys.contest(contestId));
  }

  /**
   * Invalidate user cache
   */
  async invalidateUser(userId: string): Promise<void> {
    await Promise.all([
      this.delete(CacheService.userKeys.stats(userId)),
      this.delete(CacheService.userKeys.submissions(userId)),
      this.delete(CacheService.userKeys.profile(userId)),
    ]);
  }

  /**
   * Get cache stats
   */
  async stats(): Promise<any> {
    try {
      const info = await this.redis.info('stats');
      return info;
    } catch (err) {
      console.error('Cache stats error:', err);
      return null;
    }
  }

  /**
   * Cleanup
   */
  async destroy(): Promise<void> {
    try {
      await this.redis.quit();
    } catch (err) {
      console.error('Cache destroy error:', err);
    }
  }
}

export const cacheService = new CacheService();
export default cacheService;
