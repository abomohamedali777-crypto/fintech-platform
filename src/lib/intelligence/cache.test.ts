import { describe, it, expect, vi, afterEach } from "vitest";
import { LruQueryCache } from "./cache";
import type { IntelResponse } from "./types";

function response(question: string): IntelResponse {
  return {
    question,
    answer: {
      summary: "summary",
      considerations: [],
      jurisdiction: "uae",
      domain: "regulatory",
      sufficiency: "sufficient",
      caveats: [],
    },
    citations: [],
    meta: {
      requestId: "test",
      jurisdiction: "uae",
      domain: "regulatory",
      retrievalCount: 1,
      corpusCount: 1,
      providerKind: "none",
      providerStatus: "disabled",
      simulated: false,
      cached: false,
      latencyMs: 1,
    },
  };
}

afterEach(() => vi.useRealTimers());

describe("LruQueryCache", () => {
  it("stores and retrieves within TTL", () => {
    vi.useFakeTimers();
    const cache = new LruQueryCache(8, 5000);
    cache.set("a", response("a"));
    expect(cache.get("a")?.question).toBe("a");
    expect(cache.size).toBe(1);
  });

  it("evicts entries after TTL", () => {
    vi.useFakeTimers();
    const cache = new LruQueryCache(8, 100);
    cache.set("a", response("a"));
    vi.advanceTimersByTime(101);
    expect(cache.get("a")).toBeUndefined();
  });

  it("evicts the least-recently-used entry past max", () => {
    const cache = new LruQueryCache(2, 60_000);
    cache.set("a", response("a"));
    cache.set("b", response("b"));
    cache.get("a"); // refresh LRU
    cache.set("c", response("c"));
    expect(cache.get("a")).not.toBeUndefined();
    expect(cache.get("b")).toBeUndefined();
    expect(cache.size).toBe(2);
  });

  it("is a no-op when max is 0", () => {
    const cache = new LruQueryCache(0, 1000);
    cache.set("a", response("a"));
    expect(cache.size).toBe(0);
    expect(cache.get("a")).toBeUndefined();
  });

  it("clear empties the cache", () => {
    const cache = new LruQueryCache(4, 1000);
    cache.set("a", response("a"));
    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.get("a")).toBeUndefined();
  });
});