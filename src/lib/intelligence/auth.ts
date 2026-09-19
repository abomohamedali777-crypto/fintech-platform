import { timingSafeEqual } from "node:crypto";

function constantEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Bearer-token check with constant-time comparison.
 *
 * When `expected` is null the auth hook is disabled (the token was never
 * configured) and every request is accepted.
 */
export function authorizeBearer(
  header: string | null,
  expected: string | null,
): boolean {
  if (!expected) return true;
  if (!header || !header.startsWith("Bearer ")) return false;
  const token = header.slice(7).trim();
  if (!token) return false;
  return constantEqual(token, expected);
}