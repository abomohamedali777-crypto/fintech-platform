import { describe, it, expect } from "vitest";
import {
  hasControlChars,
  intelRequestSchema,
  parseIntelBody,
  parseIngestInput,
} from "./schema";

describe("intelRequestSchema", () => {
  it("accepts a minimal valid body with defaults", () => {
    const out = intelRequestSchema.safeParse({ question: "What licence do I need?" });
    expect(out.success).toBe(true);
    if (out.success) {
      expect(out.data.jurisdiction).toBe("uae");
      expect(out.data.domain).toBe("auto");
    }
  });

  it("rejects unknown top-level keys (strict)", () => {
    const out = intelRequestSchema.safeParse({ question: "x".repeat(20), nope: true });
    expect(out.success).toBe(false);
  });

  it("rejects wrong types", () => {
    expect(intelRequestSchema.safeParse({ question: 42 }).success).toBe(false);
    expect(intelRequestSchema.safeParse({ question: "ok question here", jurisdiction: "zz" }).success).toBe(false);
    expect(intelRequestSchema.safeParse({ question: "ok question here", domain: "nope" }).success).toBe(false);
  });
});

describe("hasControlChars", () => {
  it("detects C0/C1 control characters", () => {
    expect(hasControlChars("normal question")).toBe(false);
    expect(hasControlChars("question\u0000injected")).toBe(true);
    expect(hasControlChars("tab\there")).toBe(true);
    expect(hasControlChars("newline\nhere")).toBe(true);
  });
});

describe("parseIntelBody", () => {
  it("accepts a valid question", () => {
    const res = parseIntelBody({ question: "What licence applies to stored value?" }, 500);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.question.length).toBeGreaterThan(0);
  });

  it("rejects schemas, short, long, and control-char inputs with distinct reasons", () => {
    expect(parseIntelBody(null, 500).ok).toBe(false);
    const short = parseIntelBody({ question: "short" }, 500);
    expect(short.ok).toBe(false);
    if (!short.ok) expect(short.reason).toBe("too_short");

    const long = parseIntelBody({ question: "x".repeat(600) }, 500);
    expect(long.ok).toBe(false);
    if (!long.ok) expect(long.reason).toBe("too_long");

    const ctrl = parseIntelBody({ question: "What is\u0007allowed?" }, 500);
    expect(ctrl.ok).toBe(false);
    if (!ctrl.ok) expect(ctrl.reason).toBe("control_chars");
  });

  it("enforces the configured max query length", () => {
    const res = parseIntelBody({ question: "x".repeat(100) }, 50);
    expect(res.ok).toBe(false);
  });
});

describe("parseIngestInput", () => {
  const valid = {
    title: "Test Regulation",
    publisher: "Test Authority",
    jurisdiction: "uae",
    documentType: "regulation",
    publicationDate: "2022",
    sourceUrl: "https://example.test/reg",
    content: "This is a sufficiently long body of working text for ingestion purposes in tests.",
  };

  it("accepts a valid ingest candidate", () => {
    expect(parseIngestInput(valid).ok).toBe(true);
  });

  it("rejects short content, bad jurisdiction, and non-url sourceUrl", () => {
    expect(parseIngestInput({ ...valid, content: "short" }).ok).toBe(false);
    expect(parseIngestInput({ ...valid, jurisdiction: "eu" }).ok).toBe(false);
    expect(parseIngestInput({ ...valid, sourceUrl: "not a url" }).ok).toBe(false);
  });

  it("strips an exact url sourceUrl via zod url check", () => {
    expect(parseIngestInput({ ...valid, sourceUrl: "https://example.test" }).ok).toBe(true);
  });
});