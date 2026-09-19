import { describe, it, expect } from "vitest";
import { normalizeClientIp } from "./ip";

describe("normalizeClientIp", () => {
  it("uses a single X-Forwarded-For value", () => {
    expect(normalizeClientIp({ "x-forwarded-for": "203.0.113.10" })).toBe("203.0.113.10");
  });

  it("trusts the proxy-appended (right-most) entry, not the client-injected head", () => {
    expect(normalizeClientIp({ "x-forwarded-for": "203.0.113.10, 10.0.0.2" })).toBe("10.0.0.2");
  });

  it("skips spoofed junk at the head and falls back to the appended IP", () => {
    expect(normalizeClientIp({ "x-forwarded-for": "evil, 10.0.0.2" })).toBe("10.0.0.2");
  });

  it("rejects an IP with a port rather than mis-parsing it", () => {
    expect(normalizeClientIp({ "x-forwarded-for": "1.2.3.4:8080" })).toBe("unknown");
  });

  it("falls back to X-Real-IP when X-Forwarded-For is absent", () => {
    expect(normalizeClientIp({ "x-real-ip": "10.0.0.9" })).toBe("10.0.0.9");
  });

  it("falls back to X-Real-IP when X-Forwarded-For is empty or whitespace", () => {
    expect(normalizeClientIp({ "x-forwarded-for": "  ", "x-real-ip": "10.0.0.9" })).toBe("10.0.0.9");
  });

  it("falls back to X-Real-IP when X-Forwarded-For is garbage", () => {
    expect(normalizeClientIp({ "x-forwarded-for": "garbage", "x-real-ip": "10.0.0.9" })).toBe("10.0.0.9");
  });

  it("returns unknown when every candidate is invalid or missing", () => {
    expect(normalizeClientIp({ "x-forwarded-for": "garbage" })).toBe("unknown");
    expect(normalizeClientIp({ "x-forwarded-for": "  " })).toBe("unknown");
    expect(normalizeClientIp({ "x-real-ip": " " })).toBe("unknown");
    expect(normalizeClientIp({})).toBe("unknown");
  });

  it("accepts IPv6 addresses", () => {
    expect(normalizeClientIp({ "x-forwarded-for": "2001:db8::1" })).toBe("2001:db8::1");
  });

  it("trims surrounding whitespace on each entry", () => {
    expect(normalizeClientIp({ "x-forwarded-for": "  192.0.2.7  ,  10.0.0.5  " })).toBe("10.0.0.5");
  });
});