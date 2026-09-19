import type { Metadata } from "next";
import { SettingsProvider } from "@/lib/site";
import { siteUrl } from "@/lib/siteUrl";
import "./globals.css";

const prePaintScript = `(function(){try{var t=localStorage.getItem('sc-theme');var d=t?t==='dark':false;var r=document.documentElement;if(d)r.classList.add('dark');else r.classList.remove('dark');var l=localStorage.getItem('sc-lang');var base=l||(navigator.language||'en').split('-')[0].toLowerCase();var rtl=['ar','ur','fa'];r.dir=rtl.indexOf(base)>-1?'rtl':'ltr';r.lang=base;}catch(e){}})();`;

const consentScript = `(function(){function apply(){try{var c=JSON.parse(localStorage.getItem('sc-cookies')||'null');var allowed=c&&c.fonts;var el=document.getElementById('gf-style');if(allowed){if(!el){var link=document.createElement('link');link.id='gf-style';link.rel='stylesheet';link.crossOrigin='anonymous';link.href='https://fonts.googleapis.com/css2?family=Cormorant:wght@500;600;700&family=Montserrat:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap';document.head.appendChild(link);}}else if(el){el.remove();}}catch(e){}}window.__mizanConsent=apply;apply();}());
if(document.fonts&&document.fonts.check('12px "Cormorant"')){var el=document.getElementById('gf-style');if(el)el.setAttribute('data-loaded','1');}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Mizan — Financial & Legal Intelligence Platform",
    template: "%s — Mizan",
  },
  description:
    "Mizan combines financial analysis, legal intelligence, regulatory insight, and risk assessment to help businesses navigate complex decisions with clarity.",
  openGraph: {
    type: "website",
    siteName: "Mizan",
    url: siteUrl,
    title: "Mizan — Financial & Legal Intelligence Platform",
    description:
      "Mizan combines financial analysis, legal intelligence, regulatory insight, and risk assessment to help businesses navigate complex decisions with clarity.",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script dangerouslySetInnerHTML={{ __html: consentScript }} />
      </head>
      <body className="bg-canvas text-ink" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: prePaintScript }} />
        <SettingsProvider>{children}</SettingsProvider>
      </body>
    </html>
  );
}