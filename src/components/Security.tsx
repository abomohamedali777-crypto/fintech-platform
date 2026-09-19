"use client";

import { ShieldCheck, Lock, Fingerprint, Server, FileCheck, Radar, FileKey } from "lucide-react";
import { useSettings } from "@/lib/site";
import Reveal from "@/components/Reveal";
import SectionHeader from "@/components/SectionHeader";
import type { ExtraKey } from "@/data/translations";

const pillars: { icon: typeof Lock; titleKey: ExtraKey; descKey: ExtraKey }[] = [
  { icon: Lock, titleKey: "ixs.p1.t", descKey: "ixs.p1.d" },
  { icon: Server, titleKey: "ixs.p2.t", descKey: "ixs.p2.d" },
  { icon: Fingerprint, titleKey: "ixs.p3.t", descKey: "ixs.p3.d" },
  { icon: ShieldCheck, titleKey: "ixs.p4.t", descKey: "ixs.p4.d" },
  { icon: FileCheck, titleKey: "ixs.p5.t", descKey: "ixs.p5.d" },
  { icon: Radar, titleKey: "ixs.p6.t", descKey: "ixs.p6.d" },
] as const;

const layers: { titleKey: ExtraKey; descKey: ExtraKey; tag: string }[] = [
  { titleKey: "ixs.l1.t", descKey: "ixs.l1.d", tag: "NDA · MFA" },
  { titleKey: "ixs.l2.t", descKey: "ixs.l2.d", tag: "TLS 1.3" },
  { titleKey: "ixs.l3.t", descKey: "ixs.l3.d", tag: "AES-256 GCM" },
  { titleKey: "ixs.l4.t", descKey: "ixs.l4.d", tag: "immutable" },
] as const;

const pillarSpans = [
  "lg:col-span-5",
  "lg:col-span-4",
  "lg:col-span-3",
  "lg:col-span-3",
  "lg:col-span-4",
  "lg:col-span-5",
];

export default function Security() {
  const { t } = useSettings();
  const scopes: { name: string; statusKey: ExtraKey | "align" | "sccBased" }[] = [
    { name: "ISO/IEC 27001", statusKey: "align" },
    { name: "SOC 2", statusKey: "align" },
    { name: "GDPR", statusKey: "sccBased" },
    { name: t("ixs.confScope"), statusKey: "align" },
  ];

  return (
    <section id="security" className="scroll-mt-20 border-t border-slate-800 bg-canvas py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <Reveal>
          <SectionHeader
            index="05"
            eyebrow={t("ixs.badge")}
            title={t("ixs.title")}
            sub={t("ixs.sub")}
          />
        </Reveal>

        <div className="mt-14 grid gap-4 lg:grid-cols-12">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <Reveal key={p.titleKey} delay={0.05 * i} className={pillarSpans[i]}>
                <div className="group h-full rounded-md border border-slate-800 bg-canvas/80 p-6 transition-colors duration-300 ease-out hover:border-accent/40 hover:bg-mist/40">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-mist transition-colors duration-300 ease-out group-hover:bg-accent/10">
                      <Icon className="h-5 w-5 text-accent" strokeWidth={1.75} />
                    </span>
                    <h3 className="text-[15px] font-semibold tracking-tight text-ink">
                      {t(p.titleKey)}
                    </h3>
                  </div>
                  <p className="mt-4 text-[13.5px] leading-relaxed text-slate">
                    {t(p.descKey)}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.05}>
          <div className="relative mt-12 overflow-hidden rounded-md border border-slate-800 bg-canvas p-8">
            <p className="text-[11px] font-semibold uppercase tracking-tight text-accent">
              {t("ixs.archLabel")}
            </p>
            <div className="relative mt-6 space-y-0">
              {layers.map((l, i) => (
                <div key={l.titleKey} className="relative flex items-start gap-4 pb-6 last:pb-0">
                  {i < layers.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute left-[13px] top-8 h-[calc(100%-16px)] w-px bg-slate-800"
                    />
                  )}
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-accent/40 bg-mist font-mono text-[10px] font-bold text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex flex-1 flex-col gap-1 rounded-md border border-slate-800 bg-mist/40 px-5 py-4 transition-colors duration-300 ease-out hover:border-accent/40">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-[14px] font-semibold tracking-tight text-ink">
                        {t(l.titleKey)}
                      </p>
                      <span className="rounded-md border border-accent/40 bg-accent/10 px-2 py-1 font-mono text-[10px] font-semibold tracking-tight text-accent">
                        {l.tag}
                      </span>
                    </div>
                    <p className="text-[12.5px] leading-relaxed text-slate">{t(l.descKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-12 grid gap-6 rounded-md border border-slate-800 bg-mist/40 p-8 sm:grid-cols-[1fr_auto] sm:items-center sm:justify-between dark:bg-canvas">
            <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
              {scopes.map((s) => (
                <div key={s.name}>
                  <p className="flex items-center gap-1.5 text-[14px] font-semibold tracking-tight text-ink">
                    <FileKey className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
                    {s.name}
                  </p>
                  <p className="text-[11px] font-medium uppercase tracking-tight text-slate">
                    {t(s.statusKey)}
                  </p>
                </div>
              ))}
            </div>
            <a
              href="#access"
              className="shrink-0 rounded-md border border-slate-800 bg-canvas px-6 py-3 text-center text-[13px] font-semibold tracking-tight text-ink transition-colors duration-300 ease-out hover:border-accent/40 hover:text-accent"
            >
              {t("ixs.requestDocs")}
            </a>
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-slate/70">{t("ixs.note")}</p>
        </Reveal>
      </div>
    </section>
  );
}