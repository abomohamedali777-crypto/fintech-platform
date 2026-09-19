import { readdir, readFile } from "node:fs/promises";
import { join, parse } from "node:path";
import {
  parseIngestInput,
  type IngestInput,
} from "@/lib/intelligence/schema";

/**
 * Plain-file corpus ingestion for the admin CLI (scripts/ingest.ts). Not part
 * of the request path — the API route never imports this module, so Node's
 * fs APIs stay out of the serverless bundle.
 *
 * File format (UTF-8, .txt or .md):
 *
 *   ---
 *   title: Federal Decree-Law No. 14 of 2018 …
 *   publisher: Central Bank of the UAE
 *   jurisdiction: uae            # optional, defaults to uae
 *   documentType: legislation
 *   publicationDate: 2018
 *   sourceUrl: https://www.…/…
 *   lastUpdated: 2024-01-02      # optional
 *   canonicalId: uae-cbuae-dl14  # optional stable id (dedupe + re-version key)
 *   ---
 *
 *   <then the authoritative text>
 *
 * The loader deliberately skips filenames starting with `_` (templates,
 * notes) and README files so helper files can live beside the corpus.
 */

const FRONT_MATTER_LINE = "---";

const KNOWN_KEYS = new Set([
  "title",
  "publisher",
  "jurisdiction",
  "documentType",
  "publicationDate",
  "sourceUrl",
  "lastUpdated",
  "canonicalId",
]);

const REQUIRED_KEYS = [
  "title",
  "publisher",
  "documentType",
  "publicationDate",
  "sourceUrl",
] as const;

const MIN_FRONT_MATTER_BYTES = 4;

export type CorpusFileResult =
  | { ok: true; data: IngestInput }
  | {
      ok: false;
      reason:
        | "no_front_matter"
        | "empty_content"
        | "content_too_short"
        | "unknown_field"
        | "missing_fields"
        | "invalid_value";
      detail?: string;
    };

function splitFrontMatter(raw: string): { meta: string | null; content: string } {
  const normalized = raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  if (normalized.startsWith(FRONT_MATTER_LINE + "\n")) {
    const end = normalized.indexOf("\n" + FRONT_MATTER_LINE + "\n");
    if (end > -1) {
      const meta = normalized.slice(0, end).slice(FRONT_MATTER_LINE.length + 1);
      const content = normalized.slice(end + FRONT_MATTER_LINE.length + 2);
      return { meta: meta.trim(), content };
    }
    return { meta: normalized.slice(FRONT_MATTER_LINE.length + 1), content: "" };
  }
  return { meta: null, content: normalized };
}

export function parseCorpusFile(raw: string): CorpusFileResult {
  const { meta, content } = splitFrontMatter(raw);
  if (!meta) {
    return {
      ok: false,
      reason: "no_front_matter",
      detail: "File must start with --- front matter (title, publisher, sourceUrl, …).",
    };
  }
  if (meta.length < MIN_FRONT_MATTER_BYTES) {
    return { ok: false, reason: "no_front_matter", detail: "Front matter is empty." };
  }

  const fields: Record<string, string> = {};
  for (const line of meta.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const colon = trimmed.indexOf(":");
    if (colon < 1) {
      return { ok: false, reason: "invalid_value", detail: `Unparseable front-matter line: "${line}".` };
    }
    const key = trimmed.slice(0, colon).trim();
    const value = trimmed.slice(colon + 1).trim();
    if (!KNOWN_KEYS.has(key)) {
      return { ok: false, reason: "unknown_field", detail: `Unknown field "${key}".` };
    }
    fields[key] = value;
  }

  const missing = REQUIRED_KEYS.filter((k) => !fields[k]);
  if (missing.length > 0) {
    return {
      ok: false,
      reason: "missing_fields",
      detail: `Missing fields: ${missing.join(", ")}.`,
    };
  }

  const contentTrimmed = content.trim();
  if (!contentTrimmed) {
    return { ok: false, reason: "empty_content", detail: "No document text after the front matter." };
  }
  if (contentTrimmed.length < 80) {
    return {
      ok: false,
      reason: "content_too_short",
      detail: `Content must be at least 80 characters (got ${contentTrimmed.length}).`,
    };
  }

  const canonicalId = fields.canonicalId?.trim();
  const candidate: IngestInput = {
    title: fields.title!,
    publisher: fields.publisher!,
    jurisdiction: (fields.jurisdiction?.trim() || "uae") as IngestInput["jurisdiction"],
    documentType: fields.documentType as IngestInput["documentType"],
    publicationDate: fields.publicationDate!,
    sourceUrl: fields.sourceUrl!,
    lastUpdated: fields.lastUpdated?.trim() || undefined,
    content: contentTrimmed,
    metadata: canonicalId ? { canonicalId } : undefined,
    fixture: false,
  };

  const parsed = parseIngestInput(candidate);
  if (!parsed.ok) {
    return {
      ok: false,
      reason: "invalid_value",
      detail: `Fields fail schema validation (check documentType ∈ legislation|regulation|guidance|resolution|framework, a URL-shaped sourceUrl, 4-24 char publicationDate, title 4-300 chars, publisher 3-200 chars).`,
    };
  }
  return { ok: true, data: parsed.data };
}

export interface CorpusFileEntry {
  name: string;
  raw: string;
}

function isCandidateFile(name: string): boolean {
  if (name.startsWith("_")) return false;
  if (/^README(\..*)?$/i.test(name)) return false;
  const ext = parse(name).ext.toLowerCase();
  return ext === ".txt" || ext === ".md";
}

/**
 * Load *.txt / *.md from a directory (skipping `_`-prefixed helper files and
 * READMEs) in stable filename order. Throws if the directory is missing.
 */
export async function loadCorpusDirectory(dir: string): Promise<CorpusFileEntry[]> {
  const names = await readdir(dir);
  const files = names.filter(isCandidateFile).sort();
  const entries: CorpusFileEntry[] = [];
  for (const name of files) {
    const raw = await readFile(join(dir, name), "utf8");
    entries.push({ name, raw });
  }
  return entries;
}