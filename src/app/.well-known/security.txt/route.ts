export const dynamic = "force-static";

const policy = [
  "Contact: mailto:security@enterprise.com",
  "Expires: 2027-09-01T00:00:00.000Z",
  "Preferred-Languages: en",
  "Canonical: https://localhost/.well-known/security.txt",
  "Policy: https://www.google.com/bugbounty",
].join("\n");

export function GET() {
  return new Response(`${policy}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}