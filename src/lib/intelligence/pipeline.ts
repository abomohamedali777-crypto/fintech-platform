import { authorizeBearer } from "./auth";
import type { QueryCache } from "./cache";
import { intelLog, type LogFn } from "./logging";
import { parseContentLength, NO_STORE } from "@/lib/accessPipeline";
import { readStreamBodyCapped } from "@/lib/readBody";
import { consumeRateLimit } from "@/lib/rateLimit";
import { hashWithSalt, normalizeClientIp } from "@/lib/ip";
import { parseIntelBody } from "./schema";
import { queryKey } from "./ids";
import { retrieve } from "./retrieval/retrieve";
import { buildCitations } from "./citations/citations";
import { synthesizeLocal, inferSufficiency } from "./generation/synthesis";
import { buildUserPrompt, LEGAL_DISCLAIMER } from "./generation/prompts";
import { normalizeProviderOutputWithPayload } from "./generation/guard";
import type { LLMProvider } from "./generation/provider";
import { evidenceGroundingLabel } from "./generation/evidence";
import type { IntelConfig } from "./config";
import type { IntelCorpus } from "./sources/corpus";
import type {
  IntelAnswer,
  IntelMeta,
  IntelResponse,
  ProviderStatus,
} from "./types";

export interface IntelDeps {
  corpus: IntelCorpus;
  config: IntelConfig;
  log?: LogFn;
  now?: number;
  cache?: QueryCache;
  provider?: LLMProvider;
}

export type MethodType = "POST" | "GET" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

export interface IntelSuccess {
  ok: true;
  status: 200;
  json: IntelResponse;
  headers: Record<string, string>;
}

export type IntelErrorCode =
  | "method"
  | "content_type"
  | "unauthorized"
  | "forbidden_origin"
  | "bad_length"
  | "to_large_body"
  | "rate_limit"
  | "invalid_json"
  | "invalid_body"
  | "internal";

export interface IntelFailure {
  ok: false;
  status: number;
  error: IntelErrorCode;
  json: { error: string; detail?: string; retryAfterSeconds?: number };
  headers: Record<string, string>;
}

export type IntelOutcome = IntelSuccess | IntelFailure;

function fail(
  status: number,
  error: IntelErrorCode,
  json: IntelFailure["json"],
): IntelFailure {
  return { ok: false, status, error, json, headers: NO_STORE };
}

export function isMethodSafeForIntel(method: string): boolean {
  return method === "POST";
}

function resolveJurisdiction(value: string): string {
  return value === "auto" ? "uae" : value;
}

function resolveDomain(value: string): string {
  return value === "auto" ? "regulatory" : value;
}

function domainDocumentTypeFilter(domain: string): string | undefined {
  return domain === "legal" ? "legislation" : undefined;
}

function buildMeta(input: {
  requestId: string;
  jurisdiction: string;
  domain: string;
  retrievalCount: number;
  corpusCount: number;
  providerKind: string;
  providerStatus: ProviderStatus;
  simulated: boolean;
  cached: boolean;
  latencyMs: number;
}): IntelMeta {
  return { ...input, providerKind: input.providerKind as IntelMeta["providerKind"] };
}

function latencySince(started: number): number {
  return Math.max(0, Math.round(performance.now() - started));
}

/**
 * Request→answer orchestrator for POST /api/intelligence. Mirrors the access
 * module's objective structure: method → content-type → auth → origin →
 * length → rate-limit → capped body read → parse → cache → retrieve →
 * generate → cite. Every early exit maps to a typed status code, and nothing
 * PII (question, IP) ever reaches the logs — the requestId is the only trace
 * token emitted.
 */
export async function handleIntelRequest(
  req: Request,
  deps: IntelDeps,
): Promise<IntelOutcome> {
  const config = deps.config;
  const log = deps.log ?? intelLog;
  const now = deps.now ?? Date.now();
  const started = performance.now();
  const url = new URL(req.url);
  const requestId = url.searchParams.get("requestId") ?? crypto.randomUUID();

  if (!isMethodSafeForIntel(req.method)) {
    log("info", "rejected", { requestId, code: "method" });
    return fail(405, "method", { error: "Method not allowed. Use POST." });
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    log("info", "rejected", { requestId, code: "content_type" });
    return fail(415, "content_type", { error: "Content-Type must be application/json." });
  }

  if (!authorizeBearer(req.headers.get("authorization"), config.token)) {
    log("info", "rejected", { requestId, code: "unauthorized" });
    return fail(401, "unauthorized", { error: "Unauthorized." });
  }

const origin = req.headers.get("origin");
  if (origin && !config.allowedOrigins.includes(origin)) {
    log("info", "rejected", { requestId, code: "forbidden_origin" });
    return fail(403, "forbidden_origin", { error: "Forbidden: origin not allowed." });
  }

  const declaredLength = parseContentLength(req.headers.get("content-length"));
  if (declaredLength.present && !declaredLength.ok) {
    log("info", "rejected", { requestId, code: "bad_length" });
    return fail(400, "bad_length", {
      error: "Content-Length header must be a non-negative integer.",
    });
  }
  if (declaredLength.present && declaredLength.bytes > config.maxBodyBytes) {
    log("info", "rejected", { requestId, code: "body_too_large" });
    return fail(413, "to_large_body", { error: "Payload too large." });
  }

  const ipHeaders = {
    "x-forwarded-for": req.headers.get("x-forwarded-for"),
    "x-real-ip": req.headers.get("x-real-ip"),
  };
  const clientIp = normalizeClientIp(ipHeaders);
  const ipKey = config.ipSalt ? hashWithSalt(clientIp, config.ipSalt) : clientIp;
  const rate = await consumeRateLimit(
    `intel:ip:${ipKey}`,
    { limit: config.ipLimit, windowMs: config.ipWindowMs },
    now,
  );
  if (!rate.allowed) {
    log("info", "rejected", { requestId, code: "rate_limit" });
    return fail(429, "rate_limit", {
      error: "Rate limit exceeded.",
      retryAfterSeconds: rate.retryAfterSeconds,
    });
  }

  const { rawBody, oversized } = await readStreamBodyCapped(req.body, config.maxBodyBytes);
  if (oversized) {
    log("info", "rejected", { requestId, code: "body_too_large" });
    return fail(413, "to_large_body", { error: "Payload too large." });
  }

  let payload: unknown;
  try {
    payload = rawBody && rawBody.trim() !== "" ? JSON.parse(rawBody) : null;
  } catch {
    log("info", "rejected", { requestId, code: "invalid_json" });
    return fail(400, "invalid_json", { error: "Invalid JSON body." });
  }

  const parsed = parseIntelBody(payload, config.maxQueryChars);
  if (!parsed.ok) {
    const detail =
      parsed.reason === "too_short"
        ? "Question must be at least 8 characters."
        : parsed.reason === "too_long"
          ? `Question exceeds the ${config.maxQueryChars}-character limit.`
          : parsed.reason === "control_chars"
            ? "Question contains disallowed control characters."
            : "Body must be { question, jurisdiction?, domain? } and nothing else.";
    log("info", "rejected", { requestId, code: "invalid_body" });
    return fail(422, "invalid_body", { error: "Invalid request body.", detail });
  }

  const jurisdiction = resolveJurisdiction(parsed.data.jurisdiction);
  const domain = resolveDomain(parsed.data.domain);
  const question = parsed.data.question;

  const cacheKey = queryKey(question, jurisdiction, domain);
  const cached = deps.cache?.get(cacheKey);
  if (cached) {
    const meta: IntelMeta = {
      requestId,
      jurisdiction: cached.meta.jurisdiction,
      domain: cached.meta.domain,
      retrievalCount: cached.meta.retrievalCount,
      corpusCount: cached.meta.corpusCount,
      providerKind: cached.meta.providerKind,
      providerStatus: cached.meta.providerStatus,
      simulated: cached.meta.simulated,
      cached: true,
      latencyMs: latencySince(started),
    };
    log("info", "answered", { requestId, code: "cache_hit" });
    return {
      ok: true,
      status: 200,
      json: { ...cached, meta },
      headers: NO_STORE,
    };
  }

  try {
    const passages = retrieve(
      deps.corpus,
      question,
      {
        jurisdiction,
        documentType: domainDocumentTypeFilter(domain),
      },
      { topK: config.topK, contextMaxChars: config.contextMaxChars },
      now,
    );

    const citationIndex = buildCitations(passages.map((p) => p.document));

    let providerStatus: ProviderStatus = "disabled";
    let answer: IntelAnswer | null = null;

    if (config.providerKind === "openai-compatible" && config.aiApiKey) {
      try {
        const { system, user } = buildUserPrompt(question, passages, config.contextMaxChars);
        const raw = await deps.provider!.call({
          system,
          user,
          maxTokens: config.aiMaxTokens,
        });
        const normalized = normalizeProviderOutputWithPayload(raw, passages.map((p) => p.document));
        if (normalized) {
          const caveats = [LEGAL_DISCLAIMER];
          if (normalized.absoluteClaim) {
            caveats.push(
              `Model language flagged — verify independently: "${normalized.absoluteClaim}".`,
            );
          }
          answer = {
            summary: normalized.summary,
            considerations: normalized.considerations.map((c) => ({
              text: c.text,
              refs: citationIndex.refsForMany(c.refs),
            })),
            jurisdiction,
            domain,
            sufficiency: inferSufficiency(passages.length),
            caveats,
          };
          providerStatus = "ok";
        } else {
          log("warn", "provider_output_rejected", { requestId });
          providerStatus = "failed";
        }
      } catch (err) {
        log("warn", "provider_call_failed", {
          requestId,
          error: err instanceof Error ? err.name : String(err),
        });
        providerStatus = "failed";
      }
    }

    if (!answer) {
      answer = synthesizeLocal(passages, question, domain, jurisdiction);
    }

    const meta: IntelMeta = buildMeta({
      requestId,
      jurisdiction,
      domain,
      retrievalCount: passages.length,
      corpusCount: deps.corpus.size(),
      providerKind: config.providerKind,
      providerStatus,
      simulated: false,
      cached: false,
      latencyMs: latencySince(started),
    });

    const response: IntelResponse = {
      question,
      answer,
      citations: citationIndex.citations,
      meta: {
        ...meta,
        simulated: answer.caveats.length > 0,
      },
    };

    void evidenceGroundingLabel(passages, answer);

    deps.cache?.set(cacheKey, response);
    log("info", "answered", {
      requestId,
      code: "ok",
      retrievalCount: passages.length,
      providerStatus,
    });

    return { ok: true, status: 200, json: response, headers: NO_STORE };
  } catch (err) {
    log("error", "pipeline_failed", {
      requestId,
      errorCategory: "internal",
      error: err instanceof Error ? err.message : String(err),
    });
    return fail(500, "internal", { error: "Internal error while answering." });
  }
}