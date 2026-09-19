import { getDbPool, isDbConfigured } from "@/lib/db";
import { intelConfig } from "@/lib/intelligence/config";
import { intelLog } from "@/lib/intelligence/logging";
import { parseIngestInput } from "@/lib/intelligence/schema";
import { loadCorpusFromDb, persistCorpusToDb } from "@/lib/intelligence/db/store";
import { IntelCorpus } from "./corpus";
import { uaeFixtureDocuments } from "./fixtures/uae";

let defaultCorpus: IntelCorpus | null = null;
let seeding: Promise<void> | null = null;

/**
 * Lazy-singleton corpus for the API route.
 *
 * V1 seeds synchronously from the built-in UAE development fixtures so the
 * cheat-sheet path is deterministic on the very first request. When
 * INTEL_PERSIST_DB=1 and a Postgres/Supabase database is configured, the
 * durable mirror is loaded in the background (newer documents replace stale
 * in-memory records) and the corpus is written back after seeding.
 *
 * Tests construct their own IntelCorpus and never rely on this singleton.
 */
export function getIntelCorpus(env: NodeJS.ProcessEnv = process.env): IntelCorpus {
  if (!defaultCorpus) {
    const corpus = new IntelCorpus();
    const config = intelConfig(env);
    for (const candidate of uaeFixtureDocuments) {
      const parsed = parseIngestInput(candidate);
      if (parsed.ok) corpus.ingest(parsed.data, Date.now());
    }
    defaultCorpus = corpus;

    const pool = config.persistDb ? getDbPool() : undefined;
    if (pool) {
      seeding = (async () => {
        if (!(await isDbConfigured())) return;
        try {
          const { documents, chunks } = await loadCorpusFromDb(pool);
          corpus.hydrate(documents, chunks);
          intelLog("info", "corpus_hydrated", {
            documents: documents.length,
            chunks: chunks.length,
          });
        } catch (err) {
          intelLog("warn", "corpus_db_load_failed", {
            error: err instanceof Error ? err.message : String(err),
          });
        }
        for (const candidate of uaeFixtureDocuments) {
          const parsed = parseIngestInput(candidate);
          if (parsed.ok) corpus.ingest(parsed.data, Date.now());
        }
        try {
          await persistCorpusToDb(pool, corpus.list(), corpus.allChunks());
        } catch (err) {
          intelLog("warn", "corpus_db_persist_failed", {
            error: err instanceof Error ? err.message : String(err),
          });
        }
      })();
    }
  }
  return defaultCorpus;
}

export function resetIntelCorpusForTests(): void {
  defaultCorpus = null;
  seeding = null;
}

export function intelSeedingPromise(): Promise<void> | null {
  return seeding;
}