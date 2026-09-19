"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useSettings } from "@/lib/site";
import Reveal from "@/components/Reveal";
import SectionHeader from "@/components/SectionHeader";
import type { ExtraKey } from "@/data/translations";

const qa: { q: ExtraKey; a: ExtraKey }[] = [
  { q: "fq.1q", a: "fq.1a" },
  { q: "fq.2q", a: "fq.2a" },
  { q: "fq.3q", a: "fq.3a" },
  { q: "fq.4q", a: "fq.4a" },
  { q: "fq.5q", a: "fq.5a" },
];

export default function FAQ() {
  const { t } = useSettings();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-20 bg-canvas py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <Reveal>
          <SectionHeader
            index="06"
            eyebrow={t("fq.badge")}
            title={t("fq.title")}
            sub={t("fq.sub")}
          />
        </Reveal>

        <div className="mt-12 max-w-3xl border-t border-slate-800">
          {qa.map((item, i) => {
            const isOpen = open === i;
            const panelId = `faq-panel-${i}`;
            const headerId = `faq-header-${i}`;
            return (
              <div key={item.q} className="border-b border-slate-800">
                <h3>
                  <button
                    id={headerId}
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="group flex w-full items-baseline gap-6 py-5 text-left"
                  >
                    <span className="font-mono text-[11px] tabular-nums text-slate/60">
                      0{i + 1}
                    </span>
                    <span className="flex-1 text-[15px] font-semibold tracking-tight text-ink transition-colors duration-300 ease-out group-hover:text-accent">
                      {t(item.q)}
                    </span>
                    <span
                      className={`mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-slate-800 text-ink transition-transform duration-300 ease-out ${
                        isOpen ? "rotate-45" : ""
                      }`}
                      aria-hidden
                    >
                      <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                    </span>
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={headerId}
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="pb-6 pl-14 pr-10 text-[14px] leading-relaxed text-slate">
                      {t(item.a)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}