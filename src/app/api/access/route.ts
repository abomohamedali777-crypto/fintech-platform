import { NextRequest, NextResponse } from "next/server";
import { MAX_BODY_BYTES, accessConfig, configWarnings, enforceStrictProdGuard } from "@/lib/accessConfig";
import { NO_STORE, handleAccessRequest, parseContentLength, type AccessDeps } from "@/lib/accessPipeline";
import { persistAccessRequest, notifyAccessRequest } from "@/lib/accessService";
import { isDbConfigured } from "@/lib/db";
import { accessLog } from "@/lib/accessLogger";
import { consumeRateLimit } from "@/lib/rateLimit";
import { readStreamBodyCapped } from "@/lib/readBody";

// Surface misconfiguration immediately — but never crash the build in tests.
// With STRICT_PROD_GUARD=1 the warnings become a fatal error at import time
// so misconfigured deploys fail fast instead of degrading silently.
const warnings = configWarnings();
if (process.env.NODE_ENV === "production") {
  enforceStrictProdGuard(warnings);
  for (const w of warnings) console.warn(w);
}

const deps: AccessDeps = {
  config: accessConfig(),
  rateLimiter: consumeRateLimit,
  isDbConfigured,
  persist: persistAccessRequest,
  notify: notifyAccessRequest,
  log: accessLog,
};

export async function POST(request: NextRequest) {
  // Reject malformed or oversized bodies from the Content-Length header before
  // buffering the body into memory. The pipeline re-checks the header and the
  // decoded body too, so this is defense-in-depth against unbounded memory use.
  const contentLength = request.headers.get("content-length");
  const length = parseContentLength(contentLength);
  if (length.present && !length.ok) {
    return NextResponse.json(
      { error: "invalid_content_length", message: "Content-Length header must be a non-negative integer." },
      { status: 400, headers: NO_STORE },
    );
  }
  if (length.present && length.bytes > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "payload_too_large", message: "Request body is too large." },
      { status: 413, headers: NO_STORE },
    );
  }

  // True stream read with a hard byte cap: even a chunked body (no or fake
  // Content-Length) can never buffer more than MAX_BODY_BYTES into memory.
  const { rawBody, oversized } = await readStreamBodyCapped(request.body, MAX_BODY_BYTES);
  if (oversized) {
    return NextResponse.json(
      { error: "payload_too_large", message: "Request body is too large." },
      { status: 413, headers: NO_STORE },
    );
  }

  const input = {
    method: "POST",
    origin: request.headers.get("origin"),
    referer: request.headers.get("referer"),
    contentType: request.headers.get("content-type"),
    contentLength,
    ipHeaders: {
      "x-forwarded-for": request.headers.get("x-forwarded-for"),
      "x-real-ip": request.headers.get("x-real-ip"),
    },
    userAgent: request.headers.get("user-agent"),
    rawBody,
  };

  const result = await handleAccessRequest(input, deps);
  return NextResponse.json(result.body, {
    status: result.status,
    headers: result.headers,
  });
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      // The endpoint is same-origin only; a restrictive allowlist is correct.
      "Access-Control-Allow-Origin": "",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "600",
      "Cache-Control": "no-store",
    },
  });
}