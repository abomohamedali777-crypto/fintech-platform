"use client";

import { useState } from "react";
import {
  Landmark,
  ArrowRightLeft,
  ShieldCheck,
  Globe2,
  Zap,
  BarChart3,
  Check,
  FileOutput,
} from "lucide-react";
import { useSettings } from "@/lib/site";
import Reveal from "@/components/Reveal";

const transactions = [
  { id: "TXN-84291", corridor: "AED → USD", amount: "$412,800.00", status: "Settled", time: "0.4s" },
  { id: "TXN-84290", corridor: "EUR → SGD", amount: "$189,240.50", status: "Settled", time: "0.3s" },
  { id: "TXN-84289", corridor: "GBP → JPY", amount: "$756,342.10", status: "Settled", time: "0.5s" },
  { id: "TXN-84288", corridor: "USD → EUR", amount: "$1,204,900.00", status: "Pending", time: "—" },
  { id: "TXN-84287", corridor: "SGD → AED", amount: "$98,415.75", status: "Settled", time: "0.3s" },
];

const pillarKeys = {
  treasury: ["p1.title", "p1.desc", ["p1.m1", "p1.m2", "p1.m3"], ["p1.b1", "p1.b2", "p1.b3"]] as const,
  settlement: ["p2.title", "p2.desc", ["p2.m1", "p2.m2", "p2.m3"], ["p2.b1", "p2.b2", "p2.b3"]] as const,
  compliance: ["p3.title", "p3.desc", ["p3.m1", "p3.m2", "p3.m3"], ["p3.b1", "p3.b2", "p3.b3"]] as const,
};

export default function BentoGrid() {
  const { t } = useSettings();
  const [tab, setTab] = useState<"treasury" | "settlement" | "compliance">("treasury");

  const tabs = [
    { key: "treasury" as const, labelKey: "tab.1" as const, icon: Landmark },
    { key: "settlement" as const, labelKey: "tab.2" as const, icon: ArrowRightLeft },
    { key: "compliance" as const, labelKey: "tab.3" as const, icon: ShieldCheck },
  ];

  const pillars = [
    {
      key: "treasury" as const,
      metrics: [
        ["APY on idle balance", "4.35%"],
        ["Net margin improvement", "+38 bps"],
        ["Ledger sync latency", "<200 ms"],
      ],
      bullets: ["B1", "B2", "B3"],
    },
    {
      key: "settlement" as const,
      metrics: [
        ["Endpoint coverage", "190+ markets"],
        ["Median settle time", "0.4 s"],
        ["Route success rate", "99.97%"],
      ],
      bullets: ["B1", "B2", "B3"],
    },
    {
      key: "compliance" as const,
      metrics: [
        ["Sanctions throughput", "11 ms / ID"],
        ["Audit evidence coverage", "100%"],
        ["Report generation", "On-demand"],
      ],
      bullets: ["B1", "B2", "B3"],
    },
  ];

  const active = pillars.find((p) => p.key === tab)!;
  const keys = pillarKeys[tab];
  const [mt1, mt2, mt3] = keys[2];
  const [b1, b2, b3] = keys[3];

  return (
    <section id="product" className="scroll-mt-20 bg-canvas py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border hairline bg-canvas px-4 py-1.5 text-[12px] font-medium text-slate shadow-micro">
              <Globe2 className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
              {t("bentoBadge")}
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight text-ink sm:text-4xl md:text-5xl">
              {t("bentoTitle")}
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-4 text-base leading-relaxed text-slate">
              {t("bentoSub")}
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 overflow-hidden rounded-2xl border hairline bg-canvas shadow-micro">
            <div className="flex flex-wrap items-center border-b hairline bg-mist/50 px-6 py-4">
              {tabs.map((tabsItem) => {
                const Icon = tabsItem.icon;
                const isActive = tab === tabsItem.key;
                return (
                  <button
                    key={tabsItem.key}
                    onClick={() => setTab(tabsItem.key)}
                    className={`mb-1 mr-2 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-all duration-300 ease-out ${
                      isActive
                        ? "bg-accent text-white shadow-micro"
                        : "bg-canvas text-slate hover:text-ink border hairline"
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                    {t(tabsItem.labelKey)}
                  </button>
                );
              })}
            </div>

            <div key={tab} className="animate-fade-in p-6 sm:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="max-w-md">
                  <h3 className="text-xl font-semibold tracking-tight text-ink">
                    {t(keys[0])}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-slate">
                    {t(keys[1])}
                  </p>
                  <ul className="mt-5 space-y-2.5">
                    {[b1, b2, b3].map((bk) => (
                      <li key={bk} className="flex items-center gap-2.5 text-[13px] text-ink">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/10">
                          <Check className="h-3 w-3 text-accent" strokeWidth={3} />
                        </span>
                        {t(bk)}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="w-full md:w-64">
                  <div className="grid grid-cols-1 gap-3">
                    {active.metrics.map(([label, value], mi) => (
                      <div
                        key={label}
                        className="rounded-xl bg-mist px-4 py-3 transition-all duration-300 ease-out hover:shadow-micro"
                      >
                        <p className="text-[11px] font-medium uppercase tracking-wider text-slate">
                          {t(([mt1, mt2, mt3] as const)[mi])}
                        </p>
                        <p className="mt-0.5 text-lg font-semibold tracking-tight tabular-nums text-ink">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border hairline bg-canvas shadow-micro">
            <div className="flex items-center justify-between border-b hairline px-6 py-4">
              <p className="flex items-center gap-2 text-[13px] font-medium text-ink">
                <Zap className="h-4 w-4 text-accent" strokeWidth={2} />
                {t("activity")}
              </p>
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            </div>
            <div className="max-h-[460px] overflow-y-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-canvas">
                  <tr>
                    <th className="px-6 pb-3 pt-4 text-[11px] font-semibold uppercase tracking-wider text-slate">
                      {t("colCorridor")}
                    </th>
                    <th className="px-4 pb-3 pt-4 text-right text-[11px] font-semibold uppercase tracking-wider text-slate">
                      {t("colAmount")}
                    </th>
                    <th className="px-6 pb-3 pt-4 text-right text-[11px] font-semibold uppercase tracking-wider text-slate">
                      {t("colStatus")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-t hairline transition-colors duration-300 ease-out hover:bg-mist/60"
                    >
                      <td className="px-6 py-3.5">
                        <p className="text-[13px] font-medium text-ink">{tx.corridor}</p>
                        <p className="text-[11px] text-slate">{tx.id}</p>
                      </td>
                      <td className="px-4 py-3.5 text-right text-[13px] font-semibold tabular-nums text-ink">
                        {tx.amount}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            tx.status === "Settled"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                              : "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                          }`}
                        >
                          {tx.status === "Settled" ? t("settled") : t("pending")}
                          {tx.status === "Settled" && (
                            <span className="text-[10px] font-medium text-slate">{tx.time}</span>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t hairline bg-mist/50 px-6 py-3">
              <p className="flex items-center gap-2 text-[11px] font-medium text-slate">
                <BarChart3 className="h-3.5 w-3.5" strokeWidth={2} />
                {t("vol24h")}
              </p>
              <p className="text-[13px] font-semibold tabular-nums text-ink">
                $18.4M
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Zap, titleKey: "f1.title" as const, descKey: "f1.desc" as const },
            { icon: Globe2, titleKey: "f2.title" as const, descKey: "f2.desc" as const },
            { icon: FileOutput, titleKey: "f3.title" as const, descKey: "f3.desc" as const },
            { icon: BarChart3, titleKey: "f4.title" as const, descKey: "f4.desc" as const },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.titleKey} delay={0.05 * i}>
                <div className="group relative overflow-hidden rounded-2xl border hairline bg-canvas p-6 shadow-micro transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lift">
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100 glow-top" />
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-mist transition-colors duration-300 ease-out group-hover:bg-accent/10">
                    <Icon className="h-5 w-5 text-accent" strokeWidth={1.75} />
                  </div>
                  <h3 className="relative mt-4 text-[15px] font-semibold tracking-tight text-ink">
                    {t(f.titleKey)}
                  </h3>
                  <p className="relative mt-1.5 text-[13px] leading-relaxed text-slate">
                    {t(f.descKey)}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Reveal>
    </div>
  </section>
  );
}