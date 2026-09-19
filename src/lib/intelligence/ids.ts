import { createHash } from "node:crypto";

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function contentHash(content: string): string {
  return sha256Hex(content.trim());
}

/**
 * Stable canonical identifier for a document. Two identical document records
 * (same jurisdiction, publisher, title, publication date) always produce the
 * same id, which is what makes duplicates detectable across ingestion runs.
 */
export function documentId(input: {
  jurisdiction: string;
  publisher: string;
  title: string;
  publicationDate: string;
}): string {
  const identity = [input.jurisdiction, input.publisher, input.title, input.publicationDate].join("|");
  return `doc_${sha256Hex(identity).slice(0, 24)}`;
}

export function chunkId(documentIdValue: string, index: number): string {
  return `${documentIdValue}#${index}`;
}

/**
 * Cache key for a normalized query + filters. Stored server-side only; the
 * value is only ever used as a lookup key, never exposed to clients.
 */
export function queryKey(question: string, jurisdiction: string, domain: string): string {
  return sha256Hex([question.trim().toLowerCase(), jurisdiction, domain].join("::"));
}