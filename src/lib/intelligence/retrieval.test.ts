import { describe, it, expect } from "vitest";
import { IntelCorpus } from "./sources/corpus";
import {
  bm25Score,
  buildDocStats,
  recencyBoost,
  termFreq,
  titleOverlap,
  tokenize,
  typeBoost,
} from "./retrieval/ranking";
import { retrieve } from "./retrieval/retrieve";
import type { DocumentRecord } from "./types";
import type { IngestInput } from "./schema";

function doc(overrides: Partial<IngestInput> = {}): IngestInput {
  const title =
    overrides.title ?? "Regulation on Virtual Asset Service Providers in the UAE";
  return {
    title,
    publisher: "Test Regulator",
    jurisdiction: "uae",
    documentType: overrides.documentType ?? "regulation",
    publicationDate: overrides.publicationDate ?? "2021",
    sourceUrl: "https://example.test",
    content: overrides.content ?? title.repeat(6),
    ...overrides,
  };
}

describe("ranking primitives", () => {
  it("tokenizes to lowercased word tokens", () => {
    expect(tokenize("Virtual Asset VASPs in UAE - 2021!")).toContain("virtual");
    expect(tokenize("AML/CFT")).toEqual(["aml", "cft"]);
  });

  it("termFreq counts query terms", () => {
    const bag = termFreq(["x", "y", "x"]);
    expect(bag.get("x")).toBe(2);
    expect(bag.get("y")).toBe(1);
  });

  it("bm25Score ranks a matching document above an unrelated one", () => {
    const d1: DocumentRecord = {
      id: "a",
      title: "Payments Law",
      publisher: "P",
      jurisdiction: "uae",
      documentType: "legislation",
      publicationDate: "2021",
      sourceUrl: "https://x",
      content: "virtual assets shall require licence",
      version: 1,
      contentHash: "h",
      fixture: false,
      retrievedAt: "",
    };
    const d2: DocumentRecord = { ...d1, id: "b", content: "camel breeding agriculture" };

    const stats = buildDocStats([d1, d2]);
    const q = termFreq(["virtual", "asset"]);
    const s1 = bm25Score(q, tokenize(`${d1.title} ${d1.content}`), stats);
    const s2 = bm25Score(q, tokenize(`${d2.title} ${d2.content}`), stats);
    expect(s1).toBeGreaterThan(0);
    expect(s1).toBeGreaterThan(s2);
  });

  it("titleOverlap returns the fraction of query tokens found in the title", () => {
    expect(titleOverlap(tokenize("virtual asset licence"), "Virtual Asset Regulations")).toBe(2 / 3);
    expect(titleOverlap(tokenize("virtual asset licence"), "Camel Agriculture")).toBe(0);
  });

  it("recencyBoost decreases with age but stays >= 0.7", () => {
    const now = new Date("2026-01-01").getTime();
    const recent: DocumentRecord = {
      id: "r",
      title: "R",
      publisher: "P",
      jurisdiction: "uae",
      documentType: "guidance",
      publicationDate: "2026",
      sourceUrl: "https://x",
      content: "x",
      version: 1,
      contentHash: "h",
      fixture: false,
      retrievedAt: "",
    };
    const old = { ...recent, id: "o", publicationDate: "2000" };
    expect(recencyBoost(recent, now)).toBeCloseTo(1);
    expect(recencyBoost(old, now)).toBeLessThan(recencyBoost(recent, now));
    expect(recencyBoost(old, now)).toBeGreaterThanOrEqual(0.7);
  });

  it("typeBoost weights legislation above general guidance", () => {
    expect(typeBoost({ ...dummyRecord, documentType: "legislation" })).toBeGreaterThan(
      typeBoost({ ...dummyRecord, documentType: "guidance" }),
    );
  });
});

const dummyRecord: DocumentRecord = {
  id: "d",
  title: "D",
  publisher: "P",
  jurisdiction: "uae",
  documentType: "regulation",
  publicationDate: "2021",
  sourceUrl: "https://x",
  content: "x",
  version: 1,
  contentHash: "h",
  fixture: false,
  retrievedAt: "",
};

describe("retrieve", () => {
  function corpus(): IntelCorpus {
    const c = new IntelCorpus();
    c.ingest(
      doc({
        title: "Virtual Asset Service Provider Licensing Law",
        content:
          "Persons carrying on virtual asset activities must obtain a licence from the competent authority. Anti money laundering and customer due diligence obligations apply. Stored value facilities are also regulated under a separate regime.",
      }),
      1_700_000_000_000,
    );
    c.ingest(
      doc({
        title: "Camel Agriculture Act",
        documentType: "legislation",
        content: "Camel breeding and agriculture activities do not require financial authorisation.",
      }),
      1_700_000_000_000,
    );
    return c;
  }

  it("retrieves relevant passages and respects topK + document budget", () => {
    const passages = retrieve(corpus(), "Do virtual asset providers need a licence?", {}, { topK: 4, contextMaxChars: 6000 }, 1_700_000_000_000);
    expect(passages.length).toBeGreaterThan(0);
    expect(new Set(passages.map((p) => p.document.id)).size).toBeLessThanOrEqual(2);
  });

  it("never exceeds topK even when every document matches and the budget is large", () => {
    const many = new IntelCorpus();
    for (let i = 0; i < 12; i++) {
      many.ingest(
        doc({
          title: `Regulation ${i} on virtual asset service providers`,
          content: `Virtual asset providers must be licensed by the competent authority and meet fit and proper requirements. Provisions ${i}.`,
        }),
        1_700_000_000_000,
      );
    }
    const passages = retrieve(many, "virtual asset license providers", {}, { topK: 4, contextMaxChars: 100_000 }, 1_700_000_000_000);
    expect(passages.length).toBeLessThanOrEqual(4);
  });

  it("filters by documentType", () => {
    const passages = retrieve(corpus(), "virtual asset licence", { documentType: "legislation" }, { topK: 4, contextMaxChars: 6000 }, 1_700_000_000_000);
    for (const p of passages) expect(p.document.documentType).toBe("legislation");
  });

  it("returns empty when the jurisdiction filter excludes everything", () => {
    const passages = retrieve(corpus(), "virtual asset licence", { jurisdiction: "sg" }, { topK: 4, contextMaxChars: 6000 }, 1_700_000_000_000);
    expect(passages).toEqual([]);
  });
});