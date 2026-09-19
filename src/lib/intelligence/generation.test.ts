import { describe, it, expect } from "vitest";
import { synthesizeLocal, inferSufficiency, detectConflict } from "./generation/synthesis";
import {
  extractJsonPayload,
  normalizeProviderOutput,
  parseJsonStrict,
  normalizeProviderOutputWithPayload,
} from "./generation/guard";
import type { DocumentRecord, RetrievedPassage } from "./types";

function passage(content: string, id = "doc-1"): RetrievedPassage {
  const doc: DocumentRecord = {
    id,
    title: "Test Regulation",
    publisher: "Test Authority",
    jurisdiction: "uae",
    documentType: "regulation",
    publicationDate: "2021",
    sourceUrl: "https://example.test/reg",
    content,
    version: 1,
    contentHash: String(content.length),
    fixture: true,
    retrievedAt: "",
  };
  return {
    document: doc,
    chunk: { id: `${id}#0`, documentId: id, index: 0, text: content },
    score: 1,
  };
}

describe("inferSufficiency", () => {
  it("maps passage counts to sufficiency tiers", () => {
    expect(inferSufficiency(0)).toBe("insufficient");
    expect(inferSufficiency(1)).toBe("limited");
    expect(inferSufficiency(2)).toBe("sufficient");
  });
});

describe("detectConflict", () => {
  it("flags a conflict when prohibitions and permissions both appear", () => {
    const conflict = detectConflict([
      passage("Companies may not provide payment services without a licence.", "a"),
      passage("Licensed entities are permitted to offer stored value facilities.", "b"),
    ]);
    expect(conflict).not.toBeNull();
    expect(conflict?.refs).toHaveLength(2);
  });

  it("returns null when only one side appears", () => {
    expect(
      detectConflict([passage("The activity is prohibited unless licensed.", "a"), passage("Unlicensed activity is forfeited.", "b")]),
    ).toBeNull();
    expect(
      detectConflict([passage("Licensed entities are permitted to operate.", "b")]),
    ).toBeNull();
  });
});

describe("synthesizeLocal", () => {
  it("produces an honest insufficient answer with no sources", () => {
    const answer = synthesizeLocal([], "question", "regulatory", "uae");
    expect(answer.sufficiency).toBe("insufficient");
    expect(answer.summary).toContain("No primary source");
    expect(answer.caveats).toContain(
      "Research support, not legal advice. Verify against primary sources and consult qualified counsel.",
    );
  });

  it("produces a grounded answer for a single source (limited)", () => {
    const answer = synthesizeLocal([passage("payment services must be licensed in the UAE.")], "Do payments need a licence?", "regulatory", "uae");
    expect(answer.sufficiency).toBe("limited");
    expect(answer.considerations.length).toBeGreaterThan(0);
    expect(answer.summary.length).toBeGreaterThan(0);
  });

  it("adds a conflict caveat when the sources conflict", () => {
    const answer = synthesizeLocal(
      [
        passage("Companies may not provide payment services without a licence.", "a"),
        passage("Licensed entities are permitted to offer stored value facilities.", "b"),
      ],
      "question",
      "regulatory",
      "uae",
    );
    expect(answer.caveats.some((c) => c.includes("conflict") || c.includes("prohibitions"))).toBe(true);
  });
});

describe("parseJsonStrict", () => {
  it("parses a JSON object", () => {
    const out = parseJsonStrict('{"summary":"ok"}');
    expect(out).not.toBeNull();
  });

  it("rejects primitives and non-strict JSON", () => {
    expect(parseJsonStrict('"just-a-string"')).toBeNull();
    expect(parseJsonStrict("not json {")).toBeNull();
    expect(parseJsonStrict("[1,2]")).toBeNull();
  });
});

describe("normalizeProviderOutput", () => {
  const docs = [
    passage("one", "real-1").document,
    passage("two", "real-2").document,
  ];

  it("accepts a valid response referencing real document ids", () => {
    const raw = JSON.stringify({
      summary: "A licence is generally required for the described activity.",
      considerations: [{ text: "The licensing authority supervises this activity.", ids: ["real-1"] }],
    });
    const out = normalizeProviderOutput(raw, docs);
    expect(out).not.toBeNull();
    expect(out?.considerations[0].refs).toEqual(["real-1"]);
    expect(out?.absoluteClaim).toBeNull();
  });

  it("drops fabricated source ids (hallucination guard)", () => {
    const raw = JSON.stringify({
      summary: "Imagined statute 99 of 1999 applies.",
      considerations: [
        { text: "Fabricated consideration body text here.", ids: ["never-retrieved"] },
      ],
    });
    const out = normalizeProviderOutput(raw, docs);
    expect(out).toBeNull();
  });

  it("flags absolute legal-claim language", () => {
    const raw = JSON.stringify({
      summary: "This is a guaranteed compliance answer with no risk.",
      considerations: [{ text: "Additional consideration text.", ids: ["real-1"] }],
    });
    const out = normalizeProviderOutput(raw, docs);
    expect(out?.absoluteClaim).not.toBeNull();
  });

  it("rejects malformed shapes", () => {
    expect(normalizeProviderOutput('{"summary":"x"}', docs)).toBeNull();
    expect(normalizeProviderOutput('{"summary":"short"}', docs)).toBeNull();
    expect(normalizeProviderOutput(JSON.stringify({ summary: "not an object " }) + "1", docs)).toBeNull();
  });

  it("extractJsonPayload unwraps fenced JSON", () => {
    expect(extractJsonPayload('```json\n{"summary":"ok"}\n```')).toBe('{"summary":"ok"}');
    const wrapped = normalizeProviderOutputWithPayload('prefix ```{"summary":"a sufficiently long summary that passes","considerations":[]}```', docs);
    expect(wrapped).not.toBeNull();
  });
});