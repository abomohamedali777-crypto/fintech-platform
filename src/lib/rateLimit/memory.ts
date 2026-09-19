import type { RateLimitOptions, RateLimitResult, RateLimitStore } from "./store";
import { gridWindowStart, retryAfterSeconds } from "./store";

const MAX_ENTRIES = 10_000;

/**
 * In-memory fixed-window (fixed time-grid) rate-limit store.
 *
 * Buckets align to the same grid as the Postgres store (see gridWindowStart),
 * so the two implementations agree on window boundaries and Retry-After values
 * for identical traffic. Suitable for single-instance deployments and as a
 * fallback when the database-backed store is unavailable. NOT a substitute for
 * a distributed store on horizontally-scaled or multi-instance serverless
 * deployments.
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, { windowStart: number; count: number }>();
  private opsSincePrune = 0;

  async consume(
    key: string,
    options: RateLimitOptions,
    now = Date.now(),
  ): Promise<RateLimitResult> {
    this.maybePrune(options.windowMs, now);

    let entry = this.store.get(key);
    if (!entry || now - entry.windowStart >= options.windowMs) {
      entry = { windowStart: gridWindowStart(now, options.windowMs), count: 0 };
      this.store.set(key, entry);
    }

    entry.count += 1;

    if (entry.count > options.limit) {
      return { allowed: false, retryAfterSeconds: retryAfterSeconds(entry.windowStart, options.windowMs, now) };
    }
    return { allowed: true, retryAfterSeconds: 0 };
  }

  async clear(): Promise<void> {
    this.store.clear();
    this.opsSincePrune = 0;
  }

  private maybePrune(windowMs: number, now: number) {
    this.opsSincePrune += 1;
    if (this.opsSincePrune >= 500) {
      this.opsSincePrune = 0;
      for (const [key, entry] of this.store) {
        if (now - entry.windowStart >= windowMs) this.store.delete(key);
      }
    }
    if (this.store.size > MAX_ENTRIES) {
      const extra = this.store.size - MAX_ENTRIES;
      let removed = 0;
      for (const key of this.store.keys()) {
        if (removed >= extra) break;
        this.store.delete(key);
        removed += 1;
      }
    }
  }
}