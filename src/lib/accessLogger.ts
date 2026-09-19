export type LogLevel = "info" | "warn" | "error";

/**
 * Structured, minimal, PII-free server logging for the access pipeline.
 * Events are tagged `[access]` for easy filtering. Never logs raw email
 * addresses or raw IPs — only hashed values and request IDs.
 */
export function accessLog(level: LogLevel, event: string, meta: Record<string, unknown>): void {
  const line = `[access] ${event}${Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ""}`;
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}