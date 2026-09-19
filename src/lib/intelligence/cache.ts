import type { IntelResponse } from "./types";

export interface QueryCache {
  get(key: string): IntelResponse | undefined;
  set(key: string, response: IntelResponse): void;
  clear(): void;
  readonly size: number;
}

/**
 * Bounded LRU cache with per-entry TTL. max=0 disables the cache entirely
 * (all reads/writes are no-ops), which is useful in tests.
 */
export class LruQueryCache implements QueryCache {
  private map = new Map<
    string,
    { expiresAt: number; value: IntelResponse }
  >();

  constructor(
    private max: number,
    private ttlMs: number,
  ) {}

  get(key: string): IntelResponse | undefined {
    if (this.max <= 0) return undefined;
    const hit = this.map.get(key);
    if (!hit) return undefined;
    if (hit.expiresAt <= Date.now()) {
      this.map.delete(key);
      return undefined;
    }
    // Refresh LRU order by reinserting.
    this.map.delete(key);
    this.map.set(key, hit);
    return hit.value;
  }

  set(key: string, value: IntelResponse): void {
    if (this.max <= 0) return;
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { expiresAt: Date.now() + this.ttlMs, value });
    if (this.map.size > this.max) {
      const oldest = this.map.keys().next();
      if (!oldest.done) this.map.delete(oldest.value);
    }
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }
}