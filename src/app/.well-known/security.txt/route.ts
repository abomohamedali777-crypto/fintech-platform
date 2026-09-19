import { getSiteUrl } from "@/lib/siteUrl";

export const dynamic = "force-dynamic";

export function GET() {
  const canonical = `${getSiteUrl()}/.well-known/security.txt`;
  const contact = process.env.SECURITY_CONTACT ?? "security@mizan.pay";
  const policy = [
    `Contact: mailto:${contact}`,
    "Expires: 2027-09-01T00:00:00.000Z",
    "Preferred-Languages: en",
    `Canonical: ${canonical}`,
  ].join("\n");

  return new Response(`${policy}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    },
  });
}