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

const transactions = [
  { id: "TXN-84291", corridor: "AED → USD", amount: "$412,800.00", status: "Settled", time: "0.4s" },
  { id: "TXN-84290", corridor: "EUR → SGD", amount: "$189,240.50", status: "Settled", time: "0.3s" },
  { id: "TXN-84289", corridor: "GBP → JPY", amount: "$756,342.10", status: "Settled", time: "0.5s" },
  { id: "TXN-84288", corridor: "USD → EUR", amount: "$1,204,900.00", status: "Pending", time: "—" },
  { id: "TXN-84287", corridor: "SGD → AED", amount: "$98,415.75", status: "Settled", time: "0.3s" },
];

export default function BentoGrid() {
  const [tab, setTab] = useState<"treasury" | "settlement" | "compliance">("treasury");

  const tabs = [
    { key: "treasury" as const, label: "B2B Treasury", icon: Landmark },
    { key: "settlement" as const, label: "Cross-border Settlement", icon: ArrowRightLeft },
    { key: "compliance" as const, label: "Automated GRC", icon: ShieldCheck },
  ];

  const pillars = [
    {
      key: "treasury" as const,
      title: "B2B Treasury",
      desc: "Programmatic cash positioning, yield optimization, and sub-account ledgering across every operating market.",
      metrics: [
        ["APY on idle balance", "4.35%"],
        ["Net margin improvement", "+38 bps"],
        ["Ledger sync latency", "<200 ms"],
      ],
      bullets: [
        "Treasury yield optimization",
        "Multi-entity ledger consolidation",
        "Configurable sweep policies",
      ],
    },
    {
      key: "settlement" as const,
      title: "Cross-border API Settlement",
      desc: "Single API surface routing across SWIFT, SEPA, FPS, and regional instant-credit rails with deterministic ordering.",
      metrics: [
        ["Endpoint coverage", "190+ markets"],
        ["Median settle time", "0.4 s"],
        ["Route success rate", "99.97%"],
      ],
      bullets: [
        "Deterministic FX pricing",
        "Idempotent webhooks at egress",
        "Real-time reconciliation",
      ],
    },
    {
      key: "compliance" as const,
      title: "Automated GRC / Compliance",
      desc: "Policy-as-code screening and evidence pipelines: AML, KYC, sanctions, and regulatory reporting built into the ledger.",
      metrics: [
        ["Sanctions throughput", "11 ms / ID"],
        ["Audit evidence coverage", "100%"],
        ["Report generation", "On-demand"],
      ],
      bullets: [
        "AML / CFT transaction screening",
        "Continuous KYC re-verification",
        "Immutable audit trail exports",
      ],
    },
  ];

  const active = pillars.find((p) => p.key === tab)!;

  return (
    <section id="product" className="scroll-mt-20 bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border hairline bg-white px-4 py-1.5 text-[12px] font-medium text-slate shadow-micro">
            <Globe2 className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
            Platform Capabilities
          </span>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight text-ink sm:text-4xl md:text-5xl">
            One ledger. Every rail. Programmable compliance.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate">
            Three primitives that collapse legacy treasury operations into a
            single deterministic API surface.
          </p>
        </div>

        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 overflow-hidden rounded-2xl border hairline bg-white shadow-micro">
            <div className="flex flex-wrap items-center border-b hairline bg-mist/50 px-6 py-4">
              {tabs.map((t) => {
                const Icon = t.icon;
                const isActive = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`mb-1 mr-2 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-all duration-300 ease-out ${
                      isActive
                        ? "bg-accent text-white shadow-micro"
                        : "bg-white text-slate hover:text-ink border hairline"
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                    {t.label}
                  </button>
                );
              })}
            </div>

            <div key={tab} className="animate-fade-in p-6 sm:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="max-w-md">
                  <h3 className="text-xl font-semibold tracking-tight text-ink">
                    {active.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-slate">
                    {active.desc}
                  </p>
                  <ul className="mt-5 space-y-2.5">
                    {active.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-2.5 text-[13px] text-ink">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/10">
                          <Check className="h-3 w-3 text-accent" strokeWidth={3} />
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="w-full md:w-64">
                  <div className="grid grid-cols-1 gap-3">
                    {active.metrics.map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-xl bg-mist px-4 py-3 transition-all duration-300 ease-out hover:shadow-micro"
                      >
                        <p className="text-[11px] font-medium uppercase tracking-wider text-slate">
                          {label}
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

          <div className="overflow-hidden rounded-2xl border hairline bg-white shadow-micro">
            <div className="flex items-center justify-between border-b hairline px-6 py-4">
              <p className="flex items-center gap-2 text-[13px] font-medium text-ink">
                <Zap className="h-4 w-4 text-accent" strokeWidth={2} />
                Live Settlement Activity
              </p>
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            </div>
            <div className="max-h-[460px] overflow-y-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white">
                  <tr>
                    <th className="px-6 pb-3 pt-4 text-[11px] font-semibold uppercase tracking-wider text-slate">
                      Corridor
                    </th>
                    <th className="px-4 pb-3 pt-4 text-right text-[11px] font-semibold uppercase tracking-wider text-slate">
                      Amount
                    </th>
                    <th className="px-6 pb-3 pt-4 text-right text-[11px] font-semibold uppercase tracking-wider text-slate">
                      Status
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
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {tx.status}
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
                24h volume
              </p>
              <p className="text-[13px] font-semibold tabular-nums text-ink">
                $18.4M
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Zap,
              title: "Single API Key",
              desc: "One credential, every rail. Deterministic idempotency at the protocol layer.",
            },
            {
              icon: Globe2,
              title: "190+ Market Rails",
              desc: "SWIFT gpi, SEPA Instant, FPS, FedNow, and regional clearing all abstracted.",
            },
            {
              icon: FileOutput,
              title: "REST + Webhooks",
              desc: "Idempotent webhooks at every state change, delivered to your ledger.",
            },
            {
              icon: BarChart3,
              title: "Programmable Treasury",
              desc: "Yield sweeps, FX hedging, and liquidity pooling via simple policy objects.",
            },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group rounded-2xl border hairline bg-white p-6 shadow-micro transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mist transition-colors duration-300 ease-out group-hover:bg-accent/10">
                  <Icon className="h-5 w-5 text-accent" strokeWidth={1.75} />
                </div>
                <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-ink">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}