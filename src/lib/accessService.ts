import { Pool } from "pg";
import { Resend } from "resend";

export type AccessRequest = {
  email: string;
  ipHash: string;
  userAgent: string | null;
  honeypot: boolean;
};

let pool: Pool | null = null;

function getPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  if (!pool) {
    pool = new Pool({ connectionString, max: 10, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export async function persistAccessRequest(
  request: AccessRequest,
): Promise<{ persisted: boolean; id?: string }> {
  const db = getPool();
  if (!db) return { persisted: false };

  const result = await db.query(
    `INSERT INTO access_requests (email, ip_hash, user_agent, honeypot)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [request.email, request.ipHash, request.userAgent, request.honeypot],
  );

  return { persisted: true, id: result.rows[0]?.id as string | undefined };
}

export async function notifyAccessRequest(
  request: AccessRequest,
  requestId: string,
): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const notifyTo = process.env.NOTIFY_TO;
  if (!apiKey || !notifyTo) return { sent: false };

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: process.env.NOTIFY_FROM ?? "Mizan Access <access@mizan.pay>",
    to: notifyTo,
    subject: "New production access request",
    text: [
      "A new access request was submitted.",
      "",
      `Email: ${request.email}`,
      `Request ID: ${requestId}`,
      `IP hash: ${request.ipHash}`,
      `User agent: ${request.userAgent ?? "unknown"}`,
      `Verified human: ${request.honeypot ? "no" : "yes"}`,
    ].join("\n"),
  });

  return { sent: true };
}