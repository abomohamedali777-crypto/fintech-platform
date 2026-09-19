import { z } from "zod";
import {
  COMPANY_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  HONEYPOT_MAX_LENGTH,
  VOLUME_MAX_LENGTH,
} from "@/lib/accessConfig";

/**
 * Strict server-side validation for POST /api/access.
 *
 * - `.strict()` rejects unknown fields so unexpected/attacker-controlled keys
 *   are not silently dropped.
 * - `email` is normalized (trimmed + lowercased) and length-capped.
 * - `company` and `volume` are optional, trimmed, length-capped text.
 * - `fax` is the dedicated honeypot field. It is never sent by real users and
 *   is shown as a visually-hidden, non-focusable input in the form.
 *   It deliberately has a benign, form-like name so naive bots autofill it;
 *   we never ask users for a fax number.
 */
/**
 * C0 (0x00–0x1F) and C1 (0x7F–0x9F) control characters are never legitimately
 * part of an email address, company name, volume band, or the honeypot field.
 * Rejecting them keeps control bytes out of stored rows and notifications.
 */
const CONTROL_CHAR_RE = /[\u0000-\u001f\u007f-\u009f]/;
const noControlChars = (value: string) => !CONTROL_CHAR_RE.test(value);

export const accessRequestSchema = z
  .object({
    email: z
      .string({ required_error: "email required" })
      .trim()
      .toLowerCase()
      .min(1, "email required")
      .max(EMAIL_MAX_LENGTH, "email too long")
      .email("invalid email")
      .refine(noControlChars, "invalid characters"),
    company: z
      .string()
      .trim()
      .max(COMPANY_MAX_LENGTH, "company too long")
      .refine(noControlChars, "invalid characters")
      .optional()
      .or(z.literal("")),
    volume: z
      .string()
      .trim()
      .max(VOLUME_MAX_LENGTH, "volume too long")
      .refine(noControlChars, "invalid characters")
      .optional()
      .or(z.literal("")),
    fax: z
      .string()
      .trim()
      .max(HONEYPOT_MAX_LENGTH, "fax too long")
      .refine(noControlChars, "invalid characters")
      .optional()
      .or(z.literal("")),
  })
  .strict();

export type AccessRequestBody = z.infer<typeof accessRequestSchema>;

export type ValidationResult =
  | { ok: true; data: AccessRequestBody }
  | { ok: false; code: "invalid_fields" };

export function parseAccessBody(payload: unknown): ValidationResult {
  const parsed = accessRequestSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, code: "invalid_fields" };
  const data = parsed.data;
  return {
    ok: true,
    data: {
      email: data.email,
      company: data.company || undefined,
      volume: data.volume || undefined,
      fax: data.fax || undefined,
    },
  };
}