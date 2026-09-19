import type {
  ChunkRecord,
  DocumentRecord,
} from "@/lib/intelligence/types";
import type { IngestInput } from "@/lib/intelligence/schema";
import { chunkText } from "@/lib/intelligence/chunking";
import { chunkId, contentHash, documentId } from "@/lib/intelligence/ids";

export type IngestOutcome =
  | { status: "created" | "updated"; document: DocumentRecord; version: number }
  | { status: "skipped_duplicate"; document: DocumentRecord; version: number };

/**
 * In-memory source corpus. The in-process index is the primary retrieval path
 * for V1 because it works with or without a configured database; an optional
 * Postgres mirror (see db/store.ts) persists the same records for durability.
 */
export class IntelCorpus {
  private docs = new Map<string, DocumentRecord>();
  private chunkMap = new Map<string, ChunkRecord>();

  size(): number {
    return this.docs.size;
  }

  get(id: string): DocumentRecord | undefined {
    return this.docs.get(id);
  }

  list(): DocumentRecord[] {
    return [...this.docs.values()];
  }

  allChunks(): ChunkRecord[] {
    return [...this.chunkMap.values()];
  }

  chunksFor(documentIdValue: string): ChunkRecord[] {
    return [...this.chunkMap.values()].filter(
      (c) => c.documentId === documentIdValue,
    );
  }

  /**
   * Ingest a document through the source→validate→extract→normalize→chunk→
   * index step of the pipeline. Duplicates are detected by the canonical id:
   * unchanged content is skipped, changed content bumps the version and
   * replaces the document + chunks.
   */
  ingest(input: IngestInput, now: number): IngestOutcome {
    const id =
      input.metadata && typeof input.metadata.canonicalId === "string"
        ? input.metadata.canonicalId
        : documentId({
            jurisdiction: input.jurisdiction,
            publisher: input.publisher,
            title: input.title,
            publicationDate: input.publicationDate,
          });

    const hash = contentHash(input.content);
    const existing = this.docs.get(id);

    if (existing && existing.contentHash === hash) {
      return { status: "skipped_duplicate", document: existing, version: existing.version };
    }

    const version = existing ? existing.version + 1 : 1;
    const document: DocumentRecord = {
      id,
      title: input.title,
      publisher: input.publisher,
      jurisdiction: input.jurisdiction,
      documentType: input.documentType,
      publicationDate: input.publicationDate,
      lastUpdated: input.lastUpdated,
      sourceUrl: input.sourceUrl,
      content: input.content,
      metadata: input.metadata,
      retrievedAt: new Date(now).toISOString(),
      version,
      contentHash: hash,
      fixture: input.fixture ?? false,
      devNote: input.devNote,
    };
    this.docs.set(id, document);

    const texts = chunkText(document.content);
    this.chunkMap.set(
      chunkId(id, 0),
      { id: chunkId(id, 0), documentId: id, index: 0, text: texts.length ? texts.join(" ") : document.content },
    );
    for (let i = 0; i < texts.length; i++) {
      this.chunkMap.set(chunkId(id, i), {
        id: chunkId(id, i),
        documentId: id,
        index: i,
        text: texts[i],
      });
    }

    return { status: version > 1 ? "updated" : "created", document, version };
  }

  /** Rebuild the in-memory index from persisted records (Postgres mirror). */
  hydrate(documents: DocumentRecord[], chunks: ChunkRecord[]): void {
    this.docs = new Map(documents.map((d) => [d.id, d]));
    this.chunkMap = new Map(chunks.map((c) => [c.id, c]));
  }
}