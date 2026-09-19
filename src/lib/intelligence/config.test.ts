import { describe, it, expect } from "vitest";
import {
  intelConfig,
  intelConfigWarnings,
  intelEnforceStrictProdGuard,
} from "./config";

const STRONG_SALT = "0123456789abcdef0123456789abcdef";

function env(overrides: Partial<NodeJS.ProcessEnv> = {}): NodeJS.ProcessEnv {
  return { NODE_ENV: "test", ...overrides } as NodeJS.ProcessEnv;
}

describe("intelConfig — INTEL_CORPUS_MODE", () => {
  it("defaults to fixture mode", () => {
    expect(intelConfig(env({})).corpusMode).toBe("fixture");
  });

  it("reads db mode when explicitly set (case-insensitive)", () => {
    expect(intelConfig(env({ INTEL_CORPUS_MODE: "DB" })).corpusMode).toBe("db");
  });

  it("treats anything other than db as fixture", () => {
    expect(intelConfig(env({ INTEL_CORPUS_MODE: "live" })).corpusMode).toBe("fixture");
  });
});

describe("intelConfigWarnings — fixture mode is loud in production", () => {
  it("warns when production serves the fixture corpus", () => {
    const warnings = intelConfigWarnings(
      env({ NODE_ENV: "production", ACCESS_IP_SALT: STRONG_SALT, SITE_URL: "https://mizan.vercel.app" }),
    );
    expect(warnings.some((w) => w.includes("INTEL_CORPUS_MODE") && w.includes("fixture"))).toBe(true);
  });

  it("stays silent about the corpus when db mode is set in production", () => {
    const warnings = intelConfigWarnings(
      env({
        NODE_ENV: "production",
        ACCESS_IP_SALT: STRONG_SALT,
        SITE_URL: "https://mizan.vercel.app",
        INTEL_CORPUS_MODE: "db",
      }),
    );
    expect(warnings.some((w) => w.includes("INTEL_CORPUS_MODE"))).toBe(false);
  });

  it("does not warn in development even without db mode", () => {
    const warnings = intelConfigWarnings(env({}));
    expect(warnings.some((w) => w.includes("INTEL_CORPUS_MODE"))).toBe(false);
  });

  it("throws under STRICT_PROD_GUARD when fixture mode is on in production", () => {
    expect(() =>
      intelEnforceStrictProdGuard(
        intelConfigWarnings(env({ NODE_ENV: "production", SITE_URL: "https://x.app" })),
        env({ NODE_ENV: "production", STRICT_PROD_GUARD: "1" }),
      ),
    ).toThrow(/INTEL_CORPUS_MODE/);
  });
});