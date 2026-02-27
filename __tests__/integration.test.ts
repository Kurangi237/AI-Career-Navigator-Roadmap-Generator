import { supabase } from '../lib/database';
import { cacheService } from '../services/cache';

describe('integration wiring', () => {
  it('exports a supabase client with from()', () => {
    expect(supabase).toBeDefined();
    expect(typeof supabase.from).toBe('function');
  });

  it('cache getOrCompute stores and returns value', async () => {
    const key = `test:${Date.now()}`;
    const computed = await cacheService.getOrCompute(
      key,
      async () => ({ ok: true, value: 42 }),
      { ttl: 60 }
    );

    expect(computed).toEqual({ ok: true, value: 42 });

    const cached = await cacheService.get(key);
    expect(cached).toEqual({ ok: true, value: 42 });

    await cacheService.delete(key);
    const missing = await cacheService.get(key);
    expect(missing).toBeNull();
  });
});
