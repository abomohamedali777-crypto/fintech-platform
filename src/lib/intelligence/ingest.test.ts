import { describe, it, expect } from "vitest";
import { IntelCorpus } from "./sources/corpus";
import { runIngestion } from "./ingest";
import { uaeFixtureAdapter } from "./sources/fixtures";
import type { IngestInput } from "./schema";
import type { SourceAdapter } from "./sources/adapter";
import type { ChunkRecord, DocumentRecord } from "./types";

function baseDoc(overrides: Partial<IngestInput> = {}): IngestInput {
  return {
    title: "Test Regulation on Payments",
    publisher: "Test Authority",
    jurisdiction: "uae",
    documentType: "regulation",
    publicationDate: "2021",
    sourceUrl: "https://example.test/payments",
    content:
      "Any person providing payment services in the emirate from or into the UAE must hold a licence from the relevant authority and comply with anti-money-laundering obligations before offering the service to the public.",
    ...overrides,
  };
}

describe("IntelCorpus", () => {
  it("ingests a document, indexes chunks, and dedupes identical content", () => {
    const corpus = new IntelCorpus();
    const created = corpus.ingest(baseDoc(), 1_700_000_000_000);
    expect(created.status).toBe("created");
    expect(corpus.size()).toBe(1);
    expect(corpus.allChunks().length).toBeGreaterThan(0);

    const dup = corpus.ingest(baseDoc(), 1_700_000_000_000);
    expect(dup.status).toBe("skipped_duplicate");
    expect(corpus.size()).toBe(1);
  });

  it("bumps the version and replaces content when a document changes", () => {
    const corpus = new IntelCorpus();
    corpus.ingest(baseDoc({ content: "first version".repeat(30) }), 1);
    const updated = corpus.ingest(baseDoc({ content: "second version".repeat(30) }), 2);
    expect(updated.status).toBe("updated");
    expect(updated.version).toBe(2);

    const doc = corpus.list()[0];
    expect(doc.contentHash).not.toBe("first".repeat(0));
    const afterChange = corpus.ingest(baseDoc({ content: "second version".repeat(30) }), 3);
    expect(afterChange.status).toBe("skipped_duplicate");
  });

  it("chunks have stable ids and point back to the document", () => {
    const corpus = new IntelCorpus();
    const { document } = corpus.ingest(baseDoc(), 1);
    const chunks = corpus.chunksFor(document.id);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.every((c) => c.documentId === document.id)).toBe(true);
    expect(new Set(chunks.map((c) => c.id)).size).toBe(chunks.length);
  });

  it("hydrate rebuilds the index from persisted records", () => {
    const corpus = new IntelCorpus();
    const { document } = corpus.ingest(baseDoc(), 1);

    const restored = new IntelCorpus();
    const chunks = corpus.allChunks();
    const docs: DocumentRecord[] = [document];
    restored.hydrate(docs, chunks);
    expect(restored.size()).toBe(1);
    expect(restored.get(document.id)?.title).toBe(document.title);
    expect(restored.allChunks()).toHaveLength(chunks.length);
  });
});

describe("runIngestion", () => {
  it("rejects invalid candidates and reports the breakdown", async () => {
    const adapter: SourceAdapter = {
      id: "test-adapter",
      label: "test",
      fetchDocuments: async () => [
        baseDoc() as IngestInput,
        baseDoc({ title: "bad" }) as IngestInput,
        { not: "a doc" } as unknown as IngestInput,
      ],
    };
    const corpus = new IntelCorpus();
    const report = await runIngestion(adapter, corpus, { log: () => {} });
    expect(report.adapterId).toBe("test-adapter");
    expect(report.attempted).toBe(3);
    expect(report.created).toBe(1);
    expect(report.rejected).toBe(2);
  });

  it("propagates an adapter failure into the report", async () => {
    const adapter: SourceAdapter = {
      id: "boom",
      label: "boom",
      fetchDocuments: async () => {
        throw new Error("upstream down");
      },
    };
    const report = await runIngestion(adapter, new IntelCorpus(), { log: () => {} });
    expect(report.errors.length).toBe(1);
    expect(report.errors[0]).toContain("adapter fetch failed");
  });

  it("calls persist with the full corpus", async () => {
    let persisted = 0;
    const adapter: SourceAdapter = {
      id: "persist-test",
      label: "persist-test",
      fetchDocuments: async () => [baseDoc()],
    };
    const corpus = new IntelCorpus();
    const report = await runIngestion(adapter, corpus, {
      log: () => {},
      persist: async (docs: DocumentRecord[], chunks: ChunkRecord[]) => {
        persisted += 1;
        expect(docs.length).toBe(1);
        expect(chunks.length).toBeGreaterThan(0);
      },
    });
    expect(persisted).toBe(1);
    expect(report.created).toBe(1);
  });

  it("ships a fixture corpus with only valid UAE records", async () => {
    const corpus = new IntelCorpus();
    const report = await runIngestion(uaeFixtureAdapter, corpus, { log: () => {} });
    expect(report.rejected).toBe(0);
    expect(report.created).toBeGreaterThanOrEqual(10);
    for (const doc of corpus.list()) {
      expect(doc.jurisdiction).toBe("uae");
      expect(doc.fixture).toBe(true);
      expect(doc.sourceUrl.startsWith("https://")).toBe(true);
    }
  });
});