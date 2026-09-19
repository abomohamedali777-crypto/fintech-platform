import { describe, it, expect } from "vitest";
import { chunkText } from "./chunking";

describe("chunkText", () => {
  it("returns a single chunk for short text", () => {
    const chunks = chunkText("short text here");
    expect(chunks).toEqual(["short text here"]);
  });

  it("splits long text into word-packed chunks under the limit", () => {
    const text = Array.from({ length: 100 }, (_, i) => `word${i}`).join(" ");
    const chunks = chunkText(text, 100);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) {
      expect(c.length).toBeLessThanOrEqual(100);
    }
    // Original words are preserved exactly.
    expect(chunks.join(" ")).toBe(text);
  });

  it("keeps a single token longer than the limit whole", () => {
    const longToken = "x".repeat(500);
    const chunks = chunkText(`before ${longToken} after`, 100);
    expect(chunks).toContain(longToken);
  });

  it("normalizes whitespace and trims", () => {
    const chunks = chunkText("  a   b\t\tc  ");
    expect(chunks).toEqual(["a b c"]);
  });

  it("handles empty and whitespace-only input", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   ")).toEqual([]);
  });
});