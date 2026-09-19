import { randomUUID } from "node:crypto";
import { MAX_BODY_BYTES, type AccessConfig } from "@/lib/accessConfig";
import { parseAccessBody, type AccessRequestBody } from "@/lib/accessSchema";
import { normalizeClientIp, hashWithSalt } from "@/lib/ip";
import type { RateLimitOptions, RateLimitResult } from "@/lib/rateLimit/store";

export type AccessRequestInput = {
  method: string;
  origin: string | null;
  referer: string | null;
  contentType: string | null;
  contentLength: string | null;
  ipHeaders: { "x-forwarded-for"?: string | null; "x-real-ip"?: string | null };
  userAgent: string | null;
  rawBody: string;
  now?: number;
};

export type AccessDeps = {
  config: AccessConfig;
  rateLimiter: (key: string, options: RateLimitOptions, now?: number) => Promise<RateLimitResult>;
  isDbConfigured: () => boolean;
  persist: (record: {
    email: string;
    emailHash: string;
    ipHash: string;
    userAgent: string | null;
    company: string | null;
    volume: string | null;
    honeypot: boolean;
  }) => Promise<{ persisted: true; id: string } | { persisted: false; reason: string }>;
  notify: (
    record: {
      email: string;
      emailHash: string;
      ipHash: string;
      userAgent: string | null;
      company: string | null;
      volume: string | null;
      honeypot: boolean;
    },
    requestId: string,
  ) => Promise<{ sent: boolean; reason?: string }>;
  log: (level: "info" | "warn" | "error", event: string, meta: Record<string, unknown>) => void;
};

export type AccessOutcome = {
  status: number;
  headers: Record<string, string>;
  body: Record<string, unknown>;
  requestId: string;
};

export const NO_STORE = { "Cache-Control": "no-store" };

export type ContentLengthParse =
  | { present: false }
  | { present: true; ok: true; bytes: number }
  | { present: true; ok: false };

/**
 * Strict Content-Length parsing. A header that is present but not a plain
 * non-negative integer is MALFORMED (rejected upstream as 400); an absent or
 * empty header means "no size claim" (chunked encoding) and is allowed — the
 * decoded body is still bounded by MAX_BODY_BYTES below.
 */
export function parseContentLength(raw: string | null | undefined): ContentLengthParse {
  const trimmed = raw?.trim();
  if (!trimmed) return { present: false };
  if (!/^\d+$/.test(trimmed)) return { present: true, ok: false };
  return { present: true, ok: true, bytes: Number(trimmed) };
}

function allowed(source: string | null, origins: string[]): boolean {
  if (!source) return true; // non-browser clients (curl, servers) — no ambient auth, no CSRF surface.
  try {
    const url = new URL(source);
    return origins.some((o) => url.origin === o);
  } catch {
    return false;
  }
}

function json(
  status: number,
  body: Record<string, unknown>,
  extraHeaders: Record<string, string> = {},
): AccessOutcome {
  return { status, headers: { ...NO_STORE, ...extraHeaders }, body, requestId: "" };
}

/**
 * Pure access-request pipeline. No Next.js imports so it can be unit tested
 * with plain inputs and injected dependencies.
 */
export async function handleAccessRequest(
  input: AccessRequestInput,
  deps: AccessDeps,
): Promise<AccessOutcome> {
  const now = input.now ?? Date.now();
  const requestId = randomUUID();
  const c = deps.config;

  if (input.method !== "POST") {
    return { ...json(405, { error: "method_not_allowed", message: "Method not allowed." }), requestId };
  }

  if (
    input.contentType &&
    !/^application\/json\b/i.test(input.contentType.split(";")[0].trim())
  ) {
    return { ...json(415, { error: "unsupported_media_type", message: "Content-Type must be application/json." }), requestId };
  }

  const length = parseContentLength(input.contentLength);
  if (length.present && !length.ok) {
    deps.log("warn", "invalid_content_length", { requestId });
    return { ...json(400, { error: "invalid_content_length", message: "Content-Length header must be a non-negative integer." }), requestId };
  }
  if (length.present && length.bytes > MAX_BODY_BYTES) {
    return { ...json(413, { error: "payload_too_large", message: "Request body is too large." }), requestId };
  }

  if (Buffer.byteLength(input.rawBody, "utf8") > MAX_BODY_BYTES) {
    return { ...json(413, { error: "payload_too_large", message: "Request body is too large." }), requestId };
  }

  if (!allowed(input.origin ?? input.referer, c.allowedOrigins)) {
    deps.log("warn", "origin_forbidden", { requestId, origin: input.origin ?? input.referer ?? "" });
    return { ...json(403, { error: "forbidden", message: "Origin not allowed." }), requestId };
  }

  const ip = normalizeClientIp(input.ipHeaders);
  const ipRate: RateLimitOptions = { limit: c.ipLimit, windowMs: c.ipWindowMs };
  // Bucket keys are salted hashes, never the raw IP or email — the same
  // PII-reduction contract as the access_requests table.
  const ipCheck = await deps.rateLimiter(hashWithSalt(`ip:${ip}`, c.ipSalt), ipRate, now);
  if (!ipCheck.allowed) {
    deps.log("warn", "rate_limited_ip", { requestId });
    return {
      ...json(
        429,
        { error: "rate_limited", message: `Too many requests from this network. Retry in ${ipCheck.retryAfterSeconds}s.` },
        { "Retry-After": String(ipCheck.retryAfterSeconds) },
      ),
      requestId,
    };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(input.rawBody);
  } catch {
    deps.log("warn", "invalid_json", { requestId });
    return { ...json(400, { error: "invalid_json", message: "Request body must be valid JSON." }), requestId };
  }

  const parsed = parseAccessBody(payload);
  if (!parsed.ok) {
    deps.log("warn", "invalid_fields", { requestId });
    return { ...json(422, { error: "invalid_fields", message: "A valid enterprise email address is required, and fields must be within allowed lengths." }), requestId };
  }

  const data: AccessRequestBody = parsed.data;

  // Honeypot: a hidden field real users never fill. If it is present, this is
  // an automated submission — acknowledge success without persisting it.
  if (data.fax && data.fax.length > 0) {
    deps.log("info", "honeypot_caught", { requestId });
    return { ...json(200, { success: true, requestId }), requestId };
  }

  const emailRate: RateLimitOptions = { limit: c.emailLimit, windowMs: c.emailWindowMs };
  const emailCheck = await deps.rateLimiter(hashWithSalt(`email:${data.email}`, c.ipSalt), emailRate, now);
  if (!emailCheck.allowed) {
    deps.log("warn", "rate_limited_email", { requestId });
    return {
      ...json(
        429,
        { error: "rate_limited", message: "Too many requests. Retry later." },
        { "Retry-After": String(emailCheck.retryAfterSeconds) },
      ),
      requestId,
    };
  }

  const ipHash = hashWithSalt(ip, c.ipSalt);
  const emailHash = hashWithSalt(data.email, c.ipSalt);
  const record = {
    email: data.email,
    emailHash,
    ipHash,
    userAgent: input.userAgent,
    company: data.company ?? null,
    volume: data.volume ?? null,
    honeypot: false,
  };

  if (!deps.isDbConfigured()) {
    deps.log("error", "not_configured", { requestId });
    return {
      ...json(503, {
        error: "not_configured",
        message: "Request persistence is not configured yet. Please try again later.",
      }),
      requestId,
    };
  }

  const stored = await deps.persist(record);
  if (!stored.persisted) {
    deps.log("error", "storage_failed", { requestId, reason: stored.reason });
    return {
      ...json(500, { error: "storage_failed", message: "Unable to record the request. Please try again." }),
      requestId,
    };
  }

  // Notification is best-effort and must never block a successfully persisted
  // request — even a provider that throws must not fail the response.
  try {
    const n = await deps.notify(record, stored.id);
    if (n.sent) deps.log("info", "notified", { requestId });
    else deps.log("info", "notification_skipped", { requestId, reason: n.reason ?? "unknown" });
  } catch (err) {
    deps.log("error", "notification_failed", {
      requestId,
      reason: err instanceof Error ? err.message : "unknown",
    });
  }

  deps.log("info", "accepted", { requestId });

  return {
    ...json(200, {
      success: true,
      requestId: stored.id,
      message: "Request received. A treasury engineer will respond within one business day.",
    }),
    requestId: stored.id,
  };
}