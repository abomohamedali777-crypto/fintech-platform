"use client";

import { useState, useEffect } from "react";
import { Check, Copy } from "lucide-react";
import { useSettings } from "@/lib/site";
import { prefersReducedMotion } from "@/lib/motion";
import Reveal from "@/components/Reveal";
import RangeSlider from "@/components/RangeSlider";
import SectionHeader from "@/components/SectionHeader";
import type { ExtraKey } from "@/data/translations";

const endpoints = [
  { id: "overview", label: "overview", path: "brief.json" },
  { id: "structure", label: "structure", path: "workstreams.json" },
  { id: "risk", label: "risk", path: "risk_flags.json" },
] as const;

const payloads: Record<string, string> = {
  overview: `{
  "matter": "mz_0001",
  "jurisdiction": "AE · SG · EU",
  "instruments": ["ISO 20022", "SEPA", "FPS"],
  "exposure": 4280000,
  "regulatory_flags": 2,
  "advisory": { "confidence": 0.92, "status": "in_review" }
}`,
  structure: `{
  "workstreams": ["finance", "legal", "compliance", "risk"],
  "review_loop": ["submit", "analyze", "review", "advise", "decide"],
  "evidence": "linked · timestamped",
  "confidentiality": "mutual NDA",
  "retention_days": 730
}`,
  risk: `{
  "regulatory_risk": "low",
  "contract_terms": ["net-30", "governing_law", "force_majeure"],
  "fx_exposure": 0.14,
  "cross_border_flags": ["sanctions_screened", "kyc_reviewed"],
  "advisory_confidence": 0.78
}`,
};

function TokenJSON({ text }: { text: string }) {
  const re = /("(?:[^"\\]|\\.)*"|\b-?\d+(?:\.\d+)?\b|\b(?:true|false|null)\b)/g;
  const out: React.ReactNode[] = [];
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last)
      out.push(
        <span key={i++} className="text-slate/50">
          {text.slice(last, m.index)}
        </span>,
      );
    const tok = m[0];
    const cls = tok.startsWith('"')
      ? "text-emerald-700 dark:text-emerald-400"
      : "text-[#8a6a2a] dark:text-[#d9ae4e]";
    out.push(
      <span key={i++} className={cls}>
        {tok}
      </span>,
    );
    last = m.index + tok.length;
  }
  if (last < text.length)
    out.push(
      <span key={i} className="text-slate/50">
        {text.slice(last)}
      </span>,
    );
  return <>{out}</>;
}

const flowStages: { id: string; titleKey: ExtraKey; noteKey: ExtraKey }[] = [
  { id: "submit", titleKey: "stg.1", noteKey: "stg.1n" },
  { id: "analyze", titleKey: "stg.2", noteKey: "stg.2n" },
  { id: "review", titleKey: "stg.3", noteKey: "stg.3n" },
  { id: "advise", titleKey: "stg.4", noteKey: "stg.4n" },
  { id: "decide", titleKey: "stg.5", noteKey: "stg.5n" },
];

const regions = [
  { id: "us", label: "US", base: 64 },
  { id: "eu", label: "EU", base: 71 },
  { id: "gcc", label: "GCC", base: 77 },
] as const;

const stageSpans = [
  "md:col-span-7",
  "md:col-span-5",
  "md:col-span-5",
  "md:col-span-7",
];

const featureCards: { titleKey: ExtraKey; descKey: ExtraKey; tag: string }[] = [
  { titleKey: "plat.c1.t", descKey: "plat.c1.d", tag: "01" },
  { titleKey: "plat.c2.t", descKey: "plat.c2.d", tag: "02" },
  { titleKey: "plat.c3.t", descKey: "plat.c3.d", tag: "03" },
  { titleKey: "plat.c4.t", descKey: "plat.c4.d", tag: "04" },
];

export default function BentoGrid() {
  const { t } = useSettings();
  const [tab, setTab] = useState<(typeof endpoints)[number]["id"]>("overview");
  const [copied, setCopied] = useState(false);
  const [stageIdx, setStageIdx] = useState(0);
  const [region, setRegion] = useState<(typeof regions)[number]["id"]>("gcc");
  const [span, setSpan] = useState(1200);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const timer = setInterval(() => setStageIdx((i) => (i + 1) % flowStages.length), 1600);
    return () => clearInterval(timer);
  }, []);

  const active = endpoints.find((e) => e.id === tab)!;
  const regionData = regions.find((r) => r.id === region)!;
  const coverage = Math.min(100, Math.round(regionData.base + (span / 5000) * 55));

  return (
    <section id="platform" className="scroll-mt-20 bg-canvas py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <Reveal>
          <SectionHeader
            index="03"
            eyebrow={t("plat.badge")}
            title={t("plat.title")}
            sub={t("plat.sub")}
          />
        </Reveal>

        <div className="mt-12 grid gap-4 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <div className="flex h-full flex-col overflow-hidden rounded-md border border-slate-800 bg-canvas/80">
              <div className="border-b border-slate-800 px-5 py-4">
                <p className="text-[14px] font-semibold tracking-tight text-ink">
                  {t("plat.brief.t")}
                </p>
                <p className="mt-0.5 font-mono text-[11px] tracking-tight text-slate">
                  {t("plat.brief.sub")}
                </p>
              </div>
              <div className="flex items-center justify-between gap-2 px-5 pt-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  {endpoints.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => setTab(e.id)}
                      aria-pressed={tab === e.id}
                      className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-[11px] tracking-tight transition-colors duration-300 ease-out ${
                        tab === e.id
                          ? "border-accent/50 bg-accent/10 text-ink"
                          : "border-transparent text-slate hover:border-slate-800 hover:text-ink"
                      }`}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(payloads[tab]).catch(() => {});
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1400);
                  }}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-800 px-2.5 py-1.5 font-mono text-[11px] tracking-tight text-slate transition-colors duration-300 ease-out hover:border-accent/40 hover:text-ink"
                  aria-live="polite"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-500" strokeWidth={2.5} />
                      copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" strokeWidth={2} />
                      copy
                    </>
                  )}
                </button>
              </div>
              <pre className="mt-3 flex-1 overflow-x-auto bg-mist/40 p-5 font-mono text-[12px] leading-[1.7] dark:bg-white/[0.02]">
                <code>
                  <TokenJSON text={payloads[tab]} />
                </code>
              </pre>
              <div className="flex items-center justify-between border-t border-slate-800 px-5 py-3 font-mono text-[11px] tracking-tight text-slate">
                <span>{active.path} · read-only</span>
                <span className="flex items-center gap-1 text-amber-500">
                  <span className="h-1.5 w-1.5 rounded-sm bg-amber-500" /> {t("sim.badge")}
                </span>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.06} className="lg:col-span-4">
            <div className="flex h-full flex-col overflow-hidden rounded-md border border-slate-800 bg-canvas/80">
              <div className="border-b border-slate-800 px-5 py-4">
                <p className="text-[14px] font-semibold tracking-tight text-ink">
                  {t("plat.flow.t")}
                </p>
                <p className="mt-0.5 font-mono text-[11px] tracking-tight text-slate">
                  {t("plat.flow.sub")}
                </p>
              </div>
              <div className="flex-1 px-5 py-4">
                <ol>
                  {flowStages.map((s, i) => {
                    const activeStage = stageIdx === i;
                    const done = stageIdx > i;
                    return (
                      <li key={s.id} className="relative flex gap-4">
                        <div className="flex flex-col items-center">
                          <button
                            onClick={() => setStageIdx(i)}
                            aria-pressed={activeStage}
                            aria-label={t(s.titleKey)}
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border font-mono text-[10px] transition-all duration-300 ease-out ${
                              done
                                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : activeStage
                                  ? "border-accent/50 bg-accent/10 text-accent"
                                  : "border-slate-800 text-slate/50"
                            }`}
                          >
                            {done ? <Check className="h-3 w-3" strokeWidth={2.5} /> : i + 1}
                          </button>
                          {activeStage && (
                            <span
                              aria-hidden
                              className="absolute -bottom-7 left-3 h-5 w-px animate-flow bg-accent"
                            />
                          )}
                          {i < flowStages.length - 1 && (
                            <span
                              aria-hidden
                              className={`ml-[11px] w-px flex-1 ${
                                done ? "bg-emerald-500/40" : "bg-slate-800"
                              }`}
                            />
                          )}
                        </div>
                        <div className="pb-5">
                          <p
                            className={`text-[13px] font-semibold tracking-tight transition-colors duration-300 ease-out ${
                              activeStage ? "text-ink" : done ? "text-slate" : "text-slate/50"
                            }`}
                          >
                            {t(s.titleKey)}
                            {done && (
                              <span className="ml-2 font-mono text-[10px] font-medium text-emerald-500">
                                done
                              </span>
                            )}
                            {activeStage && (
                              <span className="ml-2 font-mono text-[10px] font-medium text-accent">
                                in progress
                              </span>
                            )}
                          </p>
                          <p className="mt-0.5 font-mono text-[11px] text-slate/60">
                            {t(s.noteKey)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
              <div className="flex items-center justify-between border-t border-slate-800 px-5 py-3 font-mono text-[11px] tracking-tight text-slate">
                <span>loop · auto-advance</span>
                <span className="flex items-center gap-1 text-amber-500">
                  <span className="h-1.5 w-1.5 rounded-sm bg-amber-500" /> {t("sim.badge")}
                </span>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.12} className="lg:col-span-3">
            <div className="flex h-full flex-col overflow-hidden rounded-md border border-slate-800 bg-canvas/80">
              <div className="border-b border-slate-800 px-5 py-4">
                <p className="text-[14px] font-semibold tracking-tight text-ink">
                  {t("plat.cov.t")}
                </p>
                <p className="mt-0.5 font-mono text-[11px] tracking-tight text-slate">
                  {t("plat.cov.sub")}
                </p>
              </div>
              <div className="flex flex-1 flex-col px-5 py-4">
                <div className="flex items-center justify-between font-mono text-[11px] tracking-tight text-slate">
                  <span>portfolio.span</span>
                  <span>{span.toLocaleString()}</span>
                </div>
                <RangeSlider
                  id="coverage"
                  min={100}
                  max={5000}
                  step={100}
                  value={span}
                  onChange={setSpan}
                  ariaLabel={t("plat.cov.t")}
                />

                <div className="mt-4 flex items-center gap-1 rounded-md border border-slate-800 p-1" role="group" aria-label="Region">
                  {regions.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setRegion(r.id)}
                      aria-pressed={region === r.id}
                      className={`flex-1 rounded px-3 py-1.5 font-mono text-[11px] font-semibold tracking-tight transition-all duration-300 ease-out ${
                        region === r.id
                          ? "bg-accent text-white"
                          : "text-slate hover:text-ink"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

                <div className="mt-6 rounded-md border border-slate-800 bg-mist/40 p-4 dark:bg-white/[0.02]">
                  <p className="font-mono text-[10px] uppercase tracking-tight text-slate">
                    {t("plat.cov.est", { region: regionData.label })}
                  </p>
                  <p className="mt-1 font-mono text-[26px] font-semibold tracking-tight tabular-nums text-ink">
                    {coverage}
                    <span className="ml-1.5 text-[12px] font-medium text-slate">%</span>
                  </p>
                  <div className="mt-3 h-1 overflow-hidden rounded-sm bg-slate-800">
                    <div
                      className="h-full rounded-sm bg-accent transition-all duration-300 ease-out"
                      style={{ width: `${coverage}%` }}
                    />
                  </div>
                </div>
                <p className="mt-3 font-mono text-[10px] leading-relaxed text-slate/60">
                  {t("plat.cov.hint")}
                </p>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.05}>
          <div className="mt-6 grid gap-4 md:grid-cols-10">
            {featureCards.map((f, idx) => (
              <div
                key={f.titleKey}
                className={`${stageSpans[idx]} rounded-md border border-slate-800 bg-canvas/90 p-6 transition-all duration-300 ease-out hover:border-accent/40`}
              >
                <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <span className="font-mono text-[10px] uppercase tracking-tight text-slate/70">
                    {f.tag}
                  </span>
                  <span className="h-2.5 w-2.5 rounded-sm bg-gradient-to-br from-[#d9ae4e] to-[#8a6a2a]" />
                </div>
                <h3 className="mt-4 font-serif text-[22px] font-semibold tracking-tight text-ink">
                  {t(f.titleKey)}
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-slate">
                  {t(f.descKey)}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}