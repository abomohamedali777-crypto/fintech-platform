import type { IntelCorpus } from "@/lib/intelligence/sources/corpus";
import type { DocumentRecord, RetrievedPassage } from "@/lib/intelligence/types";
import {
  bm25Score,
  buildDocStats,
  recencyBoost,
  termFreq,
  titleOverlap,
  tokenize,
  typeBoost,
  type DocStats,
} from "./ranking";

export interface RetrieveFilters {
  jurisdiction?: string;
  documentType?: string;
}

export interface RetrieveOptions {
  topK: number;
  contextMaxChars: number;
}

function chunkMatchScore(
  queryTokens: Map<string, number>,
  chunkTokens: string[],
): number {
  const bag = termFreq(chunkTokens);
  let score = 0;
  for (const [term, qtf] of queryTokens) {
    score += (bag.get(term) ?? 0) * qtf;
  }
  return score;
}

export type RankedDoc = { doc: DocumentRecord; score: number };

/**
 * Score every matching document with BM25 plus jury-rows and filters:
 * beyond lexical relevance we consider recency, document-type weight, and
 * title overlap. We then select the strongest chunk(s) per document so the
 * context handed to the answer stage stays bounded (topK passages and a hard
 * character budget).
 */
export function rankDocuments(
  corpus: IntelCorpus,
  query: string,
  stats: DocStats,
  filters: RetrieveFilters,
  now: number,
): RankedDoc[] {
  const qBag = termFreq(tokenize(query));
  const docs = corpus.list().filter(
    (d) =>
      (!filters.jurisdiction || d.jurisdiction === filters.jurisdiction) &&
      (!filters.documentType || d.documentType === filters.documentType),
  );
  if (docs.length === 0) return [];

  return docs
    .map((doc) => {
      const docTokens = tokenize(`${doc.title} ${doc.content}`);
      const base = bm25Score(qBag, docTokens, stats);
      if (base <= 0) return null;
      const score =
        base * (1 + 0.6 * titleOverlap(tokenize(query), doc.title)) * recencyBoost(doc, now) * typeBoost(doc);
      return { doc, score } satisfies RankedDoc;
    })
    .filter((x): x is RankedDoc => x !== null)
    .sort((a, b) => b.score - a.score);
}

export function retrieve(
  corpus: IntelCorpus,
  query: string,
  filters: RetrieveFilters,
  options: RetrieveOptions,
  now: number,
): RetrievedPassage[] {
  const qBag = termFreq(tokenize(query));
  if (qBag.size === 0) return [];

  const stats = buildDocStats(corpus.list().filter(
    (d) =>
      (!filters.jurisdiction || d.jurisdiction === filters.jurisdiction) &&
      (!filters.documentType || d.documentType === filters.documentType),
  ));
  const ranked = rankDocuments(corpus, query, stats, filters, now);
  if (ranked.length === 0) return [];

  const out: RetrievedPassage[] = [];
  let budget = 0;

  for (const { doc, score } of ranked) {
    if (out.length >= options.topK) break;
    const chunks = corpus
      .chunksFor(doc.id)
      .map((chunk) => ({ chunk, cs: chunkMatchScore(qBag, tokenize(chunk.text)) }))
      .filter((c) => c.cs > 0)
      .sort((a, b) => b.cs - a.cs);
    if (chunks.length === 0) continue;

    let perDoc = 0;
    for (const { chunk, cs } of chunks) {
      if (perDoc >= 2) break;
      if (out.length > 0 && budget + chunk.text.length > options.contextMaxChars) break;
      out.push({ document: doc, chunk, score: score * (1 + cs) });
      budget += chunk.text.length;
      perDoc += 1;
      if (out.length >= options.topK) break;
    }
  }

  return out;
}