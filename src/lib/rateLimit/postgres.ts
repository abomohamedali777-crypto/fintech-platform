import { getDbPool } from "@/lib/db";
import type { RateLimitOptions, RateLimitResult, RateLimitStore } from "./store";
import { gridWindowStart, retryAfterSeconds } from "./store";

const CLEANUP_THRESHOLD_MS = 24 * 60 * 60 * 1000;
const CLEANUP_EVERY_N_OPS = 512;

/**
 * Distributed rate-limit store backed by Postgres.
 *
 * Correctness on a single logical table row makes this safe across multiple
 * serverless instances: the INSERT ... ON CONFLICT ... DO UPDATE is atomic, so
 * concurrent requests from different instances cannot double-spend the budget.
 *
 * Requires the `rate_limits` table (see supabase-schema.sql). The `bucket_key`
 * provided by callers is a salted SHA-256 hash (never raw PII), and
 * `window_start` is written as an ISO-8601 string — a bare JS epoch-millisecond
 * integer is parsed by PostgreSQL as a year and rejected as out of range.
 * If the table or database is unavailable, consume() throws and the caller
 * falls back to the in-memory store rather than failing closed.
 */
export class PostgresRateLimitStore implements RateLimitStore {
  private opsSinceCleanup = 0;

  async consume(
    key: string,
    options: RateLimitOptions,
    now = Date.now(),
  ): Promise<RateLimitResult> {
    const pool = getDbPool();
    if (!pool) throw new Error("DATABASE_URL not configured");

    const windowStart = gridWindowStart(now, options.windowMs);

    // window_start is a `timestamptz`. It must be bound as an ISO-8601 string:
    // PostgreSQL interprets a bare numeric token (and therefore a JS
    // epoch-millisecond integer such as 1726502400000) as a YEAR per
    // Appendix B.1, which is out of range and makes every write fail.
    const windowStartIso = new Date(windowStart).toISOString();

    const result = await pool.query(
      `INSERT INTO rate_limits (bucket_key, window_start, count)
       VALUES ($1, $2, 1)
       ON CONFLICT (bucket_key, window_start)
       DO UPDATE SET count = rate_limits.count + 1
       RETURNING count`,
      [key, windowStartIso],
    );

    const count = Number(result.rows[0]?.count ?? 1);
    this.maybeCleanup(now);

    if (count > options.limit) {
      return { allowed: false, retryAfterSeconds: retryAfterSeconds(windowStart, options.windowMs, now) };
    }
    return { allowed: true, retryAfterSeconds: 0 };
  }

  async clear(): Promise<void> {
    const pool = getDbPool();
    if (!pool) return;
    await pool.query("DELETE FROM rate_limits");
  }

  private async maybeCleanup(now: number): Promise<void> {
    this.opsSinceCleanup += 1;
    if (this.opsSinceCleanup < CLEANUP_EVERY_N_OPS) return;
    this.opsSinceCleanup = 0;
    const pool = getDbPool();
    if (!pool) return;
    try {
      // Same ISO-8601 contract as the insert: a numeric cutoff would be parsed
      // as a (far-future) year and never match, or match everything.
      await pool.query("DELETE FROM rate_limits WHERE window_start < $1", [
        new Date(now - CLEANUP_THRESHOLD_MS).toISOString(),
      ]);
    } catch {
      /* cleanup is best-effort */
    }
  }
}