"use client";

import { Scale, Mail } from "lucide-react";
import { useSettings } from "@/lib/site";
import type { TKey, ExtraKey } from "@/data/translations";

export default function Footer() {
  const { t } = useSettings();
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@mizan.pay";

  const columns: {
    labelKey: "footer.platform" | "footer.company" | "footer.legal";
    items: { labelKey: TKey | ExtraKey; href?: string; target?: string }[];
  }[] = [
    {
      labelKey: "footer.platform",
      items: [
        { labelKey: "nav.solutions", target: "#solutions" },
        { labelKey: "ft.work", target: "#solutions" },
        { labelKey: "nav.platform", target: "#platform" },
        { labelKey: "vm.badge", target: "#roi" },
      ],
    },
    {
      labelKey: "footer.company",
      items: [
        { labelKey: "nav.security", target: "#security" },
        { labelKey: "fq.badge", target: "#faq" },
        { labelKey: "requestAccess", target: "#access" },
      ],
    },
    {
      labelKey: "footer.legal",
      items: [
        { labelKey: "privacyPolicy", href: "/privacy" },
        { labelKey: "termsConditions", href: "/terms" },
        { labelKey: "cookiePolicy", href: "/cookies-policy" },
        { labelKey: "refundPolicy", href: "/refund-policy" },
      ],
    },
  ];

  return (
    <footer className="border-t border-slate-800 bg-canvas pb-10 pt-16">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-[#b48f47] via-[#8a6a2a] to-[#5c4512] ring-1 ring-[#d9ae4e]/40">
                <Scale className="h-4 w-4 text-white" strokeWidth={1.75} />
              </span>
              <span className="font-serif text-[20px] font-semibold tracking-tight text-ink">Mizan</span>
            </div>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-slate">
              {t("footer.tagline")}
            </p>
            <address className="mt-6 max-w-xs text-[12px] leading-relaxed not-italic text-slate/80">
              {t("footer.office")}
              <br />
              <a
                href={`mailto:${supportEmail}`}
                className="mt-1 inline-flex items-center gap-1.5 font-semibold text-ink transition-colors duration-300 ease-out hover:text-accent"
              >
                <Mail className="h-3.5 w-3.5" strokeWidth={2} />
                {supportEmail}
              </a>
            </address>
          </div>

          {columns.map((col) => (
            <div key={col.labelKey} className="lg:col-span-2">
              <p className="font-mono text-[11px] font-medium uppercase tracking-tight text-slate">
                {t(col.labelKey)}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.items.map((item) => (
                  <li key={item.labelKey}>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="text-[13px] font-medium text-slate transition-colors duration-300 ease-out hover:text-ink"
                      >
                        {t(item.labelKey)}
                      </a>
                    ) : (
                      <a
                        href={`#${item.target?.replace("#", "")}`}
                        onClick={(e) => {
                          e.preventDefault();
                          document.querySelector(item.target!)?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="text-[13px] font-medium text-slate transition-colors duration-300 ease-out hover:text-ink"
                      >
                        {t(item.labelKey)}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="lg:col-span-2">
            <p className="font-mono text-[11px] font-medium uppercase tracking-tight text-slate">
              {t("dash.status")}
            </p>
            <ul className="mt-4 space-y-2.5 text-[13px] font-medium text-slate">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-sm bg-emerald-500" />
                {t("footer.systems")} · {t("sim.badge")}
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-sm bg-emerald-500" />
                {t("ft.work")} · {t("sim.badge")}
              </li>
            </ul>
            <a
              href="#access"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector("#access")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="mt-5 inline-block rounded-md border border-slate-800 px-4 py-2 text-[13px] font-semibold tracking-tight text-ink transition-colors duration-300 ease-out hover:border-accent/40 hover:text-accent"
            >
              {t("requestAccess")}
            </a>
          </div>
        </div>

        <p className="mt-8 max-w-2xl text-[11px] leading-relaxed text-slate/60">
          {t("footer.demoNote")}
        </p>

        <div className="mt-6 flex flex-col items-start justify-between gap-4 border-t border-slate-800 pt-6 sm:flex-row sm:items-center">
          <p className="text-[12px] text-slate">
            © 2026 Mizan. {t("footer.copyright")}
          </p>
          <p className="max-w-md text-right font-mono text-[11px] uppercase tracking-tight text-slate">
            {t("footer.simLine")}
          </p>
        </div>
      </div>
    </footer>
  );
}