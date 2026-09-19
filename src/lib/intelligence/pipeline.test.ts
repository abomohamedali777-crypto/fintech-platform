import { describe, it, expect, beforeEach } from "vitest";
import { handleIntelRequest, type IntelDeps } from "./pipeline";
import { intelConfig, type IntelConfig } from "./config";
import { IntelCorpus } from "./sources/corpus";
import { LruQueryCache } from "./cache";
import { resetRateLimitForTests } from "@/lib/rateLimit";
import { documentId } from "./ids";
import type { LLMProvider } from "./generation/provider";

const VASP_TITLE = "Virtual Asset Service Provider Licensing Law";
const VASP_PUB = "Test Authority";
const NOW = 1_700_000_000_000;

function cfg(overrides: Partial<IntelConfig> = {}): IntelConfig {
  return {
    ...intelConfig({
      NODE_ENV: "test",
      INTEL_ALLOWED_ORIGINS: "https://mizan.pay,http://localhost:3000",
      INTEL_AI_PROVIDER: "none",
      ACCESS_IP_SALT: "test-salt",
    } as NodeJS.ProcessEnv),
    ...overrides,
  };
}

function seededCorpus(): IntelCorpus {
  const c = new IntelCorpus();
  c.ingest(
    {
      title: VASP_TITLE,
      publisher: VASP_PUB,
      jurisdiction: "uae",
      documentType: "legislation",
      publicationDate: "2022",
      sourceUrl: "https://example.test/vasp",
      content:
        "Persons carrying on virtual asset activities in the UAE must obtain a licence from the competent authority and comply with anti-money-laundering obligations. Stored value facilities are regulated under a separate central bank regime and require authorisation.",
    },
    NOW,
  );
  c.ingest(
    {
      title: "Camel Agriculture Ordinance",
      publisher: "Ministry",
      jurisdiction: "uae",
      documentType: "guidance",
      publicationDate: "2015",
      sourceUrl: "https://example.test/camel",
      content:
        "Camel breeding, agriculture and related activities do not require a financial services authorisation and are outside the scope of this regulation.",
    },
    NOW,
  );
  return c;
}

function deps(overrides: Partial<IntelDeps> = {}): IntelDeps {
  return {
    corpus: seededCorpus(),
    config: cfg(),
    provider: {
      kind: "none" as const,
      call: async () => {
        throw new Error("provider should not be called");
      },
    } satisfies LLMProvider,
    log: () => {},
    ...overrides,
  };
}

function post(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/intelligence", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://mizan.pay",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(async () => {
  await resetRateLimitForTests();
});

describe("handleIntelRequest — transport & security", () => {
  it("rejects non-POST with 405", async () => {
    const res = await handleIntelRequest(
      new Request("http://localhost/api/intelligence", { method: "GET" }),
      deps(),
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.status).toBe(405);
  });

  it("rejects non-JSON content type with 415", async () => {
    const res = await handleIntelRequest(
      post({ question: "What licence is needed?" }, { "Content-Type": "text/plain" }),
      deps(),
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.status).toBe(415);
  });

  it("rejects a request from a disallowed origin with 403", async () => {
    const res = await handleIntelRequest(post({ question: "What licence is needed?" }, { Origin: "https://evil.test" }), deps());
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.status).toBe(403);
  });

  it("authorizes with the configured bearer token", async () => {
    const authorized = deps({ config: cfg({ token: "s3cret" }) });
    const denied = await handleIntelRequest(
      post({ question: "What licence is needed?" }, { Authorization: "Bearer wrong" }),
      authorized,
    );
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.status).toBe(401);

    const allowed = await handleIntelRequest(
      post({ question: "What licence is needed?" }, { Authorization: "Bearer s3cret" }),
      authorized,
    );
    expect(allowed.ok).toBe(true);
  });

  it("rejects a malformed Content-Length header with 400", async () => {
    const res = await handleIntelRequest(
      post({ question: "What licence is needed?" }, { "Content-Length": "abc" }),
      deps(),
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.status).toBe(400);
  });

  it("rejects an oversized payload with 413 before buffering", async () => {
    const res = await handleIntelRequest(
      post({ question: "x".repeat(500) }),
      deps({ config: cfg({ maxBodyBytes: 64 }) }),
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.status).toBe(413);
  });

  it("rejects invalid JSON with 400", async () => {
    const res = await handleIntelRequest(post("{ invalid json", { "Content-Length": "13" }), deps());
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.status).toBe(400);
  });

  it("rejects invalid bodies with 422 and a useful detail", async () => {
    const shortQ = await handleIntelRequest(post({ question: "short" }), deps());
    expect(shortQ.ok).toBe(false);
    if (!shortQ.ok) expect(shortQ.status).toBe(422);

    const extraKeys = await handleIntelRequest(post({ question: "A well formed question here.", admin: true }), deps());
    expect(extraKeys.ok).toBe(false);
    if (!extraKeys.ok) expect(extraKeys.status).toBe(422);
  });

  it("rate limits a bucket after the limit is reached with 429", async () => {
    const env = deps({ config: cfg({ ipLimit: 1, ipWindowMs: 600_000 }) });
    const first = await handleIntelRequest(post({ question: "What licence is needed?" }), env);
    expect(first.ok).toBe(true);
    const second = await handleIntelRequest(post({ question: "What licence is needed?" }), env);
    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.status).toBe(429);
      expect(second.json.retryAfterSeconds).toBeGreaterThan(0);
    }
  });
});

describe("handleIntelRequest — retrieval & synthesis", () => {
  it("answers a grounded question from the corpus", async () => {
    const res = await handleIntelRequest(
      post({ question: "Do virtual asset providers need a licence in the UAE?" }),
      deps(),
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.status).toBe(200);
    expect(res.json.meta.retrievalCount).toBeGreaterThanOrEqual(1);
    expect(res.json.meta.providerKind).toBe("none");
    expect(res.json.meta.cached).toBe(false);
    expect(res.json.answer.caveats.length).toBeGreaterThan(0);
    expect(res.json.citations.some((c) => c.title === VASP_TITLE)).toBe(true);
  });

  it("returns an honest insufficient answer when no source matches", async () => {
    const res = await handleIntelRequest(
      post({ question: "What fiduciary duties apply to pension fund trustees?" }),
      deps(),
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.json.answer.sufficiency).toBe("insufficient");
    expect(res.json.answer.summary.toLowerCase()).toContain("no primary source");
    expect(res.json.citations).toEqual([]);
  });

  it("applies the legal domain filter (legislation only)", async () => {
    const res = await handleIntelRequest(
      post({ question: "Which activities are licensable?", domain: "legal" }),
      deps(),
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    for (const c of res.json.citations) expect(c.documentType).toBe("legislation");
  });
});

describe("handleIntelRequest — provider integration & guard", () => {
  const vaspId = documentId({
    jurisdiction: "uae",
    publisher: VASP_PUB,
    title: VASP_TITLE,
    publicationDate: "2022",
  });

  function providerDeps(raw: string | (() => never)): IntelDeps {
    return deps({
      config: cfg({
        providerKind: "openai-compatible",
        aiApiKey: "test-key",
        aiModel: "test-model",
      }),
      provider: {
        kind: "openai-compatible" as const,
        call: async () => (typeof raw === "function" ? raw() : raw),
      },
    });
  }

  it("uses a valid provider response with resolved citations", async () => {
    const res = await handleIntelRequest(
      post({ question: "Do virtual asset providers need a licence?" }),
      providerDeps(
        JSON.stringify({
          summary: "A licence is required for virtual asset service providers in the UAE.",
          considerations: [
            { text: "The licensing authority supervises the activity.", ids: [vaspId] },
          ],
        }),
      ),
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.json.meta.providerStatus).toBe("ok");
    expect(res.json.answer.summary).toContain("licence");
    expect(res.json.answer.considerations[0].refs).toEqual(["[1]"]);
  });

  it("falls back to local synthesis when the provider returns malformed output", async () => {
    const res = await handleIntelRequest(
      post({ question: "Do virtual asset providers need a licence?" }),
      providerDeps("{ definitely not json"),
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.json.meta.providerStatus).toBe("failed");
    expect(res.json.answer.caveats.length).toBeGreaterThan(0);
  });

  it("falls back to local synthesis when the provider throws", async () => {
    const res = await handleIntelRequest(
      post({ question: "Do virtual asset providers need a licence?" }),
      providerDeps(() => {
        throw new Error("downstream 500");
      }),
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.json.meta.providerStatus).toBe("failed");
    expect(res.json.answer.considerations.length).toBeGreaterThan(0);
  });
});

describe("handleIntelRequest — caching", () => {
  it("serves an identical repeated question from cache", async () => {
    const cache = new LruQueryCache(8, 60_000);
    const env = deps({ cache });
    const req = post({ question: "Do virtual asset providers need a licence?" });

    const first = await handleIntelRequest(req.clone(), env);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.json.meta.cached).toBe(false);
    expect(cache.size).toBe(1);

    const second = await handleIntelRequest(req.clone(), env);
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.json.meta.cached).toBe(true);
  });
});