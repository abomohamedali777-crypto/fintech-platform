import { MemoryRateLimitStore } from "@/lib/rateLimit/memory";
import { PostgresRateLimitStore } from "@/lib/rateLimit/postgres";
import type { RateLimitOptions, RateLimitResult, RateLimitStore } from "@/lib/rateLimit/store";
import { sanitizeDbError } from "@/lib/db";

const memoryStore = new MemoryRateLimitStore();
let postgresStore: PostgresRateLimitStore | null = null;
let sharedFallback = false;

function dbAvailable(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

/**
 * Production-appropriate rate limiting facade.
 *
 * - Uses the distributed Postgres-backed store when DATABASE_URL is set
 *   (safe across multiple serverless instances / cold starts).
 * - Falls back to an in-memory store when the database is unavailable so that
 *   an infrastructure outage does not turn into a hard blocker for the form
 *   (fail-open with degraded, per-instance protection). The fallback is noted
 *   in logs on first use so operators can catch DB misconfiguration.
 * - `resetRateLimitForTests()` is exported for unit tests only.
 */
export async function consumeRateLimit(
  key: string,
  options: RateLimitOptions,
  now?: number,
): Promise<RateLimitResult> {
  if (dbAvailable()) {
    if (!postgresStore) postgresStore = new PostgresRateLimitStore();
    try {
      return await postgresStore.consume(key, options, now);
    } catch (err) {
      if (!sharedFallback) {
        sharedFallback = true;
        // Sanitized code only — the raw pg message may embed connection
        // details and adds nothing the operator can act on here.
        console.warn(
          `[security] Postgres rate-limit store unavailable (${sanitizeDbError(err)}); falling back to in-memory rate limiting. Check DATABASE_URL and that the rate_limits table exists.`,
        );
      }
    }
  }
  return memoryStore.consume(key, options, now);
}

export async function resetRateLimitForTests(): Promise<void> {
  await memoryStore.clear();
  await postgresStore?.clear();
  sharedFallback = false;
}

export type { RateLimitOptions, RateLimitResult, RateLimitStore };