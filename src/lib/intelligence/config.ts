import { getSiteUrl } from "@/lib/siteUrl";
import type { ProviderKind } from "./types";

export const DEFAULT_INTEL_MAX_QUERY_CHARS = 500;
export const DEFAULT_INTEL_MAX_BODY_BYTES = 8 * 1024;
export const DEFAULT_INTEL_IP_LIMIT = 12;
export const DEFAULT_INTEL_IP_WINDOW_MS = 10 * 60 * 1000;
export const DEFAULT_INTEL_TOP_K = 4;
export const DEFAULT_INTEL_CONTEXT_MAX_CHARS = 6_000;
export const DEFAULT_INTEL_AI_MAX_TOKENS = 700;
export const DEFAULT_INTEL_AI_TIMEOUT_MS = 15_000;
export const DEFAULT_INTEL_CACHE_TTL_MS = 5 * 60 * 1000;
export const DEFAULT_INTEL_CACHE_MAX = 64;

const KNOWN_WEAK_SALTS = new Set(["mizan", "change-me-to-a-32+char-random-value"]);
const MIN_SALT_LENGTH = 32;

function toPositiveInt(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function readOrigins(env: NodeJS.ProcessEnv): string[] {
  let origins: string[];
  const explicit = env.INTEL_ALLOWED_ORIGINS;
  if (explicit && explicit.trim()) {
    origins = explicit
      .split(",")
      .map((o) => o.trim().replace(/\/+$/, ""))
      .filter(Boolean);
  } else {
    origins = [...new Set([getSiteUrl(), "http://localhost:3000"])];
  }
  if (env.NODE_ENV === "production") {
    return origins.filter((o) => o.startsWith("https://"));
  }
  return origins;
}

function readSalt(env: NodeJS.ProcessEnv): string {
  const raw = env.ACCESS_IP_SALT?.trim();
  const strong = Boolean(
    raw && raw.length >= MIN_SALT_LENGTH && !KNOWN_WEAK_SALTS.has(raw),
  );
  if (strong && raw) return raw;
  if (env.NODE_ENV === "production") return "";
  return raw ?? "mizan";
}

export interface IntelConfig {
  maxQueryChars: number;
  maxBodyBytes: number;
  ipLimit: number;
  ipWindowMs: number;
  allowedOrigins: string[];
  ipSalt: string;
  token: string | null;
  topK: number;
  contextMaxChars: number;
  providerKind: ProviderKind;
  aiBaseUrl: string;
  aiApiKey: string | null;
  aiModel: string;
  aiMaxTokens: number;
  aiTimeoutMs: number;
  cacheTtlMs: number;
  cacheMax: number;
  persistDb: boolean;
}

export function intelConfig(env: NodeJS.ProcessEnv = process.env): IntelConfig {
  const providerKindRaw = env.INTEL_AI_PROVIDER?.trim().toLowerCase();
  const providerKind: ProviderKind =
    providerKindRaw === "openai-compatible" ? "openai-compatible" : "none";

  return {
    maxQueryChars: toPositiveInt(
      env.INTEL_MAX_QUERY_CHARS,
      DEFAULT_INTEL_MAX_QUERY_CHARS,
    ),
    maxBodyBytes: toPositiveInt(
      env.INTEL_MAX_BODY_BYTES,
      DEFAULT_INTEL_MAX_BODY_BYTES,
    ),
    ipLimit: toPositiveInt(
      env.INTEL_RATE_LIMIT_IP_LIMIT,
      DEFAULT_INTEL_IP_LIMIT,
    ),
    ipWindowMs: toPositiveInt(
      env.INTEL_RATE_LIMIT_IP_WINDOW_MS,
      DEFAULT_INTEL_IP_WINDOW_MS,
    ),
    allowedOrigins: readOrigins(env),
    ipSalt: readSalt(env),
    token: env.INTEL_TOKEN?.trim() || null,
    topK: toPositiveInt(env.INTEL_RETRIEVE_TOP_K, DEFAULT_INTEL_TOP_K),
    contextMaxChars: toPositiveInt(
      env.INTEL_CONTEXT_MAX_CHARS,
      DEFAULT_INTEL_CONTEXT_MAX_CHARS,
    ),
    providerKind,
    aiBaseUrl:
      env.INTEL_AI_BASE_URL?.trim() || "https://api.openai.com/v1",
    aiApiKey: env.INTEL_AI_API_KEY?.trim() || null,
    aiModel: env.INTEL_AI_MODEL?.trim() || "gpt-4o-mini",
    aiMaxTokens: toPositiveInt(
      env.INTEL_AI_MAX_TOKENS,
      DEFAULT_INTEL_AI_MAX_TOKENS,
    ),
    aiTimeoutMs: toPositiveInt(
      env.INTEL_AI_TIMEOUT_MS,
      DEFAULT_INTEL_AI_TIMEOUT_MS,
    ),
    cacheTtlMs:
      typeof env.INTEL_CACHE_TTL_MS === "string" &&
      Number(env.INTEL_CACHE_TTL_MS) >= 0
        ? Number(env.INTEL_CACHE_TTL_MS)
        : DEFAULT_INTEL_CACHE_TTL_MS,
    cacheMax: toPositiveInt(env.INTEL_CACHE_MAX, DEFAULT_INTEL_CACHE_MAX),
    persistDb: env.INTEL_PERSIST_DB === "1",
  };
}

export function intelConfigWarnings(
  env: NodeJS.ProcessEnv = process.env,
): string[] {
  const warnings: string[] = [];
  const salt = readSalt(env);

  if (!salt && env.NODE_ENV === "production") {
    warnings.push(
      "[security] ACCESS_IP_SALT is missing or weak. Intelligence rate-limit bucket keys will use an empty salt (linkable in production). Set a random 32+ character secret (e.g. `openssl rand -hex 32`) before deploying.",
    );
  }

  const origins = readOrigins(env);
  if (
    env.NODE_ENV === "production" &&
    origins.some((o) => o.includes("localhost") || !o.startsWith("https://"))
  ) {
    warnings.push(
      "[security] INTEL_ALLOWED_ORIGINS (or SITE_URL fallback) contains a non-HTTPS / localhost origin while NODE_ENV=production.",
    );
  }

  if (
    env.INTEL_AI_PROVIDER?.trim().toLowerCase() === "openai-compatible" &&
    !env.INTEL_AI_API_KEY?.trim()
  ) {
    warnings.push(
      "[intelligence] INTEL_AI_PROVIDER=openai-compatible but INTEL_AI_API_KEY is not set. The engine will run in local-synthesis mode.",
    );
  }

  return warnings;
}

/**
 * Fail-fast in production when STRICT_PROD_GUARD=1 and warnings exist.
 * Identical semantics to the access module's enforceStrictProdGuard.
 */
export function intelEnforceStrictProdGuard(
  warnings: string[],
  env: NodeJS.ProcessEnv = process.env,
): string[] {
  if (
    env.NODE_ENV === "production" &&
    env.STRICT_PROD_GUARD === "1" &&
    warnings.length > 0
  ) {
    throw new Error(
      `[fatal] STRICT_PROD_GUARD=1 with misconfigured intelligence settings:\n${warnings.join("\n")}`,
    );
  }
  return warnings;
}