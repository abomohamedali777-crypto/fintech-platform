# Mizan — Automated Liquidity & Settlement

Demonstration landing page for a B2B payments platform. This repository is a
**demo**: the site, metrics, team, and testimonials are illustrative and not a
live operational service. No financial services are offered from this
deployment.

## Stack

- [Next.js](https://nextjs.org) 16 (App Router) + React 19, TypeScript (strict)
- Tailwind CSS 3
- [Resend](https://resend.com) (free-tier transactional email)
- [Supabase](https://supabase.com) Postgres (free tier) for storage + rate
  limiting
- [Zod](https://zod.dev) request validation

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in values (see below)
npm run dev                  # http://localhost:3000
```

### Environment variables

| Variable | Purpose | Required |
| --- | --- | --- |
| `SITE_URL` | Canonical site URL (sitemap, OG, security.txt, default CORS origin) | production |
| `DATABASE_URL` | Postgres connection string; enables persistence + rate limiting. When unset the access API responds `503` honestly. | for the form to work |
| `RESEND_API_KEY` | Resend key for best-effort new-request notification emails | recommended |
| `NOTIFY_TO` / `NOTIFY_FROM` | Recipient / sender for notifications | recommended |
| `ACCESS_IP_SALT` | Salt for hashing client IPs before storage. `openssl rand -hex 32`. | **required in production** |
| `ALLOWED_ORIGINS` | Comma-separated origins allowed to POST to `/api/access` | recommended |
| `RATE_LIMIT_IP_LIMIT`/`_WINDOW_MS`, `RATE_LIMIT_EMAIL_LIMIT`/`_WINDOW_MS` | Rate-limit tuning | optional (defaults: 5/10 min per IP, 2/1 h per email) |
| `INTEL_*` (see `.env.example`) | Intelligence Engine: limits, rate limit, optional AI provider, cache, DB mirror | optional for V1 |
| `NEXT_PUBLIC_SUPPORT_EMAIL`, `SECURITY_CONTACT` | Public contact addresses | recommended |
| `DATABASE_SSL_REJECT_UNAUTHORIZED` | `false` only for self-signed/local DBs | optional |
| `STRICT_PROD_GUARD` | Reserved for stricter production guardrails | optional |

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type checking |
| `npm test` | Vitest unit tests (validation, pipeline, rate limiting) |
| `npm run build` / `npm start` | Production build / serve |
| `npm audit` | Dependency vulnerability check |

## API

`POST /api/access` accepts a JSON `{ email, company?, volume?, fax? }` payload
from allowed origins. `fax` is a hidden honeypot field — bots that fill it get
a fake 200 and are never persisted. Responses are documented in
[PRE_LAUNCH_SECURITY.md](./PRE_LAUNCH_SECURITY.md).

`POST /api/intelligence` is the Legal & Regulatory Intelligence Engine
(source-grounded RAG; UAE first). See [INTELLIGENCE.md](./INTELLIGENCE.md) for
architecture, the fixture corpus caveat, and the ingestion steps.

## Deployment

Operator runbook (cloud setup, environment variables, corpus step, smoke
checklist, payments roadmap): [DEPLOY.md](./DEPLOY.md).

## Database

Apply the schema/migrations once against Supabase:

```bash
psql "$DATABASE_URL" -f supabase-schema.sql
```

See the header of `supabase-schema.sql` for the row-level-security posture.

## Deploying on the free tier (mizan.vercel.app)

1. Vercel: import the repo, set `SITE_URL=https://<project>.vercel.app` in
   Project → Settings → Environment Variables. Do **not** hardcode a custom
   domain the project does not own.
2. Supabase: create the free project, run `supabase-schema.sql`, then set
   `DATABASE_URL` (use the pooler, `?sslmode=require`). Enable the hourly
   cleanup cron if you want the documented `rate_limits` job.
3. Resend: create the free API key + a verified sender identity; set
   `RESEND_API_KEY`, `NOTIFY_TO`, `NOTIFY_FROM`.
4. Set `ACCESS_IP_SALT` to a random value and press Deploy.

## Trust & compliance notes

- This deployment is a simulation. Landing-page claims are labelled
  "simulated/demo" where an auditor could mistake them for live operations
  (settlement feed, telemetry, metrics, team, logos).
- Verification status ("Aligned to ISO/IEC 27001 & SOC 2 control frameworks")
  uses the word *aligned* intentionally; no certification is claimed.
- See `src/data/legal.ts` for the demo-aware Privacy, Terms, Cookie, and
  Refund policy text, and `PRE_LAUNCH_SECURITY.md` for the release checklist.