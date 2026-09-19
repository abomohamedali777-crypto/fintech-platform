import type { Metadata } from "next";
import { SettingsProvider } from "@/lib/site";
import "./globals.css";

const site = "https://mizan.pay";

const prePaintScript = `(function(){try{var t=localStorage.getItem('sc-theme');var d=t?t==='dark':window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;var r=document.documentElement;if(d)r.classList.add('dark');else r.classList.remove('dark');var l=localStorage.getItem('sc-lang');var base=l||(navigator.language||'en').split('-')[0].toLowerCase();var rtl=['ar','ur','fa'];r.dir=rtl.indexOf(base)>-1?'rtl':'ltr';r.lang=base;}catch(e){}})();`;

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: {
    default: "Mizan — Automated Liquidity & Settlement Infrastructure",
    template: "%s — Mizan",
  },
  description:
    "Institutional-grade API primitives for automated treasury, cross-border flows, and programmable compliance.",
  openGraph: {
    type: "website",
    siteName: "Mizan",
    url: site,
    title: "Mizan — Automated Liquidity & Settlement Infrastructure",
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
      <body className="bg-canvas text-ink">
        <script dangerouslySetInnerHTML={{ __html: prePaintScript }} />
        <SettingsProvider>{children}</SettingsProvider>
      </body>
    </html>
  );
}