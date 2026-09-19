export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

export interface RateLimitStore {
  /**
   * Atomically records a request for `key` and reports whether it is within
   * the allowed budget. Must never throw for rate-limit accounting purposes;
   * callers may fall back to an in-memory store if this errors.
   */
  consume(key: string, options: RateLimitOptions, now?: number): Promise<RateLimitResult>;
  clear(): Promise<void>;
}

export function retryAfterSeconds(windowStart: number, windowMs: number, now: number): number {
  return Math.max(1, Math.ceil((windowStart + windowMs - now) / 1000));
}

/**
 * Aligns a timestamp to the start of its fixed-size window bucket on a grid.
 *
 * Every store uses the same grid so the in-memory fallback and the Postgres
 * store produce identical buckets (and therefore identical Retry-After values)
 * for the same traffic.
 */
export function gridWindowStart(now: number, windowMs: number): number {
  return Math.floor(now / windowMs) * windowMs;
}