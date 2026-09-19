"use client";

import { useSettings } from "@/lib/site";
import { ArrowRight } from "lucide-react";
import Dashboard from "./Dashboard";

const rails = [
  "SWIFT gpi",
  "SEPA Instant",
  "FPS",
  "FedNow",
  "CHAPS",
  "TARGET2",
  "ACH",
  "DuitNow",
  "UPI",
  "RippleNet",
];

export default function Hero() {
  const { t } = useSettings();
  return (
    <section id="top" className="relative overflow-hidden bg-canvas pb-24 pt-36">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-full -translate-x-1/2 bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,rgba(0,102,204,0.06),transparent)]" />
      <div
        aria-hidden
        className="pointer-events-none absolute left-[6%] top-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl animate-float"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[4%] top-48 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(0,102,204,0.32),transparent_70%)] opacity-60 blur-3xl animate-float-delayed"
      />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border hairline bg-canvas px-4 py-1.5 text-[12px] font-medium text-slate shadow-micro animate-fade-in-up">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {t("isoBadge")}
          </span>
          <h1 className="mt-7 text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl md:text-6xl animate-fade-in-up delay-100">
            {t("heroTitle")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-normal leading-relaxed text-slate animate-fade-in-up delay-200">
            {t("heroSub")}
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row animate-fade-in-up delay-300">
            <a
              href="#access"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-7 py-3.5 text-[14px] font-semibold text-white shadow-micro transition-all duration-300 ease-out hover:shadow-lift hover:brightness-110 sm:w-auto"
            >
              <span className="relative">
                {t("requestAccess")}
                <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-white/60 transition-all duration-300 ease-out group-hover:w-full" />
              </span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-0.5" />
            </a>
            <a
              href="#product"
              className="inline-flex w-full items-center justify-center rounded-full border hairline bg-canvas px-7 py-3.5 text-[14px] font-semibold text-ink transition-all duration-300 ease-out hover:bg-mist sm:w-auto"
            >
              {t("viewCapabilities")}
            </a>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-4xl animate-fade-in-up delay-400">
          <Dashboard />
        </div>

        <div className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[12px] font-medium tracking-wide text-slate">
          <span>{t("trustedFor")}</span>
          <span className="font-semibold text-ink">{t("trust.gt")}</span>
          <span className="text-ink">·</span>
          <span className="font-semibold text-ink">{t("trust.fx")}</span>
          <span className="text-ink">·</span>
          <span className="font-semibold text-ink">{t("trust.embedded")}</span>
        </div>

        <div className="mx-auto mt-14 max-w-5xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <div className="flex w-max animate-ticker">
            {[0, 1].map((k) => (
              <div key={k} className="flex shrink-0 items-center gap-16 pr-16" aria-hidden={k === 1}>
                {rails.map((rail) => (
                  <span
                    key={rail}
                    className="whitespace-nowrap text-[12px] font-medium tracking-wide text-slate"
                  >
                    {rail}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}