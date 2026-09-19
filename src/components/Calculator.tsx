"use client";

import { useState } from "react";
import { ArrowRight, TrendingDown } from "lucide-react";
import {
  volumeTier,
  bankMonthlyCost,
  platformMonthlyCost,
  avgTransactionSize,
  fxMonthlyCost,
  platformFxMonthlyCost,
  opsMonthlyCost,
  legacyMonthlyCost,
  mizanMonthlyCost,
  costImpactAnnual,
  costImpactPct,
  floatBenefitMonthly,
} from "@/lib/pricing";
import { useSettings } from "@/lib/site";
import Reveal from "@/components/Reveal";
import RangeSlider from "@/components/RangeSlider";
import SectionHeader from "@/components/SectionHeader";
import type { ExtraKey } from "@/data/translations";

const CUR = {
  USD: { code: "USD", rate: 1, locale: "en-US", label: "USD" },
  EUR: { code: "EUR", rate: 0.92, locale: "de-DE", label: "EUR" },
  AED: { code: "AED", rate: 3.67, locale: "en-AE", label: "AED" },
} as const;

type Cur = keyof typeof CUR;

const sliderMin = 1000;
const sliderMax = 50000;

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

export default function Calculator() {
  const { t } = useSettings();
  const [monthlyVolume, setMonthlyVolume] = useState(12000000);
  const [scale, setScale] = useState(1);
  const [cur, setCur] = useState<Cur>("USD");

  const effectiveVolume = monthlyVolume * scale;
  const cur_ = CUR[cur];

  const fmt = (n: number) =>
    new Intl.NumberFormat(cur_.locale, {
      style: "currency",
      currency: cur_.code,
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(n * cur_.rate);

  const feesLegacy = bankMonthlyCost(effectiveVolume);
  const feesMizan = platformMonthlyCost(effectiveVolume);
  const fxLegacy = fxMonthlyCost(effectiveVolume, 0.4);
  const fxMizan = platformFxMonthlyCost(effectiveVolume, 0.4);
  const ops = opsMonthlyCost();
  const legacyTotal = legacyMonthlyCost(effectiveVolume, 0.4);
  const mizanTotal = mizanMonthlyCost(effectiveVolume, 0.4);
  const savingsAnnual = costImpactAnnual(effectiveVolume, 0.4);
  const savingsPct = costImpactPct(effectiveVolume, 0.4);
  const floatMonthly = floatBenefitMonthly(effectiveVolume);

  const rows: { labelKey: ExtraKey; legacy: number; mizan: number }[] = [
    { labelKey: "vm.fees", legacy: feesLegacy, mizan: feesMizan },
    { labelKey: "vm.fx", legacy: fxLegacy, mizan: fxMizan },
    { labelKey: "vm.ops", legacy: ops, mizan: 0 },
  ];

  const chartMax = 1.15 * legacyTotal;
  const bars = MONTHS.map((_, i) => ({
    legacy: legacyTotal * (1 + i * 0.004 + Math.sin(i * 1.7) * 0.02),
    mizan: mizanTotal * (1 + i * 0.003 + Math.sin(i * 1.7 + 0.8) * 0.018),
  }));

  const scales = [1, 2, 4] as const;

  return (
    <section id="roi" className="scroll-mt-20 border-y border-slate-800 bg-mist py-24 dark:bg-canvas">
      <div className="mx-auto max-w-[1200px] px-6">
        <Reveal>
          <SectionHeader
            index="04"
            eyebrow={t("vm.badge")}
            title={t("vm.title")}
            sub={t("vm.sub")}
          />
        </Reveal>

        <div className="mt-12 grid gap-4 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <div className="flex h-full flex-col gap-5 rounded-md border border-slate-800 bg-canvas p-6">
              <div className="flex items-center justify-between gap-4">
                <label htmlFor="volume" className="text-[13px] font-medium tracking-tight text-ink">
                  {t("vm.vol")}
                </label>
                <div className="flex items-center gap-1 rounded-md border border-slate-800 p-1" role="group" aria-label={t("roi.scale")}>
                  {scales.map((s) => (
                    <button
                      key={s}
                      onClick={() => setScale(s)}
                      aria-pressed={scale === s}
                      className={`rounded-md px-3 py-1 font-mono text-[12px] font-semibold tracking-tight transition-all duration-300 ease-out ${
                        scale === s ? "bg-accent text-white" : "text-slate hover:text-ink"
                      }`}
                    >
                      {s}×
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <p className="font-mono text-[26px] font-semibold tracking-tight tabular-nums text-ink">
                    {fmt(effectiveVolume)}
                  </p>
                  <span className="font-mono text-[11px] tracking-tight text-slate">/ month</span>
                </div>
                <div className="mt-4">
                  <RangeSlider
                    id="volume"
                    min={sliderMin}
                    max={sliderMax}
                    step={1000}
                    value={monthlyVolume}
                    onChange={setMonthlyVolume}
                    ariaLabel={t("vm.vol")}
                  />
                </div>
                <div className="mt-2 flex justify-between font-mono text-[11px] tracking-tight text-slate">
                  <span>{fmt(sliderMin * 1000)}</span>
                  <span>{fmt(sliderMax * 1000)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <label className="text-[12px] font-medium tracking-tight text-ink">{t("calc.currency")}</label>
                <div className="grid grid-cols-3 gap-1 rounded-md border border-slate-800 p-1" role="group" aria-label={t("calc.currency")}>
                  {(Object.keys(CUR) as Cur[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => setCur(c)}
                      aria-pressed={cur === c}
                      className={`rounded-md py-1.5 font-mono text-[12px] font-semibold tracking-tight transition-all duration-300 ease-out ${
                        cur === c ? "bg-accent text-white" : "text-slate hover:text-ink"
                      }`}
                    >
                      {CUR[c].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-auto space-y-2 border-t border-slate-800 pt-4">
                <div className="flex items-center justify-between rounded-md border border-slate-800 px-4 py-3">
                  <span className="text-[13px] text-slate">{t("vm.avg")}</span>
                  <span className="font-mono text-[13px] font-semibold tabular-nums text-ink">
                    {fmt(avgTransactionSize(effectiveVolume))}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-slate-800 px-4 py-3">
                  <span className="text-[13px] text-slate">{t("vm.tier")}</span>
                  <span className="font-mono text-[13px] font-semibold tabular-nums text-ink">
                    {t("vm.tierValue", { tier: volumeTier(effectiveVolume) })}
                  </span>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08} className="lg:col-span-7">
            <div className="flex h-full flex-col rounded-md border border-slate-800 bg-canvas p-6">
              <div className="flex items-center justify-between">
                <p className="text-[14px] font-semibold tracking-tight text-ink">
                  {t("vm.projected")}
                </p>
                <span className="font-mono text-[11px] tracking-tight text-slate">monthly · annualized</span>
              </div>

              <div className="mt-4">
                <div className="grid grid-cols-[1fr_7rem_7rem] items-center gap-3 border-b border-slate-800 pb-2 font-mono text-[10px] uppercase tracking-tight text-slate">
                  <span />
                  <span className="text-right">{t("vm.legacy")}</span>
                  <span className="text-right">{t("vm.mizan")}</span>
                </div>
                <dl>
                  {rows.map((r) => (
                    <div
                      key={r.labelKey}
                      className="grid grid-cols-[1fr_7rem_7rem] items-baseline gap-3 border-b border-slate-800 py-3"
                    >
                      <dt className="text-[13px] text-slate">{t(r.labelKey)}</dt>
                      <dd className="text-right font-mono text-[13px] font-medium tabular-nums text-ink">
                        {fmt(r.legacy)}
                      </dd>
                      <dd className="text-right font-mono text-[13px] font-medium tabular-nums text-ink">
                        {fmt(r.mizan)}
                      </dd>
                    </div>
                  ))}
                  <div className="grid grid-cols-[1fr_7rem_7rem] items-baseline gap-3 py-3">
                    <dt className="text-[13px] font-semibold text-ink">{t("roi.total")}</dt>
                    <dd className="text-right font-mono text-[13px] font-semibold tabular-nums text-ink">
                      {fmt(legacyTotal)}
                    </dd>
                    <dd className="text-right font-mono text-[13px] font-semibold tabular-nums text-accent">
                      {fmt(mizanTotal)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-medium tracking-tight text-ink">{t("vm.breakdown")}</p>
                  <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-tight text-slate">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-sm bg-slate/30" /> {t("vm.legacy")}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-sm bg-accent" /> {t("vm.mizan")}
                    </span>
                  </div>
                </div>
                <svg viewBox="0 0 240 64" className="mt-2 h-40 w-full" aria-hidden>
                  {[0.25, 0.5, 0.75, 1].map((f) => (
                    <line
                      key={f}
                      x1="0"
                      x2="240"
                      y1={64 - f * 56}
                      y2={64 - f * 56}
                      stroke="rgb(30 41 59 / 0.5)"
                      strokeWidth="0.5"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                  {bars.map((b, i) => {
                    const x = i * 20 + 2;
                    return (
                      <g key={i}>
                        <rect
                          x={x}
                          y={64 - (b.legacy / chartMax) * 56}
                          width="8"
                          height={(b.legacy / chartMax) * 56}
                          fill="rgb(var(--slate) / 0.35)"
                          rx="1"
                        />
                        <rect
                          x={x + 10}
                          y={64 - (b.mizan / chartMax) * 56}
                          width="8"
                          height={(b.mizan / chartMax) * 56}
                          fill="rgb(var(--accent))"
                          rx="1"
                        />
                      </g>
                    );
                  })}
                </svg>
                <div className="mt-1 flex justify-between font-mono text-[9px] uppercase tracking-tight text-slate/70">
                  {MONTHS.map((m, i) => (
                    <span key={i}>{m}</span>
                  ))}
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-3 rounded-md border border-slate-800 bg-panel p-5 text-white sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-tight text-white/50">
                    <TrendingDown className="h-3.5 w-3.5 text-[#d9ae4e]" strokeWidth={2} />
                    {t("vm.savings")}
                  </p>
                  <p className="mt-1 font-mono text-[26px] font-semibold tracking-tight tabular-nums text-[#f0d285]">
                    {fmt(savingsAnnual)}
                  </p>
                  <p className="mt-1 text-[12px] text-white/60">
                    {t("vm.savingsPct", { pct: savingsPct.toFixed(1) })}
                    <span className="mx-2 text-white/25">·</span>
                    {t("vm.float")} {fmt(floatMonthly)}/mo
                  </p>
                </div>
                <a
                  href="#access"
                  className="inline-flex shrink-0 items-center gap-2 rounded-md bg-gradient-to-b from-accent to-accent-strong px-5 py-3 text-sm font-semibold tracking-tight text-white shadow-gold transition-all duration-300 ease-out hover:brightness-110"
                >
                  {t("vm.cta")}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" strokeWidth={2.25} />
                </a>
              </div>
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-slate/70">{t("vm.footnote")}</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}