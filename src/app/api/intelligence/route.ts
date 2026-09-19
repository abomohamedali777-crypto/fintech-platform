import { NextRequest, NextResponse } from "next/server";
import {
  intelConfig,
  intelConfigWarnings,
  intelEnforceStrictProdGuard,
} from "@/lib/intelligence/config";
import { handleIntelRequest } from "@/lib/intelligence/pipeline";
import { getIntelCorpus, intelSeedingPromise } from "@/lib/intelligence/sources/default";
import { LruQueryCache } from "@/lib/intelligence/cache";
import { createProvider } from "@/lib/intelligence/generation/provider";

// Surface misconfiguration immediately — but never crash tests. With
// STRICT_PROD_GUARD=1 a misconfigured deploy fails fast at import time.
const warnings = intelConfigWarnings();
if (process.env.NODE_ENV === "production") {
  intelEnforceStrictProdGuard(warnings);
  for (const w of warnings) console.warn(w);
}

const config = intelConfig();
const cache = new LruQueryCache(config.cacheMax, config.cacheTtlMs);
const provider = createProvider(config);

export async function POST(request: NextRequest) {
  // Warm the (already synchronously seeded) fixture corpus so the durable
  // mirror, if configured, catches up in the background.
  void intelSeedingPromise();

  const result = await handleIntelRequest(request, {
    corpus: getIntelCorpus(),
    config,
    cache,
    provider,
  });

  return NextResponse.json(result.json, {
    status: result.status,
    headers: result.headers,
  });
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      // Same-origin only; a restrictive allowlist is correct.
      "Access-Control-Allow-Origin": "",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "600",
      "Cache-Control": "no-store",
    },
  });
}