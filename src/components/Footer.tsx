"use client";

import { Scale } from "lucide-react";
import { useSettings } from "@/lib/site";
import type { TKey, ExtraKey } from "@/data/translations";

export default function Footer({
  onOpenLegal,
}: {
  onOpenLegal: (tab: "privacy" | "terms") => void;
}) {
  const { t } = useSettings();

  const scrollToId = (selector: string) => {
    document.querySelector(selector)?.scrollIntoView({ behavior: "smooth" });
  };

  const columns: {
    labelKey: "footer.platform" | "footer.company" | "footer.legal";
    items: {
      labelKey: TKey | ExtraKey;
      href?: string;
      action?: () => void;
    }[];
  }[] = [
    {
      labelKey: "footer.platform",
      items: [
        { labelKey: "tab.1", action: () => scrollToId("#product") },
        { labelKey: "linkRails", action: () => scrollToId("#product") },
        { labelKey: "tab.3", action: () => scrollToId("#product") },
        { labelKey: "linkCalc", action: () => scrollToId("#infrastructure") },
      ],
    },
    {
      labelKey: "footer.company",
      items: [
        { labelKey: "nav.security", action: () => scrollToId("#security") },
        { labelKey: "requestAccess", action: () => scrollToId("#access") },
        { labelKey: "linkStatus", action: () => scrollToId("#security") },
      ],
    },
    {
      labelKey: "footer.legal",
      items: [
        { labelKey: "privacyPolicy", href: "/privacy" },
        { labelKey: "termsConditions", href: "/terms" },
        { labelKey: "linkSla", action: () => onOpenLegal("terms") },
      ],
    },
  ];

  return (
    <footer className="border-t hairline bg-canvas pb-10 pt-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-panel">
                <Scale className="h-4 w-4 text-white" strokeWidth={1.75} />
              </span>
              <span className="text-[15px] font-semibold tracking-tight text-ink">
                Mizan
              </span>
            </div>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-slate">
              {t("footer.tagline")}
            </p>
            <p className="mt-4 text-[11px] font-medium uppercase tracking-wider text-slate">
              UAE · Delaware, USA
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.labelKey}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate">
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
                      <button
                        onClick={item.action}
                        className="text-[13px] font-medium text-slate transition-colors duration-300 ease-out hover:text-ink"
                      >
                        {t(item.labelKey)}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t hairline pt-6 sm:flex-row sm:items-center">
          <p className="text-[12px] text-slate">
            © 2026 Mizan Financial Infrastructure FZ-LLC. {t("footer.copyright")}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] font-medium text-slate">
            <button onClick={() => onOpenLegal("privacy")} className="transition-colors duration-300 ease-out hover:text-ink">
              {t("nav.privacy")}
            </button>
            <button onClick={() => onOpenLegal("terms")} className="transition-colors duration-300 ease-out hover:text-ink">
              {t("nav.terms")}
            </button>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {t("footer.systems")}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}