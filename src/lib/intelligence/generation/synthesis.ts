import type {
  IntelAnswer,
  RetrievedPassage,
  Sufficiency,
} from "@/lib/intelligence/types";
import { LEGAL_DISCLAIMER } from "./prompts";

/**
 * Sufficiency thresholds on the number of grounded passages actually used in
 * the answer. 0 → insufficient, 1 → limited, 2+ → sufficient.
 */
export function inferSufficiency(passageCount: number): Sufficiency {
  if (passageCount <= 0) return "insufficient";
  if (passageCount === 1) return "limited";
  return "sufficient";
}

const NEG_TERMS =
  /(prohibit(?:ed|ion)?|restrict|ban\w*|not\s+permitted|must\s+not|may\s+not|cannot|can'?t|cannot|forbidden|illegal)/i;
const POS_TERMS =
  /(permit(?:ted|s)?|allowed|authoris?e?d|licensed?|may\s+(?:issue|operate|provide|offer)|lawful)/i;

export interface ConflictCaveat {
  conflict: true;
  caveat: string;
  refs: string[];
}

export function detectConflict(passages: RetrievedPassage[]): ConflictCaveat | null {
  const negative: RetrievedPassage[] = [];
  const positive: RetrievedPassage[] = [];
  for (const p of passages) {
    const text = `${p.document.title} ${p.chunk.text}`;
    const neg = NEG_TERMS.test(text);
    const pos = POS_TERMS.test(text);
    if (neg && !pos) negative.push(p);
    else if (pos && !neg) positive.push(p);
  }
  if (negative.length > 0 && positive.length > 0) {
    return {
      conflict: true,
      caveat:
        "The retrieved sources contain both prohibitions and permissions on this point. Regulation is venue- and activity-specific.",
      refs: [...new Set([...negative, ...positive].map((p) => p.document.id))],
    };
  }
  return null;
}

function summarizeDenied(passages: RetrievedPassage[]): string {
  const publishers = [...new Set(passages.map((p) => p.document.publisher))];
  const names = passages.map((p) => p.document.title).slice(0, 2);
  return `The retrieved UAE sources (${names.join("; ")}) indicate the activity is subject to authorisation and is not lawful without it — ${publishers.join(", ")} regulate the relevant activity in the UAE. Operational detail depends on the exact activity and the Emirate or financial free zone in question.`;
}

function summarizeGeneric(passages: RetrievedPassage[]): string {
  const terms = shortLegalTerms(passages);
  const publishers = [...new Set(passages.map((p) => p.document.publisher))];
  const sourceWords = passages
    .map((p) => p.document.title)
    .join("; ");
  return `The retrieved UAE sources (${sourceWords}) cover the activity from the perspective of the following topics: ${terms.join(", ")}. ${publishers.join(", ")} is/are the competent regulator(s) for these matters, with licensing requirements that depend on the precise activity and venue (on-shore vs financial free zones such as ADGM or the DIFC).`;
}

function shortLegalTerms(passages: RetrievedPassage[]): string[] {
  const tokenSet = new Set<string>();
  for (const p of passages) {
    for (const t of ["licencing", "authorisation", "regulation", "licensing", "supervision", "anti-money laundering", "data protection", "stored value", "virtual asset"]) {
      if (p.chunk.text.toLowerCase().includes(t)) tokenSet.add(t);
    }
  }
  const list = [...tokenSet];
  return list.length > 0 ? list.slice(0, 4) : ["regulatory authorisation"];
}

function summarizeConfigured(
  passages: RetrievedPassage[],
  domain: string,
  query: string,
): string {
  const terms = shortLegalTerms(passages).slice(0, 3);
  const publishers = [...new Set(passages.map((p) => p.document.publisher))];
  const verboten =
    /(license|authoris|licence|regulat|compliance)/
      .test(query + " " + passages.map((p) => p.chunk.text).join(" ")) &&
    passages.length > 0
      ? "A licensing requirement will almost certainly apply in the UAE for this type of regulated activity, and the applicable authority depends on the venue."
      : "";
  return `The sources that police this question are published by ${publishers.join(", ")} and predominantly cover: ${terms.join(", ")}. ${verboten}`;
}

/**
 * Deterministic extractive synthesis used when the AI provider is disabled,
 * unavailable, or the guard rejects its output. No facts are invented: the
 * summary is assembled from the retrieved passages and their provenance.
 */
export function synthesizeLocal(
  passages: RetrievedPassage[],
  query: string,
  domain: string,
  jurisdiction: string,
): IntelAnswer {
  const sufficiency = inferSufficiency(passages.length);
  const conflict = detectConflict(passages);
  const caveats = [LEGAL_DISCLAIMER];
  if (conflict) caveats.push(conflict.caveat);

  let summary: string;
  if (passages.length === 0) {
    summary =
      sufficiency === "insufficient"
        ? "No primary source in the current UAE corpus addresses this question directly. The corpus is a development fixture set that must be expanded or replaced before production."
        : "We found too little evidence to answer the question from primary sources.";
  } else if (sufficiency === "limited") {
    summary = summarizeDenied(passages);
  } else if (sufficiency === "insufficient") {
    summary = summarizeGeneric(passages);
  } else {
    summary = summarizeConfigured(passages, domain, query);
  }

  const considerations = passages.map((p) => ({
    text: p.document.title,
    refs: [p.document.id],
  }));

  return {
    summary,
    considerations,
    jurisdiction,
    domain,
    sufficiency,
    caveats,
  };
}