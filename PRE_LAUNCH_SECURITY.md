# Pre-launch security & trust review — checklist

This file is the release gate for the Mizan demonstration deployment. Each
item should be **verified** (not assumed) before going live.

## Release environment

Run against the **free tier**, custom-domain-free, as opened to us in the
design brief:

- [x] Deployment host: `https://mizan.vercel.app` (or the Vercel `*.vercel.app`
      URL assigned to the project). No `mizan.pay` custom domain is wired —
      `mizan.pay` remains only as an env-default fallback, never a hardcoded claim.
- [x] No paid add-ons beyond what the free tiers include (Vercel free,
      Supabase free, Resend free).
- [ ] Waiting to wire a custom domain *before* the WhatsApp link (per brief)
- [ ] Production env vars set in the Vercel dashboard — never committed.
      See `.env.example` for the full list. Required at minimum:
      `SITE_URL`, `DATABASE_URL`, `RESEND_API_KEY`, `NOTIFY_TO`, `NOTIFY_FROM`,
      `ACCESS_IP_SALT` (random, 32+ chars), `ALLOWED_ORIGINS`.

## Automated checks (run locally before deploy)

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
npm audit
```

## Vulnerability disposition

Severity per common practice (impact × likelihood to be reached). "Fixed"
items are closed in code; "Pending" items are operator/deployment actions.

### Critical — fixed

| # | Finding | Fix |
| --- | --- | --- |
| C1 | Distributed rate limit silently degraded to per-instance memory: `rate_limits.window_start` received JS epoch-millisecond integers, which PostgreSQL parses as bare *years* into `timestamptz`, so every insert failed and the DB limiter was bypassed (a misbehaving client could scale IP/email buckets only across the memory of a single node). | Bind `window_start` as ISO-8601 (`new Date(windowStart).toISOString()`) on every insert and cleanup `DELETE`; memory limiter aligned to the same fixed-grid window (`gridWindowStart()`); `supabase-schema.sql` documents the contract and adds the `rate_limits_window_start_guard` CHECK (bare integers are refused at the DB layer). |
| C2 | Rate-limit keys stored raw PII: per-IP and per-email buckets wrote the raw address into `public.rate_limits.bucket_key`. | Keys are now salted SHA-256 (`hashWithSalt("ip:"+ip, salt)` / `"email:"+data.email`); raw addresses never touch the database. |

### High — fixed

| # | Finding | Fix |
| --- | --- | --- |
| H1 | Oversized request bodies buffered into memory before any validation (a 50 MB JSON could be read before the 16 KB Zod cap kicked in). | Early `Content-Length` guard + size-capped stream read in `api/access/route.ts` → `413` before buffering. |
| H2 | Control characters (C0/C1) accepted inside string fields (email, company, message) — an A-record-free exploit vector for log/spam laundering and monitoring bypass. | `noControlChars` refine rejects `[\x00-\x1F\x7F-\x9F]` in all string fields (`accessSchema.ts`). |
| H3 | Cross-origin callers of `/api/access` (form-spam, log-laundering botnets) accepted when no `Origin`/`Referer` check applied. | Pre-existing: same-origin enforcement (origin allowlist + restrictive preflight, `403` on foreign `Origin`/`Referer`), `Cache-Control: no-store`. Kept and re-verified. |

### Medium — hardening notes (not a launch gate)

| # | Finding | Disposition |
| --- | --- | --- |
| M1 | CSP `script-src` relies on `'unsafe-inline'`. Required for Next.js inline hydration, the consent script and the pre-paint script without a nonce pipeline; reduces XSS resistance (a stored/reflected script could run). | Accepted for the demo. Recommended before commercial use: serve CSP with per-request nonces via `next.config.mjs`/middleware or move scripts to strict-dynamic. |
| M2 | HSTS header advertises `preload` + `includeSubDomains` on the shared `*.vercel.app` host; the domain is not on the HSTS preload list and cannot be from this app alone. | Harmless noise today; revisit when a real custom domain is wired. |
| M3 | `link[rel=preconnect]` to `fonts.googleapis.com` runs before cookie consent (network connection hydrates even if fonts are disabled). Stylesheet and font *downloads* stay consent-gated. | Minor privacy nit; acceptable, or gate preconnects behind the same consent script. |

### Low / hygiene

| # | Finding | Disposition |
| --- | --- | --- |
| L1 | `ACCESS_IP_SALT` unset at build time (fallback used). Build logs warn: `[security] ACCESS_IP_SALT is missing or set to a weak default`. | Operator action: set a random 32+ hex secret in the Vercel dashboard before deploy. |
| L2 | Fictional team, testimonials, and logomark assets remain in the demo. | Must be replaced before any commercial use (see Residual items). |
| L3 | No `requestId` + email dedupe: a retried successful access request can double-notify. | Bounded today by rate limiting; optional hardening. |

### Security headers & CSP — verified compatible with Next.js

`next.config.mjs` serves on `/:path*`: `X-Content-Type-Options: nosniff`,
`X-Frame-Options: DENY`, `COOP: same-origin`, `CORP: same-origin`,
`Referrer-Policy: strict-origin-when-cross-origin`,
`Permissions-Policy (camera/microphone/geolocation off)`,
`Strict-Transport-Security` (63072000s, includeSubDomains), and the CSP below.

Compatibility checks against the production build (Next 16 / Turbopack):

- Inline scripts — hydration bootstrap, `consentScript`, and `prePaintScript`
  (`layout.tsx`) → `script-src 'self' 'unsafe-inline'` (no `'unsafe-eval'` in
  production).
- Google Fonts — stylesheet from `fonts.googleapis.com`, fonts from
  `fonts.gstatic.com` → `style-src`/`font-src` list both; consent script adds
  the `<link>` only when allowed.
- `connect-src 'self'` / `form-action 'self'` — the access form and `/api/access`
  fetch are same-origin; Supabase/Resend calls happen server-side, never in the
  browser.
- `img-src 'self' data: blob:` — no remote image sources in the app.
- `frame-ancestors 'none'` + `object-src 'none'` + `base-uri 'self'` close the
  remaining vectors.
- CSP is emitted for all routes; browsers ignore it for non-HTML responses
  (`robots.txt`, `sitemap.xml`, `security.txt`, images, the JSON API), so no
  breakage there.

## Request-access API — mandated behavior (covered by `src/lib/accessPipeline.test.ts`)

| # | Scenario | Expected |
| --- | --- | --- |
| 1 | Non-POST method | `405` |
| 2 | Unsupported content type | `415` |
| 3 | `Content-Length` over 16 KB | `413` |
| 4 | Raw body over 16 KB | `413` |
| 5 | Cross-origin `Origin` header | `403` |
| 6 | Cross-origin `Referer` header | `403` |
| 7 | Malformed `Origin` header | `403` |
| 8 | No `Origin`/`Referer` (non-browser) | allowed |
| 9 | Per-IP rate limit exceeded | `429` + `Retry-After` |
| 10 | Per-email rate limit exceeded | `429` + `Retry-After` |
| 11 | Malformed JSON body | `400` |
| 12 | Invalid email | `422` |
| 13 | Unknown/extra fields in body | `422` (strict schema) |
| 14 | Honeypot (`fax`) filled | fake `200`, never persisted, never emailed |
| 15 | No DB configured | `503` with honest message |
| 16 | DB persist failure | `500`, generic body, no internals leaked |
| 17 | Valid request | `200`, row persisted, notification sent |
| 18 | Email provider failure | still `200` (notification never fails the request) |
| 19 | Log hygiene | logs never contain raw email or raw IP |

Additional hardening in place:

- `Cache-Control: no-store` on all access-API responses.
- No CORS `Access-Control-Allow-*` headers on the same-origin endpoint;
  the `OPTIONS` preflight returns a restrictive empty allow-origin.
- PII reduced at the edge: emails stored verbatim for follow-up; IPs stored as
  SHA-256 with `ACCESS_IP_SALT`; `user_agent`, `company`, `volume` optional.
- Rate limiting is distributed via `public.rate_limits` in Postgres with an
  in-memory fallback for local/dev, and periodic pruning of old buckets. Rate
  keys are salted SHA-256 hashes (no raw IP/email in `bucket_key`), and
  `window_start` is written as ISO-8601 (PostgreSQL parses a bare integer as a
  year, so epoch-millisecond integers are refused — a CHECK guard enforces this
  at the database layer).
- The API reads the `Content-Length` header before buffering the body, so
  oversized payloads are rejected with `413` without consuming memory.

## Honesty / demo labelling (fixed this pass)

- Cookie banner text no longer claims things aren't set; it states exactly what
  is stored (localStorage theme/language, Google Fonts on consent, no analytics
  or advertising cookies) — English + 31 translations.
- Security claims: "Aligned to ISO/IEC 27001 & SOC 2 control frameworks"
  (aligned, not certified); compliance-layer badge is "SOC 2 aligned".
- Live-looking components are labelled simulated: settlement feed, telemetry,
  metrics, pipeline status, team, logos/badges. All "sim/demo" labels are now
  centralized i18n keys (`sim.*`, `dash.simHeader`, `dash.simBadge`,
  `dash.settledNote`) so they stay consistent in English and Arabic (other
  locales fall back to English).
- Metric/status labels reuse shared translated keys instead of hardcoded English
  (telemetry columns, `SLA met`, `Status`, settlement-rails status rows), so the
  demo framing survives a language switch to Arabic.
- Legal pages (`src/data/legal.ts`) are demo-aware: no financial services,
  no payments collected, nothing to refund; privacy describes only the
  access-request form.
- Footer replaces FZ-LLC/ISO/SOC/DIFC claims and physical address with
  "Illustrative demo · not live operational data".

## Residual items to close before/when launching for real

- [ ] Prove `mizan.vercel.app` itself renders and the form works end-to-end
      (runtime smoke against the deployed URL, not localhost).
- [ ] After custom domain is wired: set `SITE_URL`, `ALLOWED_ORIGINS`,
      `NEXT_PUBLIC_SUPPORT_EMAIL`, `SECURITY_CONTACT`, and `NOTIFY_*` to the
      real `mizan` domain, then wire the WhatsApp CTA.
- [ ] Verify the deployed URL actually serves the security headers configured
      in `next.config.mjs` (CSP, HSTS, `X-Content-Type-Options`,
      `frame-ancestors 'none'`, `Referrer-Policy`, `Permissions-Policy`, COOP/
      CORP) with a live header check, and re-tune the CSP to the final origin.
- [ ] Replace placeholder/fictional team, testimonial, and logomark assets with
      approved ones before any commercial use.
- [ ] Consider a small `requestId` + email dedupe so a retried successful
      request does not double-notify (currently rate limiting bounds this).
- [ ] Set a strong `ACCESS_IP_SALT` (32+ random chars) in the production
      environment before first deploy.