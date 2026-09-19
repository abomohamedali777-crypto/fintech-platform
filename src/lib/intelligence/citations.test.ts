import { describe, it, expect } from "vitest";
import { buildCitations } from "./citations/citations";
import { evidenceGroundingLabel } from "./generation/evidence";
import type { DocumentRecord, IntelAnswer, RetrievedPassage } from "./types";

function record(id: string, overrides: Partial<DocumentRecord> = {}): DocumentRecord {
  return {
    id,
    title: `Document ${id}`,
    publisher: "Test Authority",
    jurisdiction: "uae",
    documentType: "regulation",
    publicationDate: "2021",
    sourceUrl: "https://example.test",
    content: "test content that is long enough for a chunk",
    version: 1,
    contentHash: "hash",
    fixture: false,
    retrievedAt: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("buildCitations", () => {
  it("numbers unique documents in first-appearance order", () => {
    const index = buildCitations([record("a"), record("b"), record("a")]);
    expect(index.citations.map((c) => c.ref)).toEqual(["[1]", "[2]"]);
    expect(index.citations[0].id).toBe("a");
    expect(index.citations[1].id).toBe("b");
  });

  it("resolves refsFor / refsForMany", () => {
    const index = buildCitations([record("a"), record("b")]);
    expect(index.refsFor("a")).toBe("[1]");
    expect(index.refsForMany(["a", "b"])).toEqual(["[1]", "[2]"]);
    expect(index.refsForMany(["zz"])).toEqual([]);
  });

  it("surfaces the sourceUrl and fixture flag on each citation", () => {
    const index = buildCitations([record("a", { sourceUrl: "https://portal.test/x", fixture: true })]);
    expect(index.citations[0].sourceUrl).toBe("https://portal.test/x");
    expect(index.citations[0].fixture).toBe(true);
  });
});

describe("evidenceGroundingLabel", () => {
  function passage(id: string): RetrievedPassage {
    return {
      document: record(id),
      chunk: { id: `${id}#0`, documentId: id, index: 0, text: "text" },
      score: 1,
    };
  }

  function answer(sufficiency: IntelAnswer["sufficiency"]): IntelAnswer {
    return {
      summary: "s",
      considerations: [],
      jurisdiction: "uae",
      domain: "regulatory",
      sufficiency,
      caveats: [],
    };
  }

  it("labels no evidence", () => {
    expect(evidenceGroundingLabel([], answer("insufficient"))).toContain("No primary source");
  });

  it("labels grounded evidence with the passage count", () => {
    const label = evidenceGroundingLabel([passage("a"), passage("b")], answer("sufficient"));
    expect(label).toContain("2 passage");
    expect(label).toContain("sufficient");
  });
});