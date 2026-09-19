"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Scale } from "lucide-react";
import { useSettings } from "@/lib/site";
import { prefersReducedMotion } from "@/lib/motion";
import Reveal from "@/components/Reveal";
import Magnetic from "@/components/Magnetic";
import Telemetry from "@/components/Telemetry";
import type { ExtraKey } from "@/data/translations";

const disciplines: ExtraKey[] = ["flow.1", "flow.2", "flow.3", "flow.4", "flow.5"];

const audiences: ExtraKey[] = ["hero.aud1", "hero.aud2", "hero.aud3"];

const feed = [
  { jd: "AE / GCC", sig: "Regulatory update", status: "feed.cleared", weight: "0.92" },
  { jd: "SG / APAC", sig: "Contract clause", status: "feed.flagged", weight: "0.78" },
  { jd: "EU / EEA", sig: "FX exposure", status: "feed.monitored", weight: "0.85" },
  { jd: "UK / FCA", sig: "Compliance check", status: "feed.inReview", weight: "0.90" },
] as const;

const tickerItems = [
  "Financial Analysis",
  "Legal Intelligence",
  "Regulatory Monitoring",
  "Risk Assessment",
  "Cross-Border Structuring",
  "Islamic Finance",
  "Corporate Governance",
  "Market Entry",
  "Due Diligence",
  "Transaction Review",
];

export default function Hero() {
  const { t } = useSettings();
  const [tick, setTick] = useState(0);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const timer = setInterval(() => setTick((i) => (i + 1) % feed.length), 3600);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const timer = setInterval(() => setStep((i) => (i + 1) % disciplines.length), 3200);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="top" className="relative overflow-hidden bg-canvas">
      <div className="relative mx-auto max-w-[1200px] px-6 pb-16 pt-32 lg:pt-40">
        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-6">
            <Reveal>
              <a
                href="#solutions"
                className="inline-flex items-center gap-2 rounded-md border border-slate-800 bg-canvas/80 px-3 py-1.5 text-[12px] font-medium tracking-tight text-slate transition-all duration-300 hover:border-accent hover:text-ink"
              >
                <Scale className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
                {t("hero.badge")}
              </a>
            </Reveal>

            <Reveal delay={0.08}>
              <h1 className="mt-6 max-w-[14em] text-[2.7rem] font-medium leading-[1.05] tracking-tight text-ink sm:text-[3.4rem] md:text-[4rem]">
                {t("hero.title")}
              </h1>
            </Reveal>

            <Reveal delay={0.16}>
              <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-slate">
                {t("hero.sub")}
              </p>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Magnetic className="inline-flex" strength={0.25}>
                  <a
                    href="#access"
                    className="group inline-flex items-center gap-2 rounded-md bg-gradient-to-b from-accent to-accent-strong px-5 py-3 text-sm font-semibold tracking-tight text-white shadow-gold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-gold-lg"
                  >
                    {t("requestAccess")}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 rtl:rotate-180" strokeWidth={2.25} />
                  </a>
                </Magnetic>
                <Magnetic className="inline-flex" strength={0.25}>
                  <a
                    href="#platform"
                    className="inline-flex items-center gap-2 rounded-md border border-slate-800 bg-canvas/85 px-5 py-3 text-sm font-semibold tracking-tight text-ink transition-all duration-300 hover:border-accent/40"
                  >
                    {t("hero.ctaSecondary")}
                  </a>
                </Magnetic>
              </div>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="mt-12 flex flex-col gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:items-center sm:gap-8">
                <p className="font-mono text-[11px] uppercase tracking-tight text-slate">
                  {t("hero.trustLabel")}
                </p>
                <ul className="flex flex-wrap gap-x-6 gap-y-1">
                  {audiences.map((k) => (
                    <li
                      key={k}
                      className="font-mono text-[11px] font-medium tracking-wide text-slate/80"
                    >
                      {t(k)}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-6">
            <Reveal delay={0.1}>
              <div className="overflow-hidden rounded-md border border-slate-800 bg-canvas/90">
                <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-5 py-3.5">
                  <p className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-tight text-ink">
                    <Scale className="h-3.5 w-3.5 text-accent" strokeWidth={2} aria-hidden />
                    {t("int.center")}
                  </p>
                  <span className="flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-tight text-amber-500">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-sm bg-amber-400 opacity-60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-sm bg-amber-500" />
                    </span>
                    {t("sim.environment")}
                  </span>
                </div>

                <div className="border-b border-slate-800 px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-[10px] uppercase tracking-tight text-slate">
                      {t("flow.label")}
                    </p>
                    <span className="font-mono text-[10px] uppercase tracking-tight text-slate/50">
                      {t("sim.badge")}
                    </span>
                  </div>
                  <ul className="mt-3 flex flex-wrap items-center gap-x-0.5 gap-y-2">
                    {disciplines.map((k, i) => (
                      <li key={k} className="flex items-center gap-0.5">
                        <span
                          className={`flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[12px] font-semibold tracking-tight transition-colors duration-300 ${
                            step === i
                              ? "bg-accent/10 text-accent"
                              : "text-slate"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-sm ${
                              step === i ? "animate-flow bg-accent" : "bg-slate/40"
                            }`}
                            aria-hidden
                          />
                          {t(k)}
                        </span>
                        {i < disciplines.length - 1 && (
                          <ArrowRight
                            className="h-3 w-3 text-slate/40 rtl:rotate-180"
                            strokeWidth={2}
                            aria-hidden
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-b border-slate-800 px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-[10px] uppercase tracking-tight text-slate">
                      {t("feed.title")}
                    </p>
                    <span className="font-mono text-[10px] uppercase tracking-tight text-slate/50">
                      {t("sim.demoData")}
                    </span>
                  </div>
                  <ul className="mt-2">
                    {feed.map((row, i) => {
                      const isCurrent = i === tick;
                      return (
                        <li
                          key={i}
                          aria-current={isCurrent ? "true" : undefined}
                          className={`flex items-center justify-between border-t border-slate-800/50 py-2 font-mono text-[11px] transition-colors duration-300 ${
                            isCurrent ? "bg-accent/[0.06]" : ""
                          }`}
                        >
                          <span className="w-16 shrink-0 tabular-nums text-slate/60">{row.jd}</span>
                          <span className="flex-1 px-2 font-medium text-ink">{row.sig}</span>
                          <span className="w-14 shrink-0 text-right tabular-nums text-slate/60">{row.weight}</span>
                          <span
                            className={`w-20 shrink-0 text-right font-medium ${
                              row.status === "feed.cleared"
                                ? "text-emerald-500"
                                : row.status === "feed.flagged"
                                  ? "text-amber-500"
                                  : row.status === "feed.inReview"
                                    ? "text-slate"
                                    : "text-accent"
                            }`}
                          >
                            {t(row.status)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-2 border-t border-slate-800 pt-2 font-mono text-[9px] uppercase tracking-tight text-slate/50">
                    {t("feed.note")}
                  </p>
                </div>

                <Telemetry />
              </div>
            </Reveal>
          </div>
        </div>

        <div aria-hidden className="relative mt-20 overflow-hidden border-t border-slate-800 pt-5">
          <div className="animate-ticker flex w-max items-center gap-12">
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <span
                key={i}
                className="flex items-center gap-2.5 font-mono text-[12px] font-medium tracking-tight text-slate"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-sm bg-gradient-to-r from-[#b48f47] to-[#d9ae4e]" />
                {item}
              </span>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-canvas to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-canvas to-transparent" />
        </div>
      </div>
    </section>
  );
}