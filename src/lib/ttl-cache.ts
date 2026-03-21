type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export class TtlCache<T = unknown> {
  private store = new Map<string, CacheEntry<T>>();
  private maxEntries: number;

  constructor(maxEntries: number = 500) {
    this.maxEntries = maxEntries;
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs: number): void {
    if (this.store.size >= this.maxEntries) {
      // Simple eviction: delete oldest entry
      const oldestKey = this.store.keys().next().value as string | undefined;
      if (oldestKey) this.store.delete(oldestKey);
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  getOrSet(key: string, ttlMs: number, factory: () => Promise<T>): Promise<T> {
    const cached = this.get(key);
    if (cached !== null) return Promise.resolve(cached);
    return factory().then((value) => {
      this.set(key, value, ttlMs);
      return value;
    });
  }
}

export const apiCache = new TtlCache<any>(1000);
