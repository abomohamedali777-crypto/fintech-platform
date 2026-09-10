import type { Metadata } from "next";
import "./globals.css";

const site = "https://meridian.finance";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: {
    default: "Meridian — Automated Liquidity & Settlement Infrastructure",
    template: "%s — Meridian",
  },
  description:
    "Institutional-grade API primitives for automated treasury, cross-border flows, and programmable compliance.",
  openGraph: {
    type: "website",
    siteName: "Meridian",
    url: site,
    title: "Meridian — Automated Liquidity & Settlement Infrastructure",
    description:
      "Institutional-grade API primitives for automated treasury, cross-border flows, and programmable compliance.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-canvas text-ink">{children}</body>
    </html>
  );
}