import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { consumeRateLimit } from "@/lib/rateLimit";
import {
  isDatabaseConfigured,
  persistAccessRequest,
  notifyAccessRequest,
} from "@/lib/accessService";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const IP_LIMIT = Number(process.env.RATE_LIMIT_IP_LIMIT ?? 5);
const IP_WINDOW_MS = Number(process.env.RATE_LIMIT_IP_WINDOW_MS ?? 10 * 60 * 1000);
const EMAIL_LIMIT = Number(process.env.RATE_LIMIT_EMAIL_LIMIT ?? 2);
const EMAIL_WINDOW_MS = Number(process.env.RATE_LIMIT_EMAIL_WINDOW_MS ?? 60 * 60 * 1000);

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function rateLimited(retryAfterSeconds: number, message: string) {
  return NextResponse.json(
    { error: "rate_limited", message },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    },
  );
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const ipCheck = consumeRateLimit(`ip:${ip}`, {
    limit: IP_LIMIT,
    windowMs: IP_WINDOW_MS,
  });

  if (!ipCheck.allowed) {
    return rateLimited(
      ipCheck.retryAfterSeconds,
      `Too many requests from this network. Retry in ${ipCheck.retryAfterSeconds}s.`,
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const body = (payload ?? {}) as Record<string, unknown>;

  if (typeof body.company === "string" && body.company.trim().length > 0) {
    if (isDatabaseConfigured()) {
      await persistAccessRequest({
        email: "honeypot-caught",
        ipHash: createHash("sha256")
          .update(`${ip}:${process.env.ACCESS_IP_SALT ?? "mizan"}`)
          .digest("hex"),
        userAgent: request.headers.get("user-agent"),
        honeypot: true,
      });
    }
    return NextResponse.json(
      { success: true, requestId: `HONEYPOT-${crypto.randomUUID()}` },
      { status: 200 },
    );
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json(
      { error: "invalid_email", message: "A valid enterprise email address is required." },
      { status: 422 },
    );
  }

  const emailCheck = consumeRateLimit(`email:${email}`, {
    limit: EMAIL_LIMIT,
    windowMs: EMAIL_WINDOW_MS,
  });

  if (!emailCheck.allowed) {
    return rateLimited(
      emailCheck.retryAfterSeconds,
      `This address has already submitted a request. Retry in ${emailCheck.retryAfterSeconds}s.`,
    );
  }

  const requestId = crypto.randomUUID();

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        error: "not_configured",
        message: "Persistence is not configured yet. The infrastructure team has been notified.",
      },
      { status: 503 },
    );
  }

  const ipHash = createHash("sha256")
    .update(`${ip}:${process.env.ACCESS_IP_SALT ?? "mizan"}`)
    .digest("hex");

  const stored = await persistAccessRequest({
    email,
    ipHash,
    userAgent: request.headers.get("user-agent"),
    honeypot: false,
  });

  if (!stored.persisted) {
    return NextResponse.json(
      { error: "storage_failed", message: "Unable to record the request. Please try again." },
      { status: 500 },
    );
  }

  await notifyAccessRequest(
    { email, ipHash, userAgent: request.headers.get("user-agent"), honeypot: false },
    requestId,
  );

  return NextResponse.json(
    {
      success: true,
      requestId,
      message: "Request received. A treasury engineer will respond within one business day.",
    },
    { status: 200 },
  );
}