# Mizan Intelligence Engine

Source-grounded Legal & Regulatory intelligence for the Mizan platform.
**UAE first** (retrieval, citations, and the development corpus are UAE), built
to extend to other jurisdictions via the same adapter interface.

Working principle: **an answer is only as good as the source it is standing on.**
The engine never answers from the model's memory alone — every answer is
retrieved over a corpus of primary documents and cited back to them. If a
question cannot be supported by the corpus, the engine says so explicitly.

- **API:** `POST /api/intelligence`
- **Console UI:** the "01 · Live Intelligence Engine" section on the homepage
- **Status:** V1, `fixture` corpus. **Not production-ready until the corpus is
  replaced by authoritative ingestion.**

---

## 1. Request / response

```http
POST /api/intelligence
Content-Type: application/json
Origin: https://mizan.vercel.app
Authorization: Bearer <token>   # only if INTEL_TOKEN is set

{ "question": "What licence does a virtual asset service provider need in Dubai?",
  "jurisdiction": "uae",   // or "auto" (default)
  "domain": "auto" }       // or "regulatory" | "legal"
```

```json
{
  "question": "...",
  "answer": {
    "summary": "…",
    "considerations": [{ "text": "…", "refs": ["[1]", "[2]"] }],
    "jurisdiction": "uae",
    "domain": "regulatory",
    "sufficiency": "sufficient",   // sufficient | limited | insufficient
    "caveats": ["Research support, not legal advice. Verify against primary sources and consult qualified counsel."]
  },
  "citations": [
    { "ref": "[1]", "id": "doc_…",
      "title": "Federal Decree-Law No. 14 of 2018 …", "publisher": "Central Bank of the UAE",
      "jurisdiction": "uae", "documentType": "legislation",
      "publicationDate": "2018", "sourceUrl": "https://www.centralbank.ae",
      "fixture": true }
  ],
  "meta": {
    "requestId": "…", "jurisdiction": "uae", "domain": "regulatory",
    "retrievalCount": 4, "corpusCount": 11,
    "providerKind": "none", "providerStatus": "disabled",
    "simulated": false, "cached": false, "latencyMs": 12
  }
}
```

Status codes mirror `/api/access`: `405` method, `415` content type, `401`
bad/missing token, `403` disallowed origin, `400` malformed JSON /
content-length, `413` body too large, `422` invalid body, `429` rate limit,
`500` internal. Responses are `Cache-Control: no-store`.

### Sufficiency

| Passages used | Sufficiency | Meaning |
| --- | --- | --- |
| 0 | `insufficient` | No primary source addresses the question. The answer says so. |
| 1 | `limited` | One source only — answer flags thin evidence. |
| 2+ | `sufficient` | Multiple independent sources — strongest evidence state. |

---

## 2. Architecture

```
src/app/api/intelligence/route.ts        # Route (mirrors /api/access)
src/lib/intelligence/
  pipeline.ts                            # Request → answer orchestrator
  types.ts / ids.ts / schema.ts          # Contracts, canonical ids, zod schemas
  config.ts / logging.ts / auth.ts       # INTEL_* env, PII-safe logs, bearer auth
  cache.ts                               # Bounded LRU query cache
  chunking.ts                            # Word-packed chunker (token-agnostic)
  sources/
    adapter.ts                           # SourceAdapter interface (jurisdiction plug)
    corpus.ts                            # In-memory corpus → docs + chunks
    default.ts                           # Seeded singleton for the route
    fixtures/uae.ts                      # 🚧 DEV-ONLY fixture corpus
  retrieval/
    ranking.ts                           # BM25 (k1=1.2, b=0.75) + recency/type/title boosts
    retrieve.ts                          # Filters, top-K, per-doc budget, char cap
  citations/citations.ts                 # Numbered citations, [n] resolver
  generation/
    synthesis.ts                         # Deterministic local answer (+ conflict detection)
    prompts.ts                           # System prompt + user prompt builder
    provider.ts                          # OpenAI-compatible client (no SDK, timed out)
    guard.ts                             # JSON guard, id-vetted refs, hallucination filter
    evidence.ts                          # Evidence-bar label
  ingest.ts                              # Source→validate→chunk→index→persist
  db/store.ts                            # Optional Postgres mirror (intel_documents/intel_chunks)
intel-schema.sql                         # Durable-mirror DDL (separate from supabase-schema.sql)
src/components/Intelligence.tsx          # Homepage console
```

### Reused from the existing platform (read-only, never forked)

- `consumeRateLimit` — IP bucketing + Postgres/in-memory store fallback.
  Bucket key `intel:ip:<sha256(ip:salt)>`, tuned by `INTEL_RATE_LIMIT_*`.
- `readStreamBodyCapped` — hard byte cap on the body stream.
- `parseContentLength`, `NO_STORE` — header pre-check + no-store headers.
- `normalizeClientIp`, `hashWithSalt` — same trust model as `/api/access`.
- `intel-schema.sql` lives **separately** from `supabase-schema.sql`.

### Answer paths

1. **Local synthesis (always available, zero config):** deterministic extractive
   summary assembled from retrieved passages + provenance. No facts invented.
2. **LLM path (optional):** enabled only when `INTEL_AI_PROVIDER=openai-compatible`
   **and** `INTEL_AI_API_KEY` is set. The provider receives only the query and
   the bounded retrieved context. Its JSON output is vetted by `guard.ts`:
   refs must resolve to actually-retrieved documents (hallucinations dropped,
   and a response whose sources are all fabricated is rejected outright), and
   absolute legal-claim phrasing is flagged into a caveat. Any provider error,
   timeout, malformed output, or guard rejection falls back to local synthesis
   — the engine never surfaces unvetted model text.

### Cost & abuse controls

- IP rate limit (default 12 / 10 min) via the shared rate-limit store.
- Question length cap (`INTEL_MAX_QUERY_CHARS`, 500), body cap (8 KB).
- Top-K 4, `<7 KB` context budget, ≤ 2 chunks per document.
- Bounded in-memory LRU cache (max 64 entries, 5 min TTL).
- PII-safe logging: only `requestId`, counts, and provider status are logged —
  never the question text, IP without salt, or API keys.

---

## 3. Environment

All `INTEL_*` values are optional; safe defaults are compiled in (see
`.env.example`). The engine runs fully without them.

| Variable | Default | Purpose |
| --- | --- | --- |
| `INTEL_MAX_QUERY_CHARS` | 500 | Question length cap |
| `INTEL_MAX_BODY_BYTES` | 8192 | Request body cap |
| `INTEL_RATE_LIMIT_IP_LIMIT` | 12 | IP attempts per window |
| `INTEL_RATE_LIMIT_IP_WINDOW_MS` | 600000 | Rate window |
| `INTEL_ALLOWED_ORIGINS` | SITE_URL (+localhost in dev) | Allowed POST origins |
| `INTEL_TOKEN` | — | Optional bearer token |
| `INTEL_RETRIEVE_TOP_K` | 4 | Passages returned |
| `INTEL_CONTEXT_MAX_CHARS` | 6000 | Context budget for the answer stage |
| `INTEL_AI_PROVIDER` | — | `openai-compatible` or empty |
| `INTEL_AI_BASE_URL` | `https://api.openai.com/v1` | Compatible endpoint |
| `INTEL_AI_API_KEY` | — | Server-side only, never shipped to the client |
| `INTEL_AI_MODEL` | `gpt-4o-mini` | Model id |
| `INTEL_AI_MAX_TOKENS` | 700 | Completion cap |
| `INTEL_AI_TIMEOUT_MS` | 15000 | Abort after this long |
| `INTEL_CACHE_TTL_MS` | 300000 | Cache entry TTL |
| `INTEL_CACHE_MAX` | 64 | Cache capacity (0 disables) |
| `INTEL_PERSIST_DB` | `0` | Set to `1` to mirror the corpus to Postgres |
| `ACCESS_IP_SALT` | — | **Required in production** (shared with `/api/access`) |

With `STRICT_PROD_GUARD=1` + `NODE_ENV=production`, any intelligence config
warning (weak salt, non-HTTPS origins, provider set without a key) becomes a
fatal build error instead of a log line.

---

## 4. 🚧 Fixture corpus — read before production

The shipped UAE corpus (`src/lib/intelligence/sources/fixtures/uae.ts`) is a
**development fixture**. Document titles, publishers, and dates describe real
instruments (Federal Decree-Law No. 14/2018, SVF Regulation 2016, VARA Law 4 of
2022, Cabinet Resolution 111/2022, PDP Decree-Law 45/2021, AML Decree-Law
20/2018 as amended, ADGM FSMR, DIFC laws, …), but:

- the **content is a concise working summary written for development/testing**,
  *not* verbatim authoritative text;
- every record is flagged `fixture: true` and the UI labels it "DEV FIXTURE";
- source links point at **official regulator portals** (never deep-fake URLs);
- the engine never interpolates registry numbers, URLs, or "effective date"
  claims it cannot retrieve.

**Do not treat fixture answers as legal advice, and do not ship the fixture
corpus to production as authoritative data.**

### Manual ingestion path

The shipped fixture corpus is replaced by an **admin CLI** that turns vetted
source text into production corpus data without code edits:

```bash
# 1. Add authoritative text files to corpus/ (format: see corpus/README.md)
# 2. Validate only — exits non-zero on any rejected file (gate for CI)
npm run ingest -- --dry-run
# 3. Ingest + upsert into Postgres
npm run ingest -- --persist        # needs DATABASE_URL + intel-schema.sql
# 4. Flip the engine onto the durable mirror (also set INTEL_PERSIST_DB=1 to
#    keep the runtime mirror fresh via the API process)
INTEL_CORPUS_MODE=db
```

File format:

```text
---
title: Federal Decree-Law No. 14 of 2018 …
publisher: Central Bank of the UAE
jurisdiction: uae
documentType: legislation
publicationDate: 2018
sourceUrl: https://www.centralbank.ae/…   # official portal, never a mirror
canonicalId: uae-cbuae-dl14-2018            # optional stable id
---

<the authoritative document text>
```

With `INTEL_CORPUS_MODE=db` the engine serves **only** `intel_documents` /
`intel_chunks`: fixtures are never seeded, and if the database is empty or
unreachable it answers honestly (`insufficient`) instead of presenting dev
text as research. Production without `db` mode logs a loud warning (and
`STRICT_PROD_GUARD=1` fails the build).

Writing a live `SourceAdapter` (scraping an approved portal) is still fully
supported — `runIngestion(adapter, corpus, { persist })` accepts any adapter —
and the `corpus-dir` adapter behind the CLI is itself a plain `SourceAdapter`.
Design-time decisions a corpus file or live adapter must respect:

- `sourceUrl` must be an official primary source. No mirrors, no aggregators,
  no fabricated deep links.
- `publicationDate` is the legal instrument's date (or year when uncertain) —
  recency boosts retrieval.
- `documentType ∈ { legislation, regulation, guidance, resolution, framework }`
- jurisdiction is stable and derived from the authority (`.uae` → `uae`),
  keeping the domain → document-type mapping sound.
- `canonicalId` keeps the durable row stable across re-ingests (update in
  place instead of inserting a new row when titles drift).

---

## 5. Provider setup (optional)

```bash
# OpenAI (default base URL)
INTEL_AI_PROVIDER=openai-compatible
INTEL_AI_API_KEY=<your key>

# Or any OpenAI-compatible endpoint
INTEL_AI_BASE_URL=https://<your-host>/v1
INTEL_AI_MODEL=<your model>
```

The key lives **server-side only** (route-level `process.env`); the browser
never receives it. Cost controls apply before any provider call: rate limit,
caps, bounded context, and the cache. The engine works with deterministic local
synthesis if you never configure a provider at all.

---

## 6. Testing

```
npm test          # full suite (existing access/rate-limit tests + intelligence)
```

Intelligence coverage (`src/lib/intelligence/*.test.ts`):
- `schema` — intelRequest schema, control-char rejection, chunk-size limits.
- `retrieval` — BM25 ranking, boosts, filters, top-K/document budget.
- `citations` — numbering, ref resolution, source URL + fixture surfacing.
- `generation` — sufficiency tiers, conflict detection, hallucination guard,
  absolute-claim flagging, fenced-JSON unwrapping.
- `pipeline` — transport/security matrix, rate limiting, origin/token checks,
  local synthesis, provider ok / malformed / throw fallbacks, caching.
- `ingest` — dedupe, reversioning, adapter failure, persist hook, fixture crate.
- `auth` / `cache` / `chunking` — unit coverage.

---

## 7. Manual steps remaining before launch

- [ ] Replace the fixture corpus with authoritative ingestion (Section 4).
- [ ] Set a strong `ACCESS_IP_SALT` (32+ random chars) — shared with `/api/access`.
- [ ] Deploy `intel-schema.sql` and set `INTEL_PERSIST_DB=1` (optional).
- [ ] Optionally set `INTEL_AI_PROVIDER` + `INTEL_AI_API_KEY`.
- [ ] Choose `INTEL_TOKEN` if the console should require authorization.
- [ ] Add SCA/VARA/CB-UAE DORA-style regulatory naming updates as live adapters
      as coverage expands (the architecture is jurisdiction-agnostic).