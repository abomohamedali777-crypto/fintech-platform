# Corpus directory — authoritative source documents

Drop the authoritative text of each instrument you want the Intelligence
Engine to answer from into this directory as `*.txt` or `*.md`. The file's
front matter supplies the metadata; the body is the document text.

**Everything here is treated as NON-fixture, production corpus data.** Unlike
the built-in development fixtures, documents ingested from this directory are
labelled `fixture: false` and the console will not show the "DEV FIXTURE" badge
for them. Do not put placeholder or summary text here.

## Workflow

```bash
# 1. Add files (front matter + authoritative text) to corpus/
# 2. Validate only — exits non-zero if any file is rejected
npm run ingest -- --dry-run
# 3. Ingest into the in-memory index and upsert into Postgres
npm run ingest -- --persist        # needs DATABASE_URL + intel-schema.sql applied
# 4. Switch the running engine off fixtures and onto the durable corpus
#    (set in production env): INTEL_CORPUS_MODE=db
```

Steps 3–4: `npm run ingest -- --persist` writes `intel_documents` /
`intel_chunks`; `INTEL_CORPUS_MODE=db` makes the API serve ONLY that mirror —
fixtures are never seeded and the engine answers "insufficient evidence" when
the database is empty or unreachable, rather than presenting dev text as
research. Without `INTEL_CORPUS_MODE=db`, the fixtures still work in
development.

## File format

```text
---
title: Federal Decree-Law No. 14 of 2018 …
publisher: Central Bank of the UAE
jurisdiction: uae                 # optional, defaults to uae
documentType: legislation         # legislation|regulation|guidance|resolution|framework
publicationDate: 2018
sourceUrl: https://www.…  (official portal — no mirrors, no deep-faked links)
lastUpdated: 2024-01-02           # optional
canonicalId: uae-cbuae-dl14-2018  # optional stable id (dedupe + re-version)
---

<the authoritative document text (≥ 80 characters)>
```

Validation rules (enforced by `npm run ingest`):
- Required fields: `title`, `publisher`, `documentType`, `publicationDate`,
  `sourceUrl`. `jurisdiction` defaults to `uae`.
- Content must be ≥ 80 characters; unknown front-matter fields are rejected
  so typos don't silently strip metadata.
- `canonicalId`, when set, is the stable row identifier: keeping the same id
  (even if the title/date text changes) makes persisted re-ingests **update the
  existing row in place** instead of inserting a new `intel_documents` row.
  Without it, an id is derived from publisher + title + date — changing any of
  those creates a new row. The CLI run itself is stateless (memory starts
  empty), so the in-memory counts (`created`/`updated`/`skipped`) describe one
  run; the Postgres write is an idempotent upsert keyed on `intel_documents.id`.

Files starting with `_` and `README*` are ignored by the loader — keep
`_TEMPLATE.txt` (a fill-in skeleton) and this file beside your real corpus.

## Provenance expectations

The engine's credibility rests on its sources. For the UAE, approved sources
include: Central Bank of the UAE (centralbank.ae), Securities and Commodities
Authority (sca.gov.ae), Virtual Assets Regulatory Authority (vara.ae), the UAE
Government portal (u.ae/en), ADGM (adgm.com) and DFSA (dfsa.ae). Paste verbatim
text from the official instrument, not a paraphrase, and keep `sourceUrl`
pointing at the official page.