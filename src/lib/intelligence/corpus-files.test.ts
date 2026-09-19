import { describe, it, expect } from "vitest";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadCorpusDirectory, parseCorpusFile } from "./corpus-files";

const VALID = `---
title: Federal Decree-Law No. 14 of 2018 regarding the Central Bank
publisher: Central Bank of the UAE
jurisdiction: uae
documentType: legislation
publicationDate: 2018
sourceUrl: https://www.centralbank.ae/legislation
canonicalId: uae-cbuae-dl-14-2018
---

This is the consolidated working text that describes the licensing,
supervision and resolution framework for banks and financial institutions.
Regulated entities must hold authorisation and comply with ongoing prudential
requirements. This content is long enough to pass the ingestion schema and is
used to exercise the parser across many test cases here.`;

describe("parseCorpusFile", () => {
  it("parses a valid file into an IngestInput", () => {
    const r = parseCorpusFile(VALID);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.title).toContain("Decree-Law No. 14");
    expect(r.data.publisher).toBe("Central Bank of the UAE");
    expect(r.data.jurisdiction).toBe("uae");
    expect(r.data.documentType).toBe("legislation");
    expect(r.data.publicationDate).toBe("2018");
    expect(r.data.sourceUrl.startsWith("https://")).toBe(true);
    expect(r.data.fixture).toBe(false);
    expect(r.data.metadata?.canonicalId).toBe("uae-cbuae-dl-14-2018");
    expect(r.data.content.length).toBeGreaterThan(80);
  });

  it("defaults jurisdiction to uae and tolerates CRLF", () => {
    const crlf = VALID.replace(/\n/g, "\r\n");
    const r = parseCorpusFile(crlf);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.jurisdiction).toBe("uae");
  });

  it("rejects a file without front matter", () => {
    const r = parseCorpusFile("This is just some free text without metadata.");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("no_front_matter");
  });

  it("rejects missing required fields", () => {
    const noSource = VALID.replace("sourceUrl: https://www.centralbank.ae/legislation\n", "");
    const r = parseCorpusFile(noSource);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("missing_fields");
    expect(r.detail).toContain("sourceUrl");
  });

  it("rejects empty and too-short content", () => {
    const contentStart = VALID.indexOf("\n\n", VALID.indexOf("\n---"));
    const rEmpty = parseCorpusFile(VALID.slice(0, contentStart + 2));
    expect(rEmpty.ok).toBe(false);
    if (!rEmpty.ok) expect(rEmpty.reason).toBe("empty_content");

    const short = VALID.replace(/\n\nThis[\s\S]*/, "\n\nshort");
    const rShort = parseCorpusFile(short);
    expect(rShort.ok).toBe(false);
    if (!rShort.ok) expect(rShort.reason).toBe("content_too_short");
  });

  it("rejects unknown front-matter fields", () => {
    const extra = VALID.replace("---\n", "---\nevilField: yep\n");
    const r = parseCorpusFile(extra);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("unknown_field");
    expect(r.detail).toContain("evilField");
  });

  it("rejects invalid enum values via the shared schema", () => {
    const bad = VALID.replace("documentType: legislation", "documentType: memo");
    const r = parseCorpusFile(bad);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe("invalid_value");
  });
});

describe("loadCorpusDirectory", () => {
  it("loads txt/md files sorted and skips _ and README helper files", async () => {
    const dir = await mkdtemp(join(tmpdir(), "mizan-corpus-"));
    try {
      await writeFile(join(dir, "b.txt"), VALID);
      await writeFile(join(dir, "a.md"), VALID);
      await writeFile(join(dir, "_TEMPLATE.txt"), VALID);
      await writeFile(join(dir, "README.md"), VALID);
      await mkdir(join(dir, "notes"));
      await writeFile(join(dir, "notes", "c.txt"), VALID);
      const entries = await loadCorpusDirectory(dir);
      expect(entries.map((e) => e.name)).toEqual(["a.md", "b.txt"]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("throws when the directory does not exist", async () => {
    await expect(loadCorpusDirectory(join(tmpdir(), "mizan-missing-dir"))).rejects.toThrow();
  });
});