import { z } from "zod";

export const JURISDICTION_ENUM = z.enum(["uae"]);
export type JurisdictionValue = z.infer<typeof JURISDICTION_ENUM>;

export const intelRequestSchema = z
  .object({
    question: z.string().trim(),
    jurisdiction: JURISDICTION_ENUM.or(z.literal("auto")).optional().default("uae"),
    domain: z.enum(["auto", "regulatory", "legal"]).optional().default("auto"),
  })
  .strict();

export type IntelRequestBody = z.infer<typeof intelRequestSchema>;

const C0_C1 = /[\u0000-\u001f\u007f-\u009f]/;

export function hasControlChars(value: string): boolean {
  return C0_C1.test(value);
}

export type IntelParseResult =
  | { ok: true; data: IntelRequestBody }
  | { ok: false; reason: "schema" | "too_short" | "too_long" | "control_chars" };

export function parseIntelBody(payload: unknown, maxQueryChars: number): IntelParseResult {
  const parsed = intelRequestSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, reason: "schema" };
  const question = parsed.data.question;
  if (question.length < 8) return { ok: false, reason: "too_short" };
  if (question.length > maxQueryChars) return { ok: false, reason: "too_long" };
  if (hasControlChars(question)) return { ok: false, reason: "control_chars" };
  return { ok: true, data: parsed.data };
}

export const ingestInputSchema = z
  .object({
    title: z.string().trim().min(4).max(300),
    publisher: z.string().trim().min(3).max(200),
    jurisdiction: JURISDICTION_ENUM,
    documentType: z.enum(["legislation", "regulation", "guidance", "resolution", "framework"]),
    publicationDate: z.string().trim().min(4).max(24),
    lastUpdated: z.string().trim().max(24).optional(),
    sourceUrl: z.string().trim().url().max(500),
    content: z.string().trim().min(80).max(50_000),
    metadata: z.record(z.unknown()).optional(),
    fixture: z.boolean().optional(),
    devNote: z.string().max(500).optional(),
  })
  .strict();

export type IngestInput = z.infer<typeof ingestInputSchema>;

export type IngestParseResult =
  | { ok: true; data: IngestInput }
  | { ok: false; reason: "invalid_ingest_input" };

export function parseIngestInput(payload: unknown): IngestParseResult {
  const parsed = ingestInputSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, reason: "invalid_ingest_input" };
  return { ok: true, data: parsed.data };
}