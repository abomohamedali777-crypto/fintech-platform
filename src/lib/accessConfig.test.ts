import { describe, it, expect } from "vitest";
import {
  accessConfig,
  configWarnings,
  enforceStrictProdGuard,
  DEFAULT_ACCESS_IP_SALT,
  MIN_ACCESS_IP_SALT_LENGTH,
} from "./accessConfig";

const STRONG_32 = "0123456789abcdef0123456789abcdef";
const STRONG_64 = "s".repeat(64);
const WEAK_16 = "w".repeat(16);
const WEAK_31 = "w".repeat(31);
const PLACEHOLDER = "change-me-to-a-32+char-random-value";

function env(overrides: Partial<NodeJS.ProcessEnv> = {}): NodeJS.ProcessEnv {
  return { NODE_ENV: "test", ...overrides } as NodeJS.ProcessEnv;
}

describe("accessConfig — ACCESS_IP_SALT", () => {
  it("defaults to the documented salt only outside production", () => {
    const cfg = accessConfig(env({}));
    expect(cfg.ipSalt).toBe(DEFAULT_ACCESS_IP_SALT);
  });

  it("uses a strong 32+ char salt when provided", () => {
    const cfg = accessConfig(env({ ACCESS_IP_SALT: STRONG_32 }));
    expect(cfg.ipSalt).toBe(STRONG_32);
    expect(configWarnings(env({ NODE_ENV: "production", ACCESS_IP_SALT: STRONG_32 }))).toEqual([]);
  });

  it("keeps a dev-provided salt even if shorter than production strength", () => {
    const cfg = accessConfig(env({ ACCESS_IP_SALT: WEAK_16 }));
    expect(cfg.ipSalt).toBe(WEAK_16);
  });

  it("never falls back to the default in production when the salt is missing", () => {
    const cfg = accessConfig(env({ NODE_ENV: "production" }));
    expect(cfg.ipSalt).toBe("");
    expect(cfg.ipSalt).not.toBe(DEFAULT_ACCESS_IP_SALT);
  });

  it("rejects the historical 'mizan' default in production", () => {
    const cfg = accessConfig(env({ NODE_ENV: "production", ACCESS_IP_SALT: "mizan" }));
    expect(cfg.ipSalt).toBe("");
  });

  it("rejects the published .env.example placeholder in production", () => {
    const cfg = accessConfig(env({ NODE_ENV: "production", ACCESS_IP_SALT: PLACEHOLDER }));
    expect(cfg.ipSalt).toBe("");
  });

  it("rejects a sub-32 char salt in production", () => {
    const cfg = accessConfig(env({ NODE_ENV: "production", ACCESS_IP_SALT: WEAK_31 }));
    expect(cfg.ipSalt).toBe("");
  });

  it("warns in production for a missing or weak salt, but not in dev", () => {
    expect(configWarnings(env({ NODE_ENV: "production" }))[0]).toMatch(/ACCESS_IP_SALT/);
    expect(configWarnings(env({ NODE_ENV: "production", ACCESS_IP_SALT: "mizan" }))[0]).toMatch(/ACCESS_IP_SALT/);
    expect(configWarnings(env({})).some((w) => w.includes("ACCESS_IP_SALT"))).toBe(false);
  });

  it("treats only 32+ char unknown salts as strong", () => {
    expect(MIN_ACCESS_IP_SALT_LENGTH).toBe(32);
    expect(accessConfig(env({ ACCESS_IP_SALT: STRONG_64 })).ipSalt).toBe(STRONG_64);
    expect(accessConfig(env({ ACCESS_IP_SALT: WEAK_16 })).ipSalt).toBe(WEAK_16);
  });
});

describe("enforceStrictProdGuard", () => {
  const warnings = ["[security] something is wrong"];

  it("throws in production with STRICT_PROD_GUARD=1 and warnings present", () => {
    expect(() =>
      enforceStrictProdGuard(warnings, env({ NODE_ENV: "production", STRICT_PROD_GUARD: "1" })),
    ).toThrow(/STRICT_PROD_GUARD/);
  });

  it("is a no-op when the guard is off", () => {
    expect(() =>
      enforceStrictProdGuard(warnings, env({ NODE_ENV: "production", STRICT_PROD_GUARD: "0" })),
    ).not.toThrow();
  });

  it("is a no-op outside production even with the guard on", () => {
    expect(() =>
      enforceStrictProdGuard(warnings, env({ NODE_ENV: "test", STRICT_PROD_GUARD: "1" })),
    ).not.toThrow();
  });

  it("is a no-op in production when there are no warnings", () => {
    expect(() =>
      enforceStrictProdGuard([], env({ NODE_ENV: "production", STRICT_PROD_GUARD: "1" })),
    ).not.toThrow();
    expect(enforceStrictProdGuard([], env({ NODE_ENV: "production", STRICT_PROD_GUARD: "1" }))).toEqual([]);
  });
});