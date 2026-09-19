const SITE_URL_ENV = process.env.SITE_URL?.trim().replace(/\/+$/, "") ?? "";

const vercelUrl = (
  process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || ""
)
  .trim()
  .replace(/\/+$/, "");

export function getSiteUrl(): string {
  if (SITE_URL_ENV.startsWith("https://")) return SITE_URL_ENV;
  if (/^https?:\/\//.test(SITE_URL_ENV)) return SITE_URL_ENV;
  if (vercelUrl) return `https://${vercelUrl}`;
  return "http://localhost:3000";
}

export const siteUrl = getSiteUrl();

export function getCd(url: string): string {
  return url.replace(/^https?:\/\//, "");
}