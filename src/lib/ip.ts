import { createHash } from "node:crypto";
import { isIP } from "node:net";

type ForwardingHeaders = {
  "x-forwarded-for"?: string | null;
  "x-real-ip"?: string | null;
};

/**
 * Trust model: the proxies in front (Vercel edge, or self-hosted nginx with
 * `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for`) APPEND the
 * real client IP to X-Forwarded-For. Untrusted clients can only influence the
 * entries they inject themselves, pool at the left, so the RIGHT-MOST entry is
 * the one owned by the trusted proxy and is the trustworthy address.
 *
 * Every candidate is validated with isIP. Empty, whitespace, or spoofed junk
 * in X-Forwarded-For must never shadow a valid x-real-ip (or "unknown").
 */
export function normalizeClientIp(headers: ForwardingHeaders): string {
  const candidates = [
    lastForwardedEntry(headers["x-forwarded-for"]),
    headers["x-real-ip"]?.trim() || null,
  ];
  for (const candidate of candidates) {
    if (candidate && isIP(candidate) !== 0) return candidate;
  }
  return "unknown";
}

function lastForwardedEntry(value: string | null | undefined): string | null {
  if (!value) return null;
  const entries = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return entries.length > 0 ? entries[entries.length - 1] : null;
}

export function hashWithSalt(value: string, salt: string): string {
  return createHash("sha256").update(`${value}:${salt}`).digest("hex");
}