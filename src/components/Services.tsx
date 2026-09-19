"use client";

import { Landmark, Scale, ShieldCheck, Compass, ArrowRight } from "lucide-react";
import { useSettings } from "@/lib/site";
import Reveal from "@/components/Reveal";
import SectionHeader from "@/components/SectionHeader";
import type { ExtraKey } from "@/data/translations";

interface Service {
  icon: typeof Landmark;
  titleKey: ExtraKey;
  descKey: ExtraKey;
  bullets: ExtraKey[];
}

const services: Service[] = [
  {
    icon: Landmark,
    titleKey: "sol.fin.t",
    descKey: "sol.fin.d",
    bullets: ["sol.fin.b1", "sol.fin.b2", "sol.fin.b3"],
  },
  {
    icon: Scale,
    titleKey: "sol.leg.t",
    descKey: "sol.leg.d",
    bullets: ["sol.leg.b1", "sol.leg.b2", "sol.leg.b3"],
  },
  {
    icon: ShieldCheck,
    titleKey: "sol.grc.t",
    descKey: "sol.grc.d",
    bullets: ["sol.grc.b1", "sol.grc.b2", "sol.grc.b3"],
  },
  {
    icon: Compass,
    titleKey: "sol.str.t",
    descKey: "sol.str.d",
    bullets: ["sol.str.b1", "sol.str.b2", "sol.str.b3"],
  },
];

export default function Services() {
  const { t } = useSettings();

  return (
    <section id="solutions" className="scroll-mt-20 border-t border-slate-800 bg-mist/40 py-24 dark:bg-canvas">
      <div className="mx-auto max-w-[1200px] px-6">
        <Reveal>
          <SectionHeader
            index="02"
            eyebrow={t("sol.badge")}
            title={t("sol.title")}
            sub={t("sol.sub")}
          />
        </Reveal>

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          {services.map((s, i) => {
            const Icon = s.icon;
            return (
              <Reveal key={s.titleKey} delay={0.05 * i}>
                <div className="group flex h-full flex-col rounded-md border border-slate-800 bg-canvas p-6 transition-colors duration-300 ease-out hover:border-accent/40">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <span className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-mist transition-colors duration-300 ease-out group-hover:bg-accent/10">
                        <Icon className="h-5 w-5 text-accent" strokeWidth={1.75} />
                      </span>
                      <h3 className="font-serif text-[22px] font-semibold tracking-tight text-ink">
                        {t(s.titleKey)}
                      </h3>
                    </span>
                    <span className="font-mono text-[11px] tabular-nums text-slate/50">
                      0{i + 1}
                    </span>
                  </div>

                  <p className="mt-4 text-[14px] leading-relaxed text-slate">
                    {t(s.descKey)}
                  </p>

                  <ul className="mt-4 space-y-2">
                    {s.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-[13px] font-medium text-ink">
                        <span
                          aria-hidden
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-sm bg-gradient-to-r from-[#b48f47] to-[#d9ae4e]"
                        />
                        {t(b)}
                      </li>
                    ))}
                  </ul>

                  <a
                    href="#access"
                    className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-semibold tracking-tight text-ink transition-colors duration-300 ease-out hover:text-accent"
                  >
                    {t("sol.cta")}
                    <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" strokeWidth={2.25} />
                  </a>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}