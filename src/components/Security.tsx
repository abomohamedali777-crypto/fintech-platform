"use client";

import {
  ShieldCheck,
  Lock,
  Fingerprint,
  Server,
  FileCheck,
  Radar,
} from "lucide-react";
import { useSettings } from "@/lib/site";
import Reveal from "@/components/Reveal";

const pillars = [
  { icon: Lock, titleKey: "sec.p1.t", descKey: "sec.p1.d" },
  { icon: Server, titleKey: "sec.p2.t", descKey: "sec.p2.d" },
  { icon: Fingerprint, titleKey: "sec.p3.t", descKey: "sec.p3.d" },
  { icon: Radar, titleKey: "sec.p4.t", descKey: "sec.p4.d" },
  { icon: FileCheck, titleKey: "sec.p5.t", descKey: "sec.p5.d" },
  { icon: ShieldCheck, titleKey: "sec.p6.t", descKey: "sec.p6.d" },
] as const;

export default function Security() {
  const { t } = useSettings();
  const scopes: [string, "align" | "sccBased" | "merchantScope"][] = [
    ["ISO/IEC 27001", "align"],
    ["SOC 2", "align"],
    ["GDPR", "sccBased"],
    ["PCI DSS", "merchantScope"],
  ];

  return (
    <section id="security" className="scroll-mt-20 bg-canvas py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border hairline bg-canvas px-4 py-1.5 text-[12px] font-medium text-slate shadow-micro">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
              {t("sec.badge")}
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight text-ink sm:text-4xl md:text-5xl">
              {t("sec.title")}
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-4 text-base leading-relaxed text-slate">
              {t("sec.sub")}
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <Reveal key={p.titleKey} delay={0.05 * i}>
                <div className="group relative overflow-hidden rounded-2xl border hairline bg-canvas p-7 shadow-micro transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lift">
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100 glow-top" />
                  <div className="relative flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mist transition-colors duration-300 ease-out group-hover:bg-accent/10">
                      <Icon className="h-5 w-5 text-accent" strokeWidth={1.75} />
                    </span>
                    <h3 className="text-[15px] font-semibold tracking-tight text-ink">
                      {t(p.titleKey)}
                    </h3>
                  </div>
                  <p className="relative mt-4 text-[13.5px] leading-relaxed text-slate">
                    {t(p.descKey)}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.1}>
        <div className="mx-auto mt-12 flex max-w-4xl flex-col gap-6 rounded-2xl border hairline bg-mist/50 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
            {scopes.map(([name, scopeKey]) => (
              <div key={name}>
                <p className="text-[14px] font-semibold tracking-tight text-ink">{name}</p>
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate">
                  {t(scopeKey)}
                </p>
              </div>
            ))}
          </div>
          <a
            href="#access"
            className="shrink-0 rounded-full bg-panel px-6 py-3 text-center text-[13px] font-semibold text-white transition-all duration-300 ease-out hover:bg-accent"
          >
            {t("sec.download")}
          </a>
        </div>
        </Reveal>
      </div>
    </section>
  );
}