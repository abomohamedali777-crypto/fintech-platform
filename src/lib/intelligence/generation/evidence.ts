import type { IntelAnswer, RetrievedPassage } from "@/lib/intelligence/types";

/**
 * Short human-readable grounding text for the evidence bar in the console
 * UI. Derived purely from what actually happened in the pipeline.
 */
export function evidenceGroundingLabel(
  passages: RetrievedPassage[],
  answer: IntelAnswer,
): string {
  const passageCount = passages.length;
  if (passageCount === 0) return "No primary source matched";
  return `Grounded in ${passageCount} passage${passageCount === 1 ? "" : "s"} · ${passageCount >= 2 ? "sufficient evidence" : answer.sufficiency === "limited" ? "limited evidence" : "thin evidence"}`;
}