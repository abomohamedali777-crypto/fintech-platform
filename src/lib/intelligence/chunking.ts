export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Split text into word-packed chunks no larger than `maxChars`. Single
 * un-splittable tokens (long URLs, hashes) are kept whole. Language-agnostic
 * since splitting happens at whitespace boundaries only.
 */
export function chunkText(
  text: string,
  maxChars = 700,
): string[] {
  const normalized = normalizeWhitespace(text);
  if (normalized === "") return [];
  const words = normalized.split(" ");
  const chunks: string[] = [];
  let current: string[] = [];
  let currentLen = 0;

  for (const word of words) {
    if (word.length > maxChars) {
      if (current.length) {
        chunks.push(current.join(" "));
        current = [];
        currentLen = 0;
      }
      chunks.push(word);
      continue;
    }

    const add = current.length ? 1 + word.length : word.length;
    if (currentLen + add > maxChars && current.length) {
      chunks.push(current.join(" "));
      current = [];
      currentLen = 0;
    }
    current.push(word);
    currentLen += add;
  }

  if (current.length) chunks.push(current.join(" "));
  return chunks;
}