import type { CitationSource, DocumentRecord } from "@/lib/intelligence/types";

/**
 * Citation index built from a retrieved document set. Citations are numbered
 * in order of first appearance and every source surfaced in the answer must
 * be resolvable back to an official-source entry in `citations`.
 */
export interface CitationIndex {
  citations: CitationSource[];
  refsFor(documentId: string): string;
  refsForMany(documentIds: string[]): string[];
}

export function buildCitations(documents: DocumentRecord[]): CitationIndex {
  const seen = new Map<string, CitationSource>();
  const order: string[] = [];

  for (const doc of documents) {
    if (seen.has(doc.id)) continue;
    seen.set(doc.id, {
      ref: `[${order.length + 1}]`,
      id: doc.id,
      title: doc.title,
      publisher: doc.publisher,
      jurisdiction: doc.jurisdiction,
      documentType: doc.documentType,
      publicationDate: doc.publicationDate,
      sourceUrl: doc.sourceUrl,
      fixture: doc.fixture,
    });
    order.push(doc.id);
  }

  const map = new Map<string, string>();
  order.forEach((id, i) => map.set(id, `[${i + 1}]`));

  const citations = order.map((id) => seen.get(id)!);

  return {
    citations,
    refsFor(documentId: string): string {
      return map.get(documentId) ?? "";
    },
    refsForMany(documentIds: string[]): string[] {
      return documentIds
        .map((id) => map.get(id))
        .filter((ref): ref is string => Boolean(ref));
    },
  };
}