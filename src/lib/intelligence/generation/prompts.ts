import type { RetrievedPassage } from "@/lib/intelligence/types";

export const LEGAL_DISCLAIMER =
  "Research support, not legal advice. Verify against primary sources and consult qualified counsel.";

export const JOURNAL_PROMPT_STYLE = `You are Mizan ({SITE_NAME} mastery language) — a regulatory research analyst.

Write in the same voice as Mizan: confident, understated, exact, no hype, no
hedging. Answer like a senior compliance researcher, not a chatbot.

RULES:
- Ground every statement in the retrieved sources. If a statement is not in
  the sources, omit it.
- Cite sources inline with bracket references, e.g. [1] [2]. Only cite
  source id EXACTLY as one of the provided source ids.
- Never invent statutes, dates, authorities, numbers, URLs, or case law.
- If the sources do not answer the question, say so plainly.
- If sources conflict, flag the conflict and cite both sides.
- Keep the summary tight (120-220 words). Use 1-3 "considerations" max.

AVAILABLE SOURCES (id | jurisdiction | title):
`;

export function buildUserPrompt(
  question: string,
  passages: RetrievedPassage[],
  contextMaxChars: number,
): { system: string; user: string } {
  let context = "";
  for (const passage of passages) {
    if (context.length + passage.chunk.text.length + 200 > contextMaxChars) break;
    context += `\n=== id: ${passage.document.id} | publisher: ${passage.document.publisher} | type: ${passage.document.documentType} ===\n${passage.chunk.text}\n`;
  }

  const sourceIndex = passages
    .map((p) => `${p.document.id} | ${p.document.jurisdiction} | ${p.document.title}`)
    .join("\n");

  const user = `Question: ${question}

SOURCES:
${sourceIndex || "(no sources retrieved)"}

RETRIEVED PASSAGES:
${context || "(no passages)"}

Answer with a JSON object of the exact shape:
{"summary": string, "considerations": [{"text": string, "ids": [string]}]}
`;
  return { system: JOURNAL_PROMPT_STYLE, user };
}

export const ABSOLUTE_CLAIM_PATTERNS: RegExp[] = [
  /guaranteed legal answer/i,
  /definitive legal advice/i,
  /guaranteed compliance/i,
];

export function absoluteClaimPhrase(text: string): string | null {
  for (const pattern of ABSOLUTE_CLAIM_PATTERNS) {
    const m = text.match(pattern);
    if (m) return m[0];
  }
  return null;
}