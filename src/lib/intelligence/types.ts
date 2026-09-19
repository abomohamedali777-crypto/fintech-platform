export type JurisdictionCode = "uae";

export const JURISDICTIONS: readonly JurisdictionCode[] = ["uae"] as const;

/**
 * The intelligence modules are domain-tagged so legal, regulatory, financial,
 * compliance, and risk modules can each attach to the same jurisdiction /
 * source / retrieval / citation core without a rewrite.
 */
export type Domain = "auto" | "regulatory" | "legal";

export type DocumentType =
  | "legislation"
  | "regulation"
  | "guidance"
  | "resolution"
  | "framework";

export interface DocumentRecord {
  id: string;
  title: string;
  publisher: string;
  jurisdiction: string;
  documentType: DocumentType;
  publicationDate: string;
  lastUpdated?: string;
  sourceUrl: string;
  content: string;
  metadata?: Record<string, unknown>;
  retrievedAt: string;
  version: number;
  contentHash: string;
  fixture: boolean;
  devNote?: string;
}

export interface ChunkRecord {
  id: string;
  documentId: string;
  index: number;
  text: string;
}

export interface RetrievedPassage {
  document: DocumentRecord;
  chunk: ChunkRecord;
  score: number;
}

export type Sufficiency = "sufficient" | "limited" | "insufficient";

export interface CitationSource {
  ref: string;
  id: string;
  title: string;
  publisher: string;
  jurisdiction: string;
  documentType: DocumentType;
  publicationDate: string;
  sourceUrl: string;
  fixture: boolean;
}

export interface Consideration {
  refs: string[];
  text: string;
}

export interface IntelAnswer {
  summary: string;
  considerations: Consideration[];
  jurisdiction: string;
  domain: string;
  sufficiency: Sufficiency;
  caveats: string[];
}

export type ProviderKind = "none" | "openai-compatible";
export type ProviderStatus = "disabled" | "ok" | "failed";

export interface IntelMeta {
  requestId: string;
  jurisdiction: string;
  domain: string;
  retrievalCount: number;
  corpusCount: number;
  providerKind: ProviderKind;
  providerStatus: ProviderStatus;
  simulated: boolean;
  cached: boolean;
  latencyMs: number;
}

export interface IntelResponse {
  question: string;
  answer: IntelAnswer;
  citations: CitationSource[];
  meta: IntelMeta;
}