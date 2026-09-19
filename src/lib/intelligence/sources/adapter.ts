import type { IngestInput } from "@/lib/intelligence/schema";

/**
 * A source adapter is the plug point between an approved institutional source
 * and the ingestion pipeline. Each jurisdiction is expected to register one or
 * more adapters (a government regulator, a legislation portal, an official
 * guidance feed, …). V1 ships a single built-in **development fixture** adapter
 * for the UAE; live adapters (real fetch/validate/extract) are documented in
 * INTELLIGENCE.md — the interface does not change when they are added.
 *
 * Adapters MUST return authoritative, verified content. The engine treats
 * everything an adapter returns as a candidate for the corpus; fixtures are
 * individually flagged `fixture: true` so the UI and citation layer can label
 * them honestly.
 */
export interface SourceAdapter {
  id: string;
  label: string;
  fetchDocuments(): Promise<IngestInput[]>;
}

export type { IngestInput } from "@/lib/intelligence/schema";