import type { DocumentRecord } from "@/lib/intelligence/types";

export interface DocStats {
  totalDocs: number;
  avgDocLen: number;
  docsWithToken: Map<string, number>;
}

export type Bm25Params = { k1: number; b: number };

export const DEFAULT_BM25_PARAMS: Bm25Params = { k1: 1.2, b: 0.75 };

const SPLIT_RE = /[\p{L}\p{N}]+/gu;

export function tokenize(text: string): string[] {
  return text.toLowerCase().match(SPLIT_RE) ?? [];
}

export function termFreq(tokens: string[]): Map<string, number> {
  const bag = new Map<string, number>();
  for (const t of tokens) bag.set(t, (bag.get(t) ?? 0) + 1);
  return bag;
}

export function buildDocStats(docs: DocumentRecord[]): DocStats {
  const docsWithToken = new Map<string, number>();
  let totalTokens = 0;
  for (const doc of docs) {
    const tokens = tokenize(`${doc.title} ${doc.content}`);
    totalTokens += tokens.length;
    for (const t of new Set(tokens)) {
      docsWithToken.set(t, (docsWithToken.get(t) ?? 0) + 1);
    }
  }
  return {
    totalDocs: docs.length,
    avgDocLen: docs.length > 0 ? totalTokens / docs.length : 1,
    docsWithToken,
  };
}

export function bm25Score(
  queryTokens: Map<string, number>,
  docTokens: string[],
  stats: DocStats,
  params: Bm25Params = DEFAULT_BM25_PARAMS,
): number {
  const docLen = docTokens.length;
  if (docLen === 0) return 0;
  const bag = termFreq(docTokens);
  const avg = stats.avgDocLen || 1;
  let score = 0;
  for (const [term, qtf] of queryTokens) {
    const tf = bag.get(term) ?? 0;
    if (tf === 0) continue;
    const n = stats.docsWithToken.get(term) ?? 0;
    const idf = Math.log(1 + (stats.totalDocs - n + 0.5) / (n + 0.5));
    const denom = tf + params.k1 * (1 - params.b + params.b * (docLen / avg));
    score += idf * ((tf * (params.k1 + 1)) / denom) * qtf;
  }
  return score;
}

export function titleOverlap(queryTokens: string[], title: string): number {
  if (queryTokens.length === 0) return 0;
  const titleTokens = new Set(tokenize(title));
  let hits = 0;
  for (const t of queryTokens) if (titleTokens.has(t)) hits += 1;
  return hits / queryTokens.length;
}

export function recencyBoost(document: DocumentRecord, now: number): number {
  const year = Number(document.publicationDate.slice(0, 4));
  if (!Number.isFinite(year)) return 1;
  const age = Math.max(0, new Date(now).getFullYear() - year);
  return Math.max(0.7, 1 - age / 25);
}

export function typeBoost(document: DocumentRecord): number {
  switch (document.documentType) {
    case "legislation":
      return 1.12;
    case "regulation":
      return 1.07;
    case "resolution":
      return 1.05;
    default:
      return 1;
  }
}