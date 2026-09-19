import { getSiteUrl } from "@/lib/siteUrl";

export const MAX_BODY_BYTES = 16 * 1024;

export const EMAIL_MAX_LENGTH = 254;
export const COMPANY_MAX_LENGTH = 120;
export const VOLUME_MAX_LENGTH = 64;
export const HONEYPOT_MAX_LENGTH = 120;

export const DEFAULT_ACCESS_IP_SALT = "mizan";
export const MIN_ACCESS_IP_SALT_LENGTH = 32;

// Well-known, publicly documented values that must never count as a secret.
// Includes the historical default and the placeholder shipped in .env.example.
const KNOWN_WEAK_SALTS = new Set(["mizan", "change-me-to-a-32+char-random-value"]);

function toPositiveInt(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export interface AccessConfig {
  dbUrl: string | null;
  resendApiKey: string | null;
  notifyTo: string | null;
  notifyFrom: string | null;
  ipSalt: string;
  allowedOrigins: string[];
  ipLimit: number;
  ipWindowMs: number;
  emailLimit: number;
  emailWindowMs: number;
}

function readSalt(env: NodeJS.ProcessEnv): { salt: string | null; strong: boolean } {
  const raw = env.ACCESS_IP_SALT?.trim();
  if (!raw) return { salt: null, strong: false };
  return {
    salt: raw,
    strong: raw.length >= MIN_ACCESS_IP_SALT_LENGTH && !KNOWN_WEAK_SALTS.has(raw),
  };
}

// A salt only counts once it is a random secret of >= 32 chars that is not a
// known value. In production a missing/weak salt never falls back to the
// public "mizan" default: it fail-closes to an empty salt and configWarnings
// surfaces the problem loudly (STRICT_PROD_GUARD turns that into a hard stop).
// Local dev/test keeps working without secrets.
function pickIpSalt(env: NodeJS.ProcessEnv, salt: string | null, strong: boolean): string {
  if (strong && salt) return salt;
  if (env.NODE_ENV === "production") return "";
  return salt ?? DEFAULT_ACCESS_IP_SALT;
}

function readAllowedOrigins(env: NodeJS.ProcessEnv): string[] {
  let origins: string[];
  const explicit = env.ALLOWED_ORIGINS;
  if (explicit && explicit.trim()) {
    origins = explicit
      .split(",")
      .map((o) => o.trim().replace(/\/+$/, ""))
      .filter(Boolean);
  } else {
    origins = [...new Set([getSiteUrl(), "http://localhost:3000"])];
  }
  if (env.NODE_ENV === "production") {
    // Production refuses non-HTTPS origins outright (fail closed). If this
    // filters everything out, the endpoint rejects all cross-origin calls
    // until ALLOWED_ORIGINS is set to a real HTTPS origin.
    return origins.filter((o) => o.startsWith("https://"));
  }
  return origins;
}

function readNotifyFrom(env: NodeJS.ProcessEnv): string | null {
  const from = env.NOTIFY_FROM?.trim();
  if (!from) return null;
  return from;
}

export function accessConfig(env: NodeJS.ProcessEnv = process.env): AccessConfig {
  const { salt, strong } = readSalt(env);

  return {
    dbUrl: env.DATABASE_URL?.trim() || null,
    resendApiKey: env.RESEND_API_KEY?.trim() || null,
    notifyTo: env.NOTIFY_TO?.trim() || null,
    notifyFrom: readNotifyFrom(env),
    ipSalt: pickIpSalt(env, salt, strong),
    allowedOrigins: readAllowedOrigins(env),
    ipLimit: toPositiveInt(env.RATE_LIMIT_IP_LIMIT, 5),
    ipWindowMs: toPositiveInt(env.RATE_LIMIT_IP_WINDOW_MS, 10 * 60 * 1000),
    emailLimit: toPositiveInt(env.RATE_LIMIT_EMAIL_LIMIT, 2),
    emailWindowMs: toPositiveInt(env.RATE_LIMIT_EMAIL_WINDOW_MS, 60 * 60 * 1000),
  };
}

export function configWarnings(env: NodeJS.ProcessEnv = process.env): string[] {
  const out: string[] = [];
  const { strong } = readSalt(env);
  if (!strong && env.NODE_ENV === "production") {
    out.push(
      "[security] ACCESS_IP_SALT is missing or set to a weak default. In production this fail-closes to an empty salt (hashes become linkable). Set a random 32+ character secret (e.g. `openssl rand -hex 32`) before deploying.",
    );
  }
  const origins = readAllowedOrigins(env);
  if (env.NODE_ENV === "production" && origins.some((o) => o.includes("localhost") || !o.startsWith("https://"))) {
    out.push(
      "[security] ALLOWED_ORIGINS contains a non-HTTPS or localhost origin while NODE_ENV=production. Only your production HTTPS origin(s) should be allowed.",
    );
  }
  return out;
}

/**
 * Makes STRICT_PROD_GUARD actually enforced. When NODE_ENV=production and
 * STRICT_PROD_GUARD=1, any config warning throws at import time so a
 * misconfigured deploy fails fast instead of degrading silently. No-op
 * (returns the warnings) in every other case.
 */
export function enforceStrictProdGuard(
  warnings: string[],
  env: NodeJS.ProcessEnv = process.env,
): string[] {
  if (env.NODE_ENV === "production" && env.STRICT_PROD_GUARD === "1" && warnings.length > 0) {
    throw new Error(
      `[fatal] STRICT_PROD_GUARD=1 with misconfigured production settings:\n${warnings.join("\n")}`,
    );
  }
  return warnings;
}