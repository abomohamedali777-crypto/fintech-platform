/**
 * Admin ingestion CLI — brings authoritative source documents into the
 * intelligence corpus without code edits.
 *
 *   npm run ingest                       # validate + ingest corpus/*.{txt,md}
 *   npm run ingest -- --dir ./corpus     # custom directory
 *   npm run ingest -- --dry-run          # validate only (no index, no persist)
 *   npm run ingest -- --persist          # also upsert into Postgres (needs DATABASE_URL)
 *
 * Exit codes: 0 ok, 1 rejected/invalid files (a data problem to fix), 2 fatal
 * (missing directory, missing DATABASE_URL while persisting, crashes).
 *
 * Files are validated as a gate (see corpus-files.ts): rejected files abort
 * the run with a non-zero exit so the command doubles as a deploy check.
 */
import { getDbPool, isDbConfigured } from "@/lib/db";
import { intelConfig } from "@/lib/intelligence/config";
import {
  loadCorpusDirectory,
  parseCorpusFile,
} from "@/lib/intelligence/corpus-files";
import { persistCorpusToDb } from "@/lib/intelligence/db/store";
import { runIngestion } from "@/lib/intelligence/ingest";
import { IntelCorpus } from "@/lib/intelligence/sources/corpus";
import type { SourceAdapter } from "@/lib/intelligence/sources/adapter";
import type { IngestInput } from "@/lib/intelligence/schema";

const USAGE = `Usage:
  tsx scripts/ingest.ts [--dir <path>] [--persist] [--dry-run] [--help]

  --dir <path>   source directory (default: ./corpus)
  --persist      upsert the ingested corpus into Postgres (needs DATABASE_URL + intel-schema.sql)
  --dry-run      validate files only and print the report without ingesting
  --help         show this help

See corpus/README.md for the file format.`;

interface Options {
  dir: string;
  persist: boolean;
  dryRun: boolean;
}

function parseArgs(argv: string[]): Options | "help" | "error" {
  const opts: Options = { dir: "./corpus", persist: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help") return "help";
    if (arg === "--persist") opts.persist = true;
    else if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--dir") {
      const next = argv[i + 1];
      if (!next) return "error";
      opts.dir = next;
      i++;
    } else return "error";
  }
  return opts;
}

async function main(): Promise<number> {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed === "help") {
    console.log(USAGE);
    return 0;
  }
  if (parsed === "error") {
    console.error("Unknown argument. Run with --help for usage.");
    return 2;
  }

  const config = intelConfig(process.env);

  let entries;
  try {
    entries = await loadCorpusDirectory(parsed.dir);
  } catch (err) {
    console.error(
      `[ingest] cannot read corpus directory "${parsed.dir}": ${err instanceof Error ? err.message : String(err)}`,
    );
    return 2;
  }
  console.log(`[ingest] found ${entries.length} candidate file(s) in ${parsed.dir}`);

  const candidates: IngestInput[] = [];
  const rejected: string[] = [];
  for (const entry of entries) {
    const r = parseCorpusFile(entry.raw);
    if (r.ok) {
      candidates.push(r.data);
      console.log(`  ok       ${entry.name}`);
    } else {
      rejected.push(`${entry.name}: ${r.reason} — ${r.detail ?? ""}`);
      console.log(`  REJECTED ${entry.name}: ${r.reason} — ${r.detail ?? ""}`);
    }
  }

  if (parsed.dryRun) {
    console.log(`[ingest] dry-run done — ${entries.length} file(s), ${rejected.length} rejected.`);
    return rejected.length > 0 ? 1 : 0;
  }

  if (rejected.length > 0) {
    console.error(`[ingest] aborting: fix the ${rejected.length} rejected file(s) before ingesting.`);
    return 1;
  }
  if (candidates.length === 0) {
    console.log("[ingest] nothing to ingest (corpus file(s) expected under corpus/).");
    return 0;
  }

  const corpus = new IntelCorpus();
  const adapter: SourceAdapter = {
    id: "corpus-dir",
    label: `files:${parsed.dir}`,
    fetchDocuments: async () => candidates,
  };

  const persist =
    parsed.persist || config.persistDb
      ? async (docs: Parameters<typeof persistCorpusToDb>[1], chunks: Parameters<typeof persistCorpusToDb>[2]) => {
          if (!isDbConfigured()) {
            throw new Error("DATABASE_URL is not configured — cannot persist.");
          }
          const pool = getDbPool();
          if (!pool) throw new Error("DATABASE_URL is not configured — cannot persist.");
          await persistCorpusToDb(pool, docs, chunks);
        }
      : undefined;

  const report = await runIngestion(adapter, corpus, { persist });

  console.log(
    `[ingest] ${report.adapterId}: attempted=${report.attempted} created=${report.created} updated=${report.updated} skipped=${report.skipped} rejected=${report.rejected}`,
  );
  for (const error of report.errors) {
    console.error(`[ingest] error: ${error}`);
  }
  if (persist && report.errors.length === 0) {
    console.log(`[ingest] persisted ${corpus.size()} document(s) to Postgres (intel_documents/intel_chunks).`);
  }

  return report.errors.length > 0 ? 1 : 0;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((err) => {
    console.error(`[ingest] fatal: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 2;
  });