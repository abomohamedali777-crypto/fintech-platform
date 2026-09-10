import { describe, it, expect, beforeEach } from "vitest";
import { consumeRateLimit } from "./rateLimit";

const windowMs = 10 * 60 * 1000;
const limit = 5;

beforeEach(() => {
  consumeRateLimit("__reset__", { limit: Number.MAX_SAFE_INTEGER, windowMs, now: Date.now() });
});

describe("consumeRateLimit", () => {
  it("allows requests up to the limit", () => {
    for (let i = 0; i < limit; i++) {
      const result = consumeRateLimit("ip:1", { limit, windowMs, now: 1_000 });
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks once the limit is exceeded", () => {
    for (let i = 0; i < limit; i++) {
      consumeRateLimit("ip:2", { limit, windowMs, now: 1_000 });
    }
    const blocked = consumeRateLimit("ip:2", { limit, windowMs, now: 1_000 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(10 * 60);
  });

  it("is independent per key", () => {
    consumeRateLimit("ip:3", { limit: 1, windowMs, now: 1_000 });
    consumeRateLimit("ip:3", { limit: 1, windowMs, now: 1_000 });
    const other = consumeRateLimit("ip:4", { limit: 1, windowMs, now: 1_000 });
    expect(other.allowed).toBe(true);
  });

  it("resets after the window elapses", () => {
    for (let i = 0; i < limit + 1; i++) {
      consumeRateLimit("ip:5", { limit, windowMs, now: 1_000 });
    }
    const afterWindow = consumeRateLimit("ip:5", { limit, windowMs, now: 1_000 + windowMs + 1 });
    expect(afterWindow.allowed).toBe(true);
  });

  it("returns a short retry-after near the end of the window", () => {
    for (let i = 0; i < limit + 1; i++) {
      consumeRateLimit("ip:6", { limit, windowMs, now: 1_000 });
    }
    const blocked = consumeRateLimit("ip:6", { limit, windowMs, now: 1_000 + 5_000 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(10 * 60 - 5);
  });

  it("never returns retryAfterSeconds below 1", () => {
    for (let i = 0; i < limit + 1; i++) {
      consumeRateLimit("ip:7", { limit: 0, windowMs, now: 1_000 });
    }
    const blocked = consumeRateLimit("ip:7", { limit: 0, windowMs, now: 1_000 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThanOrEqual(1);
  });
});