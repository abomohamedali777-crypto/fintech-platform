# Deployment runbook - Mizan fintech platform

Operator guide for taking this Next.js 16 demonstration site live on the free
tiers named in the design brief: Vercel (host), Supabase (Postgres), Resend
(notifications). It complements PRE_LAUNCH_SECURITY.md (release gate / security
disposition) and INTELLIGENCE.md (the RAG engine walkthrough). Read
.env.example as the canonical inventory of every variable this runbook
references.

Everything here is a dashboard/SQL action you perform yourself. Nothing in this
file requires a code change, and none of your secrets need to be shared to
follow the kit end-to-end.

## 1. Prerequisites

| Component | What you need | Free tier notes |
| --- | --- | --- |
| Vercel | Account with the repo imported | `*.vercel.app` deployment URL |
| Supabase | One project; the Database > SQL Editor | Free tier Postgres, no add-ons |
| Resend | Account; the domain you will send from | Free tier sender verification |

The app is a stateless serverless build: it needs one Postgres (Supabase)
shared by the access pipeline and the intelligence mirror. The two schema files
are designed to coexist on the same database - supabase-schema.sql owns
`public.access_requests` + `public.rate_limits`; intel-schema.sql owns
`intel_documents` + `intel_chunks` and explicitly never touches `public.*`.

## 2. One-time cloud setup

### 2.1 Supabase

1. Create a project. Copy the database connection string from
   Settings > Database > Connection string
   (`postgresql://postgres.<project>:<password>@...pooler.supabase.com:5432/postgres`).
2. SQL Editor: paste `supabase-schema.sql` and run.
3. SQL Editor: paste `intel-schema.sql` and run. (Idempotent
   `create table if not exists`; safe to re-run.)
4. That is it. Row-level security is enabled on all four tables and writes go
   through the service role only; end users never touch them.

If your database is local/self-signed, set
`DATABASE_SSL_REJECT_UNAUTHORIZED=false` (see `.env.example`). Supabase's
managed Postgres works with the default `true`.

### 2.2 Resend

1. Add a domain (e.g. `mizan.pay` or a subdomain such as `mail.mizan.pay`) and
   copy the verification records (TXT/SPF/DKIM) into DNS at the registrar.
2. Wait for verification, then create an API key (`re_...`).
3. Choose your from-address. Resend only sends from addresses on a verified
   domain. Until verification completes you can use Resend's temporary sender
   (`onboarding@resend.dev`), but set `NOTIFY_FROM` to a real
   `Name <name@verified-domain>` (the default is `Mizan Access
   <access@mizan.pay>`) or requests will return 200 while the notification
   silently fails.

### 2.3 Vercel

1. Add New Project > Import the `fintech-platform` repo.
2. Framework preset: Next.js; build command stays the default (`next build`).
   Next.js 16 requires Node 20 or newer; the latest LTS in the project
   settings is fine.
3. Set environment variables (Section 3). At minimum the Required block, plus
   `INTEL_CORPUS_MODE=db` if you have ingested a corpus (Section 4). Apply to
   Production (Preview + Development are optional but handy).
4. Deploy.

## 3. Environment variables

Source of truth: `.env.example`. Every variable is read server-side except
`NEXT_PUBLIC_*`, which are inlined into the client bundle at build time.

### Required for production integrity

| Variable | Value / generation | Purpose & behaviour |
| --- | --- | --- |
| `SITE_URL` | `https://<project>.vercel.app` (trailing slash ok) | Canonical origin: sitemap, robots, `security.txt`, OG metadata, default allowed-origin for both APIs. `getSiteUrl()` falls back to Vercel's `VERCEL_URL` if unset; set it explicitly. |
| `ALLOWED_ORIGINS` | `https://<project>.vercel.app` | Comma-separated origins allowed to POST `/api/access`. Production rejects non-HTTPS origins; if the list filters to empty, the endpoint refuses all cross-origin calls until a real HTTPS origin is set. |
| `INTEL_ALLOWED_ORIGINS` | `https://<project>.vercel.app` | Same rules for `/api/intelligence` (independent allowlist). |
| `ACCESS_IP_SALT` | `openssl rand -hex 32` (>= 32 chars) | Salt for SHA-256 of client IPs in rate-limit buckets. Production fail-closes to an empty salt and warns loudly if unset, weak, or a known value (`mizan`, the `.env.example` placeholder); with `STRICT_PROD_GUARD=1` the build fails instead. |
| `DATABASE_URL` | Supabase connection string | Required for `/api/access` row persistence + distributed rate limiting, and for `npm run ingest -- --persist`. Unset -> `/api/access` answers a deliberate `503`. |
| `RESEND_API_KEY` | `re_...` | Emails the recorded access request to `NOTIFY_TO`, best-effort (mail failure never fails the request). |
| `NOTIFY_TO` | your inbox | Recipient of access-request notifications. |
| `NOTIFY_FROM` | `Name <name@verified-domain>` | Sender on the verified Resend domain. |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | `hello@<domain>` | Shown in the footer + legal pages (build-time, public). |
| `SECURITY_CONTACT` | `security@<domain>` | Rendered by `/.well-known/security.txt`. |
| `STRICT_PROD_GUARD` | `0` / `1` | `1` turns every config warning (weak salt, localhost origin, non-db corpus, missing AI key when enabled) into a fatal error at build/import time in production. Recommended `1` once the table above is complete; it makes misconfigured deploys fail fast instead of degrading. |
| `DATABASE_SSL_REJECT_UNAUTHORIZED` | `true` (default) | `false` only for self-signed/local Postgres. |

### Intelligence Engine (`POST /api/intelligence`)

Works with zero config in deterministic local-synthesis mode. These are
opt-in:

| Variable | Default | Purpose & behaviour |
| --- | --- | --- |
| `INTEL_CORPUS_MODE` | `fixture` | `db` = serve ONLY the durable Postgres mirror, never the dev fixtures; empty/unreachable DB = honest "insufficient evidence" answers, never fabricated research. Production must be `db` (warning otherwise; fatal under `STRICT_PROD_GUARD`). See Section 4; switching on before ingesting gives an empty-but-honest engine. |
| `INTEL_TOKEN` | (empty) | Optional bearer token. Unset = anonymous, rate-limited research UI; set = every request requires `Authorization: Bearer <value>` (else `401`). |
| `INTEL_AI_PROVIDER` | (empty) | `openai-compatible` enables the optional LLM path. Local synthesis stays the automatic fallback on any provider error, and answers stay grounded in retrieved passages + citations. |
| `INTEL_AI_BASE_URL` / `INTEL_AI_API_KEY` / `INTEL_AI_MODEL` / `INTEL_AI_MAX_TOKENS` / `INTEL_AI_TIMEOUT_MS` | openai/v1 / empty / `gpt-4o-mini` / `700` / `15000` | Provider connection. A missing key with the provider enabled is a warning, not a break; the engine falls back. |
| `INTEL_PERSIST_DB` | `0` | `1` = the API process writes the loaded corpus into the Postgres mirror at boot. `npm run ingest -- --persist` is the manual path. |
| `INTEL_RETRIEVE_TOP_K` / `INTEL_CONTEXT_MAX_CHARS` | `4` / `6000` | Retrieval cap (passages returned, hard-enforced) and context budget for the reasoning step. |
| `INTEL_CACHE_TTL_MS` / `INTEL_CACHE_MAX` | `300000` / `64` | Bounded in-memory query cache; `0` disables it. Not a durable store. |
| `INTEL_MAX_QUERY_CHARS` / `INTEL_MAX_BODY_BYTES` | `500` / `8192` | Request caps; exceeded -> `422` / `413`. |
| `INTEL_RATE_LIMIT_IP_LIMIT` / `INTEL_RATE_LIMIT_IP_WINDOW_MS` | `12` / `600000` | Per-IP bucket for the endpoint (independent bucket, shares `ACCESS_IP_SALT`). Exceeded -> `429` + `Retry-After`. |

### Request-access tuning (optional)

`RATE_LIMIT_IP_LIMIT` / `RATE_LIMIT_IP_WINDOW_MS` (default `5` / `10` min),
`RATE_LIMIT_EMAIL_LIMIT` / `RATE_LIMIT_EMAIL_WINDOW_MS` (default `2` / `60`
min). The access body cap is fixed at 16 KB in code; bodies are rejected from
the `Content-Length` header before buffering (413), so oversized requests never
consume server memory.

## 4. The corpus step (before flipping `INTEL_CORPUS_MODE=db`)

1. Add the authoritative text of each instrument you want the engine to answer
from as `corpus/*.txt|*.md` (format: `corpus/README.md`, skeleton in
   `corpus/_TEMPLATE.txt`). Use official sources only (Central Bank of the UAE,
   SCA, VARA, u.ae, ADGM, DFSA) - the engine cites `sourceUrl`, so a mirror or a
   paraphrase is a credibility defect, not just a style one.
2. Validate: `npm run ingest -- --dry-run` exits non-zero on any rejected file,
   so it doubles as a CI gate.
3. Ingest + mirror: with `DATABASE_URL` set locally, run
   `npm run ingest -- --persist`. This writes `intel_documents` / `intel_chunks`
   (idempotent upsert keyed on the document id; `canonicalId` keeps rows stable
   across title edits).
4. Deploy env with `INTEL_CORPUS_MODE=db`.

Honest caveat, on purpose: `corpus/` ships empty (template only), so `db` mode
answers "insufficient evidence" until real text is ingested. That is intended
behaviour - the fixture summaries are dev-only, and a production site must not
present them as research.

## 5. Post-deploy smoke checklist

Run against the live URL (PowerShell; bash users drop the escaping).

```powershell
$U = "https://<project>.vercel.app"

# 1. Site headers - expect CSP, HSTS, nosniff, frame-ancestors 'none', etc.
curl.exe -sI "$U/" | Select-String -Pattern "HTTP/|content-security-policy|strict-transport-security|x-content-type-options|x-frame-options|referrer-policy|permissions-policy"

# 2. Static / generated routes (each should be 200)
foreach ($p in "/", "/privacy", "/refund-policy", "/robots.txt", "/sitemap.xml", "/.well-known/security.txt", "/manifest.webmanifest") {
  $c = curl.exe -s -o $null -w "%{http_code}" "$U$p"; Write-Output "$p -> $c"
}

# 3. Access API - valid request (expect 200 + JSON result)
curl.exe -s -X POST "$U/api/access" -H "Content-Type: application/json" -H "Origin: $U" --data '{\"email\":\"you@yourcompany.com\",\"company\":\"Mizan Team\",\"message\":\"Deployment smoke test\",\"fax\":\"\"}'

# 4. Access API - negatives (403 foreign origin, 405 GET, 422 bad email)
curl.exe -s -o $null -w "foreign-origin=%{http_code}`n" -X POST "$U/api/access" -H "Content-Type: application/json" -H "Origin: https://evil.example" --data '{}'
curl.exe -s -o $null -w "get=%{http_code}`n" "$U/api/access"
curl.exe -s -o $null -w "bad-email=%{http_code}`n" -X POST "$U/api/access" -H "Content-Type: application/json" -H "Origin: $U" --data '{\"email\":\"nope\"}'

# 5. Intelligence API - grounded answer with citations
curl.exe -s -X POST "$U/api/intelligence" -H "Content-Type: application/json" -H "Origin: $U" --data '{\"question\":\"Which authority licenses stored value facilities in the UAE?\"}'

# 6. Intelligence API - negatives (422 empty, 405 GET)
curl.exe -s -o $null -w "empty=%{http_code}`n" -X POST "$U/api/intelligence" -H "Content-Type: application/json" -H "Origin: $U" --data '{\"question\":\"\"}'
curl.exe -s -o $null -w "get=%{http_code}`n" "$U/api/intelligence"

# 7. If INTEL_TOKEN is set: no bearer -> 401; with bearer -> 200
# 8. Rate limit: 12 rapid intelligence calls -> 429 with Retry-After
```

Expected behaviour the runbook signs off: `/` reaches the console with the
intelligence UI answering from the corpus; request-access persists a row and
emails you; failures are generic (`500`) or honestly `503`, never a stack
trace; rate limits return `429` + `Retry-After`.

## 6. Payments roadmap

### Current disposition

The site does **not** collect payments, hold deposits, or process
transactions. `src/data/legal.ts` asserts exactly this (privacy, terms,
refunds, and the compliance pages all describe the demo). `mizan.pay` is the
*planned* B2B payments-infrastructure product; this launch is its design
demonstration, and the design brief constrains the release to free tiers with
no custom domain yet.

### Phase 0 - demo-safe (no money, no PSP, no legal change)

Feature the product story only: a marketing "Payments" section on the landing
page describing the planned settlement rails (deterministic settlement across
24/7 rails; the product tagline already lives in `app/manifest.ts`),
clearly illustrative, with no checkout element. Work needed: copy + i18n keys
(`en` + `ar` at minimum) and routing/tests. No payment code, no PCI scope.

### Phase 1 - first real charge, only after this gate

Do not take a real payment until **all** of the following hold:

1. Live deploy proven via Section 5 (against the deployed URL, not localhost).
2. Real corpus ingested and `INTEL_CORPUS_MODE=db` - a paid product must answer
   from authoritative sources, not dev fixtures.
3. A real custom domain wired, with `SITE_URL`, both `ALLOWED_ORIGINS`,
   `NEXT_PUBLIC_SUPPORT_EMAIL`, `SECURITY_CONTACT` and `NOTIFY_*` moved to it
   (the `PRE_LAUNCH_SECURITY.md` residual items), and the WhatsApp CTA wired.
4. **Legal pages rewritten and published before any charge:**
   - `refund-policy` currently says "this site does not collect payments...
     nothing to refund". That page must publish the real policy in advance of
     taking money.
   - Terms must state the paid service, how the agreement is confirmed,
     renewal/pricing if subscription-based, and that the demo label no longer
     applies to the charging path.
   - Privacy and cookie statements updated for payment-related data (billing
     email, receipts; no card data if a hosted checkout is used).
   - Compliance labelling updated so the site never implies the CPPs/FSI/KYC
     licences the *product* would one day need.
5. **PSP account** (all UAE PSPs require a UAE merchant/business identity) with
   the choice below made consciously.

**PSP selection - hosted checkout only.** A hosted/redirect or embedded
checkout keeps PCI-DSS scope at **SAQ A** (card data never touches your
servers, logs, or database) - this is the deciding criterion. Candidates a UAE
demo would evaluate: Stripe (UAE availability, invoicing/B2B tooling, clear
free-vs-cost split) alongside regional gateways such as Telr and PayBy, and a
browser-level tokenized alternative (e.g. Google Pay / Apple Pay via the PSP's
hosted flow). Compare availability for your UAE entity, settlement currency
(USD/AED), setup and per-transaction fees, recurring/refund support, and
chargeback workflow. Whatever the choice, the money path must be a separate,
documented subsystem:

- A server-side `api/checkout` that creates a session/intent through the PSP
  and returns only the hosted URL (never redirect to a raw card form).
- A signature-verified webhook (`api/webhooks/payments`) handling
  `checkout.session.completed`, `invoice.paid`, `charge.refunded`, etc., with
  **idempotency keys** + exact-once row updates, and per-provider secret
  verification headers.
- PII boundary preserved: no card data ever in application logs (the access
  pipeline's salted-IP hygiene applies here too), `Cache-Control: no-store`
  on every payment API response.
- A paid-access flip of `access_requests` rows (status: granted), replaced by
  a `subscriptions` table serving access entitlements - still rate-limited and
  strict-validated like the existing endpoints.

### Regulatory honesty

Collecting a fee for demo access does **not** require the Payment Services /
Financial Systems licences the product would one day need, and the site must
never imply it has them. Keep the "illustrative demo, not live operational
data" framing (`src/components/Footer.tsx`) even when real charges begin; the
licence posture is a separate, later workstream tied to the actual product.

## 7. Residual checklist (cross-reference)

- [ ] Prove the deployed URL renders and the form works end-to-end (runtime
      smoke against the live URL - Section 5).
- [ ] After custom domain: move `SITE_URL`, `ALLOWED_ORIGINS`,
      `NEXT_PUBLIC_SUPPORT_EMAIL`, `SECURITY_CONTACT`, `NOTIFY_*`; wire the
      WhatsApp CTA.
- [ ] Verify the deployed URL serves the security headers configured in
      `next.config.mjs` and re-tune the CSP to the final origin.
- [ ] Replace placeholder/fictional team, testimonial and logomark assets
      before any commercial use. (The Team section is already removed from
      the site build.)
- [ ] Set a strong `ACCESS_IP_SALT` (>= 32 random chars) in the production
      environment before first deploy.
- [ ] Consider the L3 `requestId` + email dedupe hardening (a retried
      successful access request can double-notify; bounded today by rate
      limiting).
- [ ] Decide `STRICT_PROD_GUARD=1` once the Required env block is complete.
- [ ] Optional: `requestId` idempotency tests; optional: AI-provider path
      (Section 3, Intelligence table).
