import { describe, it, expect } from "vitest";
import { handleAccessRequest, type AccessDeps, type AccessRequestInput } from "./accessPipeline";
import { accessConfig } from "./accessConfig";
import { hashWithSalt } from "./ip";
import type { RateLimitResult } from "./rateLimit/store";

const WINDOW = 10 * 60 * 1000;

function makeConfig(overrides: Partial<ReturnType<typeof accessConfig>> = {}) {
  return {
    ...accessConfig({
      ALLOWED_ORIGINS: "https://mizan.pay,http://localhost:3000",
      NODE_ENV: "test",
    } as NodeJS.ProcessEnv),
    ...overrides,
  };
}

function baseInput(overrides: Partial<AccessRequestInput> = {}): AccessRequestInput {
  return {
    method: "POST",
    origin: "https://mizan.pay",
    referer: null,
    contentType: "application/json",
    contentLength: null,
    ipHeaders: { "x-forwarded-for": "203.0.113.10" },
    userAgent: "test-agent",
    rawBody: JSON.stringify({ email: "treasurer@acme.com" }),
    now: 1_000_000,
    ...overrides,
  };
}

function makeDeps(overrides: Partial<AccessDeps> = {}): {
  deps: AccessDeps;
  calls: { persisted: number; notified: number; logged: string[] };
} {
  const calls = { persisted: 0, notified: 0, logged: [] as string[] };
  const deps: AccessDeps = {
    config: makeConfig(),
    rateLimiter: async (): Promise<RateLimitResult> => ({ allowed: true, retryAfterSeconds: 0 }),
    isDbConfigured: () => true,
    persist: async () => {
      calls.persisted += 1;
      return { persisted: true, id: "req-123" };
    },
    notify: async () => {
      calls.notified += 1;
      return { sent: true };
    },
    log: (_lvl, event) => {
      calls.logged.push(event);
    },
    ...overrides,
  };
  return { deps, calls };
}

describe("handleAccessRequest — transport & security", () => {
  it("rejects non-POST methods with 405", async () => {
    const { deps } = makeDeps();
    const res = await handleAccessRequest(baseInput({ method: "GET" }), deps);
    expect(res.status).toBe(405);
  });

  it("rejects unsupported content types with 415", async () => {
    const { deps } = makeDeps();
    const res = await handleAccessRequest(baseInput({ contentType: "text/plain" }), deps);
    expect(res.status).toBe(415);
  });

  it("accepts charset-suffixed JSON content type", async () => {
    const { deps } = makeDeps();
    const res = await handleAccessRequest(
      baseInput({ contentType: "application/json; charset=utf-8" }),
      deps,
    );
    expect(res.status).toBe(200);
  });

  it("rejects an oversized body via content-length with 413", async () => {
    const { deps } = makeDeps();
    const res = await handleAccessRequest(
      baseInput({ contentLength: String(99 * 1024), rawBody: "{}" }),
      deps,
    );
    expect(res.status).toBe(413);
  });

  it("rejects an oversized raw body with 413", async () => {
    const { deps } = makeDeps();
    const res = await handleAccessRequest(
      baseInput({ rawBody: JSON.stringify({ email: `${"x".repeat(30_000)}@example.com` }) }),
      deps,
    );
    expect(res.status).toBe(413);
  });

  it("rejects a cross-origin request using a disallowed origin", async () => {
    const { deps } = makeDeps();
    const res = await handleAccessRequest(baseInput({ origin: "https://evil.example" }), deps);
    expect(res.status).toBe(403);
  });

  it("rejects a cross-origin request using a disallowed referer", async () => {
    const { deps } = makeDeps();
    const res = await handleAccessRequest(
      baseInput({ origin: null, referer: "https://evil.example/some" }),
      deps,
    );
    expect(res.status).toBe(403);
  });

  it("rejects a malformed origin", async () => {
    const { deps } = makeDeps();
    const res = await handleAccessRequest(baseInput({ origin: "%%%not-a-url%%%" }), deps);
    expect(res.status).toBe(403);
  });

  it("allows requests without an origin header (non-browser client)", async () => {
    const { deps, calls } = makeDeps();
    const res = await handleAccessRequest(
      baseInput({ origin: null, referer: null }),
      deps,
    );
    expect(res.status).toBe(200);
    expect(calls.persisted).toBe(1);
  });

  it("does not set Access-Control-Allow headers on responses (same-origin API)", async () => {
    const { deps } = makeDeps();
    const res = await handleAccessRequest(baseInput(), deps);
    expect(res.headers["Access-Control-Allow-Origin"]).toBeUndefined();
  });
});

describe("handleAccessRequest — body size gates", () => {
  it("rejects a malformed Content-Length header with 400", async () => {
    const { deps, calls } = makeDeps();
    const res = await handleAccessRequest(baseInput({ contentLength: "abc" }), deps);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("invalid_content_length");
    expect(calls.persisted).toBe(0);
  });

  it.each([["-1"], ["12.5"], ["+5"], ["1,000"]])(
    "rejects a non-integer Content-Length of %j with 400",
    async (value) => {
      const { deps } = makeDeps();
      const res = await handleAccessRequest(baseInput({ contentLength: value }), deps);
      expect(res.status).toBe(400);
    },
  );

  it("trims whitespace around Content-Length (OWS is valid)", async () => {
    const { deps, calls } = makeDeps();
    const res = await handleAccessRequest(
      baseInput({ contentLength: `  ${String(64)}  `, rawBody: JSON.stringify({ email: "a@b.io" }) }),
      deps,
    );
    expect(res.status).toBe(200);
    expect(calls.persisted).toBe(1);
  });

  it("allows a zero Content-Length through the size gates", async () => {
    const { deps, calls } = makeDeps();
    const res = await handleAccessRequest(baseInput({ contentLength: "0" }), deps);
    expect(res.status).toBe(200);
    expect(calls.persisted).toBe(1);
  });

  it("measures the decoded body in BYTES, not characters", async () => {
    const { deps, calls } = makeDeps();
    const multibyte = "€".repeat(9000); // 27 KiB as UTF-8, well under 16k chars
    const res = await handleAccessRequest(baseInput({ rawBody: multibyte, contentLength: null }), deps);
    expect(res.status).toBe(413);
    expect(calls.persisted).toBe(0);
  });

  it("accepts a body exactly at the 16 KiB limit (no off-by-one)", async () => {
    const { deps } = makeDeps();
    const res = await handleAccessRequest(
      baseInput({ rawBody: "x".repeat(16 * 1024), contentLength: null }),
      deps,
    );
    expect(res.status).toBe(400); // parses as invalid JSON — the size gate must not reject it
  });
});

describe("handleAccessRequest — rate limiting", () => {
  it("returns 429 with Retry-After when the IP budget is exhausted", async () => {
    const { deps } = makeDeps({
      rateLimiter: async (_k, _o, now) =>
        now && now === 1_000_000
          ? { allowed: false, retryAfterSeconds: 120 }
          : { allowed: true, retryAfterSeconds: 0 },
      config: makeConfig({ ipLimit: 5, ipWindowMs: WINDOW }),
    });
    const res = await handleAccessRequest(baseInput(), deps);
    expect(res.status).toBe(429);
    expect(res.headers["Retry-After"]).toBe("120");
    expect(res.body.error).toBe("rate_limited");
  });

  it("trusts the proxy-appended (right-most) client IP in X-Forwarded-For", async () => {
    const seen = new Set<string>();
    const { deps } = makeDeps({
      rateLimiter: async (key) => {
        seen.add(key);
        return { allowed: true, retryAfterSeconds: 0 };
      },
    });
    await handleAccessRequest(
      baseInput({ ipHeaders: { "x-forwarded-for": "203.0.113.10, 10.0.0.2" } }),
      deps,
    );
    expect(seen.has(hashWithSalt("ip:10.0.0.2", deps.config.ipSalt))).toBe(true);
    expect(seen.has(hashWithSalt("ip:203.0.113.10", deps.config.ipSalt))).toBe(false);
    expect([...seen].some((k) => k.includes("10.0.0.2"))).toBe(false);
  });

  it("returns 429 when the email budget is exhausted after a fake-first email", async () => {
    const { deps } = makeDeps({
      rateLimiter: async (_k, _o, now) =>
        now && now === 1_000_000
          ? { allowed: false, retryAfterSeconds: 60 }
          : { allowed: true, retryAfterSeconds: 0 },
      config: makeConfig({ emailLimit: 2, emailWindowMs: 60 * 60 * 1000 }),
    });
    const res = await handleAccessRequest(baseInput(), deps);
    expect(res.status).toBe(429);
    expect(res.headers["Retry-After"]).toBe("60");
  });
});

describe("handleAccessRequest — validation & payload handling", () => {
  it("returns 400 for malformed JSON", async () => {
    const { deps, calls } = makeDeps();
    const res = await handleAccessRequest(baseInput({ rawBody: "{not json" }), deps);
    expect(res.status).toBe(400);
    expect(calls.persisted).toBe(0);
  });

  it("returns 422 for an invalid email", async () => {
    const { deps, calls } = makeDeps();
    const res = await handleAccessRequest(
      baseInput({ rawBody: JSON.stringify({ email: "nope" }) }),
      deps,
    );
    expect(res.status).toBe(422);
    expect(calls.persisted).toBe(0);
  });

  it("returns 422 for unknown fields", async () => {
    const { deps, calls } = makeDeps();
    const res = await handleAccessRequest(
      baseInput({ rawBody: JSON.stringify({ email: "a@b.io", extra: true }) }),
      deps,
    );
    expect(res.status).toBe(422);
    expect(calls.persisted).toBe(0);
  });
});

describe("handleAccessRequest — honeypot", () => {
  it("returns a fake success and does NOT persist honeypotted submissions", async () => {
    const { deps, calls } = makeDeps();
    const res = await handleAccessRequest(
      baseInput({
        rawBody: JSON.stringify({ email: "bot@example.com", fax: "autofill-junk", company: "hmm" }),
      }),
      deps,
    );
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(calls.persisted).toBe(0);
    expect(calls.notified).toBe(0);
    expect(calls.logged).toContain("honeypot_caught");
  });

  it("does not apply email rate limiting to honeypot submissions", async () => {
    const seenKeys: string[] = [];
    const { deps } = makeDeps({
      rateLimiter: async (key) => {
        seenKeys.push(key);
        return { allowed: true, retryAfterSeconds: 0 };
      },
    });
    await handleAccessRequest(
      baseInput({ rawBody: JSON.stringify({ email: "bot@example.com", fax: "x" }) }),
      deps,
    );
    expect(seenKeys.some((k) => k === hashWithSalt("email:bot@example.com", deps.config.ipSalt))).toBe(false);
    expect(seenKeys.some((k) => k.startsWith("email:"))).toBe(false);
  });
});

describe("handleAccessRequest — persistence & notification", () => {
  it("returns 503 with an honest message when persistence is not configured", async () => {
    const { deps } = makeDeps({ isDbConfigured: () => false });
    const res = await handleAccessRequest(baseInput(), deps);
    expect(res.status).toBe(503);
    expect(res.body.message).toContain("not configured");
  });

  it("returns 500 without leaking details when persistence fails", async () => {
    const { deps } = makeDeps({
      persist: async () => ({ persisted: false as const, reason: "database_error" }),
    });
    const res = await handleAccessRequest(baseInput(), deps);
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("storage_failed");
    expect(JSON.stringify(res.body)).not.toMatch(/DATABASE_URL|stack|postgres/i);
  });

  it("returns 200 and persists a valid request", async () => {
    const { deps, calls } = makeDeps();
    const res = await handleAccessRequest(baseInput(), deps);
    expect(res.status).toBe(200);
    expect(calls.persisted).toBe(1);
    expect(calls.notified).toBe(1);
    expect(res.body.requestId).toBe("req-123");
  });

  it("still returns 200 when email notification fails", async () => {
    const { deps, calls } = makeDeps({
      notify: async () => ({ sent: false, reason: "provider_error" }),
    });
    const res = await handleAccessRequest(baseInput(), deps);
    expect(res.status).toBe(200);
    expect(calls.persisted).toBe(1);
  });

  it("still returns 200 even if notify throws", async () => {
    const { deps, calls } = makeDeps({
      notify: async () => {
        throw new Error("provider timeout");
      },
    });
    const res = await handleAccessRequest(baseInput(), deps);
    expect(res.status).toBe(200);
    expect(calls.persisted).toBe(1);
  });
});

describe("handleAccessRequest — operational hygiene", () => {
  it("never sets cacheable response headers", async () => {
    const { deps } = makeDeps();
    const res = await handleAccessRequest(baseInput(), deps);
    expect(res.headers["Cache-Control"]).toBe("no-store");
  });

  it("logs events without raw email or raw IP", async () => {
    const { deps, calls } = makeDeps();
    await handleAccessRequest(baseInput(), deps);
    const joined = calls.logged.join(" ");
    expect(joined).not.toMatch(/treasurer@acme\.com/);
    expect(joined).not.toMatch(/203\.0\.113\.10/);
  });

  it("returns a unique request id on every accepted request", async () => {
    let seq = 0;
    const { deps } = makeDeps({
      persist: async () => {
        seq += 1;
        return { persisted: true, id: `req-${seq}` };
      },
    });
    const a = await handleAccessRequest(baseInput(), deps);
    const b = await handleAccessRequest(baseInput({ now: 2_000_000 }), deps);
    expect(a.requestId).not.toBe(b.requestId);
  });
});