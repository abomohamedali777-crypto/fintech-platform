import type { DocumentRecord } from "@/lib/intelligence/types";
import { absoluteClaimPhrase } from "./prompts";

export const MAX_REFERRED_SOURCES = 4;

export interface NormalizedConsideration {
  text: string;
  refs: string[]; // document ids, resolved — never raw provider ids
}

export interface NormalizedAnswer {
  summary: string;
  considerations: NormalizedConsideration[];
  absoluteClaim: string | null;
}

function toString(value: unknown): string | null {
  return typeof value === "string" ? value.trim() : null;
}

/**
 * Strict JSON parse with a bounded attempt. Provider output is untrusted, so
 * anything that is not `{summary: string, considerations: [...]}` is rejected.
 */
export function parseJsonStrict(raw: string): unknown | null {
  const text = raw.trim();
  if (!text.startsWith("{")) return null;
  try {
    const parsed = JSON.parse(text) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Normalize (and trust-bound) the LLM response:
 * - shape must match the schema,
 * - "ids" must resolve to documents that were actually retrieved; unknown ids
 *   are dropped (hallucination guard),
 * - considerations with zero surviving ids are dropped,
 * - a summary is required; otherwise the whole response is rejected (null).
 */
export function normalizeProviderOutput(
  raw: string,
  documents: DocumentRecord[],
): NormalizedAnswer | null {
  const parsed = parseJsonStrict(raw);
  if (!parsed) return null;

  const record = parsed as { summary?: unknown; considerations?: unknown };
  const summary = toString(record.summary);
  if (!summary || summary.length < 20) return null;

  const validIds = new Set(documents.map((d) => d.id));

  const considerations: NormalizedConsideration[] = [];
  let providedConsiderations = 0;
  if (Array.isArray(record.considerations)) {
    for (const entry of record.considerations.slice(0, 4)) {
      if (typeof entry !== "object" || entry === null) continue;
      providedConsiderations += 1;
      const { text: rawText, ids } = entry as { text?: unknown; ids?: unknown };
      const text = toString(rawText);
      if (!text || text.length < 20) continue;
      const refs =
        Array.isArray(ids) && ids.length > 0
          ? [...new Set(ids.filter((id): id is string => typeof id === "string"))].filter((id) =>
              validIds.has(id),
            )
          : [];
      if (refs.length === 0) continue;
      considerations.push({ text, refs: refs.slice(0, MAX_REFERRED_SOURCES) });
    }
  }

  // Hallucination guard, strict: if the provider offered considerations but
  // none of their sources survive validation, the response is not trustworthy
  // enough to surface — reject it and let the caller fall back to the
  // deterministic extraction path.
  if (providedConsiderations > 0 && considerations.length === 0) {
    return null;
  }

  const combined = `${summary} ${considerations.map((c) => c.text).join(" ")}`;
  return { summary, considerations, absoluteClaim: absoluteClaimPhrase(combined) };
}

/** Best-effort JSON delimiters: sometimes a provider wraps JSON in fences. */
export function extractJsonPayload(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (fenced) return fenced[1];
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start >= 0 && end > start) return raw.slice(start, end + 1);
  return raw;
}

export function normalizeProviderOutputWithPayload(
  raw: string,
  documents: DocumentRecord[],
): NormalizedAnswer | null {
  return normalizeProviderOutput(extractJsonPayload(raw), documents);
}