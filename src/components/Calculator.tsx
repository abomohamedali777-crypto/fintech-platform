"use client";

import { useState } from "react";
import { TrendingDown } from "lucide-react";
import { Calculator as CalculatorIcon } from "lucide-react";
import {
  volumeTier,
  bankMonthlyCost,
  platformMonthlyCost,
  annualSavings,
  savingsPercentage,
  avgTransactionSize,
} from "@/lib/pricing";
import { useSettings } from "@/lib/site";
import Reveal from "@/components/Reveal";

const sliderMin = 1000;
const sliderMax = 50000;
const maxCostForBar = 65000;

function fmtUSD(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function Calculator() {
  const { t } = useSettings();
  const [monthlyVolume, setMonthlyVolume] = useState(12000000);

  const tier = volumeTier(monthlyVolume);
  const bankPrice = bankMonthlyCost(monthlyVolume);
  const platformPrice = platformMonthlyCost(monthlyVolume);
  const estAnnualSavings = annualSavings(monthlyVolume);
  const savingsPct = savingsPercentage(monthlyVolume);

  return (
    <section id="infrastructure" className="scroll-mt-20 bg-mist py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border hairline bg-canvas px-4 py-1.5 text-[12px] font-medium text-slate shadow-micro">
              <CalculatorIcon className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
              {t("calc.badge")}
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight text-ink sm:text-4xl md:text-5xl">
              {t("calc.title")}
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-4 text-base leading-relaxed text-slate">
              {t("calc.sub")}
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.12}>
        <div className="mx-auto mt-14 max-w-4xl overflow-hidden rounded-2xl border hairline bg-canvas shadow-lift">
          <div className="grid gap-0 md:grid-cols-2">
            <div className="border-b hairline p-8 md:border-b-0 md:border-r">
              <label htmlFor="volume" className="text-[13px] font-medium text-ink">
                {t("calc.vol")}
              </label>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-ink">
                {fmtUSD(monthlyVolume)}
              </p>
              <input
                id="volume"
                type="range"
                min={sliderMin}
                max={sliderMax}
                step={1000}
                value={monthlyVolume}
                onChange={(e) => setMonthlyVolume(Number(e.target.value))}
                className="mt-6 w-full cursor-pointer appearance-none rounded-full accent-accent range-thumb"
                style={{ accentColor: "#0066CC" }}
              />
              <div className="mt-2 flex justify-between text-[11px] font-medium text-slate">
                <span>{fmtUSD(sliderMin * 1000)}</span>
                <span>{fmtUSD(sliderMax * 1000)}</span>
              </div>

              <div className="mt-8 space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-mist px-4 py-3">
                  <span className="text-[13px] text-slate">
                    {t("calc.avg")}
                  </span>
                  <span className="text-[13px] font-semibold text-ink">
                    {fmtUSD(avgTransactionSize(monthlyVolume))}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-mist px-4 py-3">
                  <span className="text-[13px] text-slate">
                    {t("calc.tier")}
                  </span>
                  <span className="text-[13px] font-semibold text-ink">
                    {t("calc.tierValue", { tier })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col p-8">
              <p className="text-[13px] font-medium text-ink">
                {t("calc.projected")}
              </p>

              <div className="mt-5 space-y-4">
                <div className="flex items-end justify-between">
                  <span className="text-[12px] text-slate">
                    {t("calc.bank")}
                  </span>
                  <span className="text-[13px] font-semibold text-ink tabular-nums">
                    {fmtUSD(bankPrice)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-mist">
                  <div
                    className="h-full rounded-full bg-slate/60 transition-all duration-700 ease-out"
                    style={{ width: `${Math.min(100, (bankPrice / maxCostForBar) * 100)}%` }}
                  />
                </div>

                <div className="flex items-end justify-between">
                  <span className="text-[12px] text-slate">
                    {t("calc.platform")}
                  </span>
                  <span className="text-[13px] font-semibold text-ink tabular-nums">
                    {fmtUSD(platformPrice)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-mist">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-700 ease-out"
                    style={{ width: `${Math.min(100, (platformPrice / maxCostForBar) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-panel p-5 text-white">
                <p className="flex items-center gap-2 text-[12px] font-medium text-white/60">
                  <TrendingDown className="h-4 w-4" strokeWidth={2} />
                  {t("calc.savings")}
                </p>
                <p className="mt-1 text-[28px] font-semibold tracking-tight tabular-nums">
                  {fmtUSD(estAnnualSavings)}
                </p>
                <p className="mt-2 text-[13px] text-white/60">
                  {t("calc.savingsPct", { pct: savingsPct.toFixed(1) })}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <button className="rounded-full bg-accent px-4 py-2 text-[12px] font-semibold text-white transition-all duration-300 ease-out hover:brightness-110">
                    {t("calc.pricing")}
                  </button>
                  <span className="text-[11px] text-white/60">
                    {t("calc.noCommit")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        </Reveal>
      </div>
    </section>
  );
}