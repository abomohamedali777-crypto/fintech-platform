import { Pool } from "pg";

let pool: Pool | null = null;

/** Stable, minimal diagnostic for pg/node errors — never the raw message. */
export function sanitizeDbError(err: unknown): string {
  const code = (err as { code?: unknown } | null)?.code;
  return typeof code === "string" && code.length > 0 ? `code=${code}` : "unknown";
}

export function sslConfig(): { rejectUnauthorized: boolean } {
  // Verify the database server certificate by default.
  // Set DATABASE_SSL_REJECT_UNAUTHORIZED=false ONLY for self-signed/local databases.
  return { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false" };
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getDbPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) return null;
  if (!pool) {
    pool = new Pool({
      connectionString,
      max: 4,
      ssl: sslConfig(),
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 60_000,
      statement_timeout: 10_000,
    });
    // Prevent a single idle-client error from crashing the process. Log a
    // sanitized code only — never the raw pg message (may embed connection
    // details).
    pool.on("error", (err) => {
      console.error(`[db] idle client error (${sanitizeDbError(err)})`);
    });
  }
  return pool;
}

export function resetDbPoolForTests(): void {
  pool = null;
}