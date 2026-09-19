"use client";

import { useEffect, useState } from "react";
import { useSettings } from "@/lib/site";
import { prefersReducedMotion } from "@/lib/motion";
import type { ExtraKey } from "@/data/translations";

type Tone = "ok" | "warn" | "ink" | "accent";

const SIGNALS: { labelKey: ExtraKey; value: string; tone: Tone }[] = [
  { labelKey: "int.contract", value: "Review", tone: "warn" },
  { labelKey: "int.financial", value: "$4.2M", tone: "ink" },
  { labelKey: "int.jurisdiction", value: "AE · SG · EU", tone: "ink" },
];

const toneClass: Record<Tone, string> = {
  ok: "text-emerald-500",
  warn: "text-amber-500",
  ink: "text-ink",
  accent: "text-accent",
};

const dotClass: Record<Tone, string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  ink: "bg-slate/50",
  accent: "bg-accent",
};

export default function Telemetry() {
  const { t } = useSettings();
  const [confidence, setConfidence] = useState(92);
  const [exposure, setExposure] = useState(4200000);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const timer = setInterval(() => {
      setConfidence(88 + Math.round(Math.random() * 8));
      setExposure(4_050_000 + Math.round(Math.random() * 400_000));
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const compactExposure = `$${(exposure / 1e6).toFixed(1)}M`;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-4">
        <p className="font-mono text-[10px] uppercase tracking-tight text-slate">
          {t("int.title")}
        </p>
        <span className="font-mono text-[10px] uppercase tracking-tight text-slate/50">
          {t("int.updated")}
        </span>
      </div>

      <div className="px-5 pb-4">
        <dl className="grid grid-cols-3 gap-2">
          {[
            { label: t("int.regulatory"), value: t("int.low"), noteClass: "text-emerald-500" },
            { label: t("int.confidence"), value: `${confidence}%`, noteClass: "text-accent" },
            { label: t("int.compliance"), value: t("int.active"), noteClass: "text-emerald-500" },
          ].map((s) => (
            <div key={s.label} className="rounded-sm border border-slate-800 bg-mist/30 px-3 py-2.5">
              <dt className="text-[10px] font-medium uppercase tracking-tight text-slate">
                {s.label}
              </dt>
              <dd className="mt-1 font-mono text-[14px] font-semibold tracking-tight tabular-nums text-ink">
                {s.value}
              </dd>
              <div className="mt-2 h-0.5 overflow-hidden rounded-sm bg-slate-800">
                <div
                  className={`h-full rounded-sm transition-all duration-700 ease-out ${
                    s.noteClass === "text-accent" ? "bg-accent" : "bg-emerald-500"
                  }`}
                  style={{ width: s.noteClass === "text-accent" ? `${confidence}%` : "100%" }}
                />
              </div>
            </div>
          ))}
        </dl>

        <ul className="mt-3 border-t border-slate-800">
          {SIGNALS.map((s) => (
            <li
              key={s.labelKey}
              className="flex items-center justify-between py-2 text-[12px]"
            >
              <span className="flex items-center gap-2.5 font-medium text-ink">
                <span aria-hidden className={`h-1.5 w-1.5 rounded-sm ${dotClass[s.tone]}`} />
                {t(s.labelKey)}
              </span>
              <span className={`font-mono tabular-nums ${toneClass[s.tone]}`}>
                {s.labelKey === "int.financial" ? compactExposure : s.value}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-2 border-t border-slate-800 pt-2 font-mono text-[9px] uppercase tracking-tight text-slate/50">
          {t("int.note")}
        </p>
      </div>
    </div>
  );
}