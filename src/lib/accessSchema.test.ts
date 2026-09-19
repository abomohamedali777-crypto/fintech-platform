import { describe, it, expect } from "vitest";
import { parseAccessBody } from "./accessSchema";

describe("parseAccessBody", () => {
  it("normalizes and validates a valid email", () => {
    const r = parseAccessBody({ email: "  JoHn@Example.COM " });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.email).toBe("john@example.com");
  });

  it("rejects a missing email", () => {
    const r = parseAccessBody({});
    expect(r.ok).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(parseAccessBody({ email: "not-an-email" }).ok).toBe(false);
    expect(parseAccessBody({ email: "a@b" }).ok).toBe(false);
  });

  it("rejects an over-length email", () => {
    expect(parseAccessBody({ email: `${"a".repeat(250)}@example.com` }).ok).toBe(false);
  });

  it("rejects unknown fields (strict)", () => {
    const r = parseAccessBody({
      email: "admin@example.com",
      municipality: "smogtown",
    });
    expect(r.ok).toBe(false);
  });

  it("rejects non-object payloads", () => {
    expect(parseAccessBody("nope").ok).toBe(false);
    expect(parseAccessBody(null).ok).toBe(false);
    expect(parseAccessBody([]).ok).toBe(false);
  });

  it("accepts optional company, volume, and blank honeypot", () => {
    const r = parseAccessBody({
      email: "ops@example.com",
      company: "  ACME Treasury  ",
      volume: "$5M – $25M / month",
      fax: "",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.company).toBe("ACME Treasury");
      expect(r.data.volume).toBe("$5M – $25M / month");
      expect(r.data.fax).toBeUndefined();
    }
  });

  it("captures non-empty honeypot for the pipeline", () => {
    const r = parseAccessBody({
      email: "bot@example.com",
      fax: "bot-autofilled",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.fax).toBe("bot-autofilled");
  });

  it("trims optional company and volume to undefined when blank", () => {
    const r = parseAccessBody({ email: "x@example.com", company: "  ", volume: "" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.company).toBeUndefined();
      expect(r.data.volume).toBeUndefined();
    }
  });

  it("rejects C0/C1 control characters in the email", () => {
    expect(parseAccessBody({ email: "a\u0007@example.com" }).ok).toBe(false);
    expect(parseAccessBody({ email: "a@example.\u001fcom" }).ok).toBe(false);
  });

  it("rejects C0/C1 control characters in free-text fields", () => {
    expect(parseAccessBody({ email: "ops@example.com", company: "ACME\nEvil" }).ok).toBe(false);
    expect(parseAccessBody({ email: "ops@example.com", volume: "x\u0000y" }).ok).toBe(false);
    expect(parseAccessBody({ email: "ops@example.com", fax: "\u007f" }).ok).toBe(false);
    expect(parseAccessBody({ email: "ops@example.com", company: "ACME \u009F Co" }).ok).toBe(false);
  });

  it("accepts ordinary printable text in every field", () => {
    const r = parseAccessBody({ email: "ops@example.com", company: "ACME Treasury", volume: "$5M", fax: "" });
    expect(r.ok).toBe(true);
  });
});