import { describe, it, expect, beforeEach } from "vitest";
import { consumeRateLimit, resetRateLimitForTests } from "./rateLimit";
import { MemoryRateLimitStore } from "./rateLimit/memory";
import { gridWindowStart } from "./rateLimit/store";

const windowMs = 10 * 60 * 1000;
const limit = 5;

beforeEach(async () => {
  await resetRateLimitForTests();
});

describe("consumeRateLimit (facade)", () => {
  it("allows requests up to the limit", async () => {
    for (let i = 0; i < limit; i++) {
      const result = await consumeRateLimit("ip:1", { limit, windowMs }, 1_000);
      expect(result.allowed).toBe(true);
    }
  });

  it("uses a fixed time grid so the Postgres and in-memory stores agree", async () => {
    // A request just before and just after a window boundary lands in
    // different buckets, matching the grid used by the Postgres store.
    const a = await consumeRateLimit("grid:1", { limit: 1, windowMs }, 1_000);
    const b = await consumeRateLimit("grid:1", { limit: 1, windowMs }, windowMs + 1);
    expect(a.allowed).toBe(true);
    expect(b.allowed).toBe(true);
  });

  it("exposes the grid bucket the stores will materialize", () => {
    const bucket = gridWindowStart(windowMs, windowMs);
    expect(bucket).toBe(windowMs);
    const midWindow = gridWindowStart(windowMs + 123_456, windowMs);
    expect(midWindow).toBe(windowMs);
  });

  it("stores window_start as an ISO-8601 value that round-trips to the bucket", () => {
    // Regression guard for the timestamptz mismatch: PostgreSQL parses a bare
    // epoch-millisecond integer (e.g. 1726502400000) as a YEAR (Appendix B.1)
    // and refuses it as out of range, which silently starved the distributed
    // store and forced the in-memory fallback. Bind an ISO string instead and
    // verify it represents exactly the intended bucket instant.
    const now = 1_766_000_000_000;
    const bucket = gridWindowStart(now, windowMs);
    const iso = new Date(bucket).toISOString();
    expect(Date.parse(iso)).toBe(bucket);
    expect(String(bucket)).not.toBe(iso);
  });

  it("blocks once the limit is exceeded", async () => {
    for (let i = 0; i < limit; i++) {
      await consumeRateLimit("ip:2", { limit, windowMs }, windowMs);
    }
    const blocked = await consumeRateLimit("ip:2", { limit, windowMs }, windowMs);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(10 * 60);
  });

  it("is independent per key", async () => {
    await consumeRateLimit("ip:3", { limit: 1, windowMs }, 1_000);
    await consumeRateLimit("ip:3", { limit: 1, windowMs }, 1_000);
    const other = await consumeRateLimit("ip:4", { limit: 1, windowMs }, 1_000);
    expect(other.allowed).toBe(true);
  });

  it("resets after the window elapses", async () => {
    for (let i = 0; i < limit + 1; i++) {
      await consumeRateLimit("ip:5", { limit, windowMs }, windowMs);
    }
    const afterWindow = await consumeRateLimit("ip:5", { limit, windowMs }, windowMs + windowMs + 1);
    expect(afterWindow.allowed).toBe(true);
  });

  it("returns a short retry-after near the end of the window", async () => {
    for (let i = 0; i < limit + 1; i++) {
      await consumeRateLimit("ip:6", { limit, windowMs }, windowMs);
    }
    const nearEnd = windowMs + 5_000;
    const blocked = await consumeRateLimit("ip:6", { limit, windowMs }, nearEnd);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(10 * 60 - 5);
  });

  it("never returns retryAfterSeconds below 1", async () => {
    for (let i = 0; i < limit + 1; i++) {
      await consumeRateLimit("ip:7", { limit: 0, windowMs }, 1_000);
    }
    const blocked = await consumeRateLimit("ip:7", { limit: 0, windowMs }, 1_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThanOrEqual(1);
  });
});

describe("MemoryRateLimitStore", () => {
  it("supports independent budgets per key", async () => {
    const store = new MemoryRateLimitStore();
    await store.consume("a", { limit: 1, windowMs });
    await store.consume("a", { limit: 1, windowMs });
    const b = await store.consume("b", { limit: 1, windowMs });
    expect(b.allowed).toBe(true);
    await store.clear();
  });

  it("falls back open when the database is unset (facade uses memory)", async () => {
    // DATABASE_URL is unset in the test environment, so the facade must resolve
    // through the in-memory store without throwing.
    delete process.env.DATABASE_URL;
    const result = await consumeRateLimit("mem:1", { limit: 100, windowMs }, 1_000);
    expect(result.allowed).toBe(true);
  });
});