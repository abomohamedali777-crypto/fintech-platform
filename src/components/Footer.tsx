"use client";

import { Github } from "lucide-react";

export default function Footer({
  onOpenLegal,
}: {
  onOpenLegal: (tab: "privacy" | "terms") => void;
}) {
  const scrollToId = (selector: string) => {
    document.querySelector(selector)?.scrollIntoView({ behavior: "smooth" });
  };

  const columns: { label: string; items: { label: string; action: () => void }[] }[] = [
    {
      label: "Platform",
      items: [
        { label: "B2B Treasury", action: () => scrollToId("#product") },
        { label: "Settlement Rails", action: () => scrollToId("#product") },
        { label: "Automated GRC", action: () => scrollToId("#product") },
        { label: "Cost Calculator", action: () => scrollToId("#infrastructure") },
      ],
    },
    {
      label: "Company",
      items: [
        { label: "Security", action: () => scrollToId("#security") },
        { label: "Request Access", action: () => scrollToId("#access") },
        { label: "Status", action: () => scrollToId("#security") },
      ],
    },
    {
      label: "Legal",
      items: [
        { label: "Privacy Policy", action: () => onOpenLegal("privacy") },
        { label: "Terms & Conditions", action: () => onOpenLegal("terms") },
        { label: "SLA Overview", action: () => onOpenLegal("terms") },
      ],
    },
  ];

  return (
    <footer className="border-t hairline bg-white pb-10 pt-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink">
                <Github className="h-4 w-4 text-white" strokeWidth={1.75} />
              </span>
              <span className="text-[15px] font-semibold tracking-tight text-ink">
                Meridian
              </span>
            </div>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-slate">
              Automated liquidity and settlement infrastructure for global B2B
              enterprises.
            </p>
            <p className="mt-4 text-[11px] font-medium uppercase tracking-wider text-slate">
              UAE · Delaware, USA
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.label}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate">
                {col.label}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <button
                      onClick={item.action}
                      className="text-[13px] font-medium text-slate transition-colors duration-300 ease-out hover:text-ink"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t hairline pt-6 sm:flex-row sm:items-center">
          <p className="text-[12px] text-slate">
            © 2026 Meridian Financial Infrastructure FZ-LLC. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] font-medium text-slate">
            <button onClick={() => onOpenLegal("privacy")} className="transition-colors duration-300 ease-out hover:text-ink">
              Privacy
            </button>
            <button onClick={() => onOpenLegal("terms")} className="transition-colors duration-300 ease-out hover:text-ink">
              Terms
            </button>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}