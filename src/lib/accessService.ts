import { Resend } from "resend";
import { getDbPool, isDbConfigured, resetDbPoolForTests, sanitizeDbError } from "@/lib/db";

export type AccessRecord = {
  email: string;
  emailHash: string;
  ipHash: string;
  userAgent: string | null;
  company: string | null;
  volume: string | null;
  honeypot: boolean;
};

export async function persistAccessRequest(
  record: AccessRecord,
): Promise<{ persisted: true; id: string } | { persisted: false; reason: string }> {
  const pool = getDbPool();
  if (!pool) {
    return { persisted: false, reason: "not_configured" };
  }
  try {
    const result = await pool.query(
      `INSERT INTO access_requests
         (email, email_hash, ip_hash, user_agent, company, volume, honeypot, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'new')
       RETURNING id`,
      [
        record.email,
        record.emailHash,
        record.ipHash,
        record.userAgent ?? null,
        record.company?.trim() ? record.company.trim() : null,
        record.volume?.trim() ? record.volume.trim() : null,
        record.honeypot,
      ],
    );
    const id = result.rows[0]?.id;
    if (typeof id !== "string") {
      return { persisted: false, reason: "no_id_returned" };
    }
    return { persisted: true, id };
  } catch (err) {
    // Never surface raw database errors to clients or logs — keep only a
    // stable SQLSTATE code for diagnosis.
    console.error(`[access] persist failed (${sanitizeDbError(err)})`);
    return { persisted: false, reason: "database_error" };
  }
}

export async function notifyAccessRequest(
  record: AccessRecord,
  requestId: string,
): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const notifyTo = process.env.NOTIFY_TO?.trim();
  if (!apiKey || !notifyTo) {
    return { sent: false, reason: "not_configured" };
  }

  // Sanity-check configuration. Actual header injection is impossible here
  // because the sender/recipient are static server configuration, never user
  // input; but we still refuse obviously malformed addresses.
  const emailLike = (s: string) => /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]{2,}$/.test(s);
  if (!emailLike(notifyTo)) {
    console.error("[access] NOTIFY_TO is not a valid address; skipping notification.");
    return { sent: false, reason: "invalid_notify_to" };
  }
  const notifyFrom = process.env.NOTIFY_FROM?.trim() ?? "Mizan Access <access@mizan.pay>";

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: notifyFrom,
      to: notifyTo,
      subject: "New production access request",
      text: [
        "A new access request was submitted through the website.",
        "",
        `Email: ${record.email}`,
        `Request ID: ${requestId}`,
        `IP hash: ${record.ipHash}`,
        `User agent: ${record.userAgent ?? "unknown"}`,
        `Company: ${record.company ?? "not provided"}`,
        `Monthly volume: ${record.volume ?? "not provided"}`,
        `Verified human: ${record.honeypot ? "no" : "yes"}`,
      ].join("\n"),
    });
    return { sent: true };
  } catch {
    // A notification failure must NOT fail the request: the record was already
    // persisted. Log safely (request id only — no PII, no raw provider error
    // detail) and let the route return success.
    console.error(`[access] notification failed for request ${requestId}`);
    return { sent: false, reason: "provider_error" };
  }
}

export function accessStatus(): { dbConfigured: boolean; emailConfigured: boolean } {
  return {
    dbConfigured: isDbConfigured(),
    emailConfigured: Boolean(process.env.RESEND_API_KEY && process.env.NOTIFY_TO),
  };
}

export { resetDbPoolForTests };