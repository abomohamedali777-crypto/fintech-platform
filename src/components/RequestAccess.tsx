"use client";

import { useState } from "react";
import { Check, ArrowRight, ShieldCheck, Lock, Loader2, AlertCircle } from "lucide-react";
import { useSettings } from "@/lib/site";
import Reveal from "@/components/Reveal";
import Magnetic from "@/components/Magnetic";
import SectionHeader from "@/components/SectionHeader";
import type { TKey } from "@/data/translations";

const volumeOptions = [
  "",
  "$0 – $5M / month",
  "$5M – $25M / month",
  "$25M – $100M / month",
  "$100M+ / month",
];

export default function RequestAccess({
  onOpenPrivacy,
}: {
  onOpenPrivacy: () => void;
}) {
  const { t } = useSettings();
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [volume, setVolume] = useState("");
  const [fax, setFax] = useState("");
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [status, setStatus] = useState<
    { state: "idle" } | { state: "loading" } | { state: "success" } | { state: "error"; message: string }
  >({ state: "idle" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    if (!consent) {
      setConsentError(true);
      return;
    }

    setStatus({ state: "loading" });

    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, company, volume, fax }),
      });

      if (res.status === 413) {
        setStatus({ state: "error", message: t("err.tooLarge") });
        return;
      }

      if (res.status === 429) {
        const data = (await res.json().catch(() => null)) as { message?: string } | null;
        setStatus({
          state: "error",
          message: data?.message ?? t("err.429"),
        });
        return;
      }

      if (res.status === 422) {
        setStatus({ state: "error", message: t("err.422") });
        return;
      }

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { message?: string } | null;
        setStatus({
          state: "error",
          message: data?.message ?? t("err.fail"),
        });
        return;
      }

      setStatus({ state: "success" });
    } catch {
      setStatus({ state: "error", message: t("err.net") });
    }
  };

  const renderConsent = (raw: string) => {
    const bits = raw.split(/(\[\[privacy\]\])/);
    return bits.map((part, i) => {
      if (part === "[[privacy]]") {
        return (
          <button
            key={i}
            type="button"
            onClick={onOpenPrivacy}
            className="font-semibold text-ink underline decoration-slate/40 underline-offset-2 transition-colors duration-300 ease-out hover:text-accent"
          >
            {t("privacyPolicy")}
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const checklist: { n: string; k: TKey }[] = [
    { n: "01", k: "access.check1" },
    { n: "02", k: "access.check2" },
  ];

  return (
    <section id="access" className="scroll-mt-20 border-t border-slate-800 bg-mist/40 py-24 dark:bg-canvas">
      <div className="mx-auto max-w-[1200px] px-6">
        <Reveal>
          <SectionHeader
            index="07"
            eyebrow={t("access.badge")}
            title={t("access.title")}
            sub={t("access.sub")}
          />
        </Reveal>

        <div className="mt-12 grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <ul className="divide-y divide-slate-800/50 border-y border-slate-800">
              {checklist.map((row) => (
                <li key={row.n} className="flex items-center gap-4 py-4">
                  <span className="w-8 shrink-0 font-mono text-[12px] tracking-tight text-slate/50">
                    {row.n}
                  </span>
                  <span className="flex items-center gap-2.5 text-[14px] font-medium text-ink">
                    <Check className="h-4 w-4 shrink-0 text-emerald-500" strokeWidth={2.25} />
                    {t(row.k)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-3">
              <p className="flex items-start gap-2.5 font-mono text-[11px] uppercase leading-relaxed tracking-tight text-slate">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                {t("access.encrypt")}
              </p>
              <p className="flex items-start gap-2.5 font-mono text-[11px] uppercase leading-relaxed tracking-tight text-slate">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                {t("access.agree")}
              </p>
            </div>
          </div>

          <div className="lg:col-span-7">
            <Reveal delay={0.1}>
              {status.state === "success" ? (
                <div className="rounded-md border border-slate-800 bg-canvas p-8 animate-modal-in">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-accent">
                    <Check className="h-6 w-6 text-white" strokeWidth={2.5} />
                  </span>
                  <h3 className="mt-4 text-xl font-semibold tracking-tight text-ink">
                    {t("access.success")}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-slate">
                    {t("access.successBody", { email })}
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={submit}
                  className="relative flex flex-col gap-3 rounded-md border border-slate-800 bg-canvas p-5"
                >
                  {/* Honeypot: visually hidden, excluded from keyboard navigation.
                      Real users never fill this; bots that do are silently rejected
                      server-side. Do not remove — the server treats a populated
                      `fax` field as an automated submission. */}
                  <div
                    aria-hidden="true"
                    className="absolute -left-[9999px] -top-[9999px] h-px w-px overflow-hidden"
                  >
                    <label htmlFor="access-fax" className="sr-only">
                      Leave this field blank
                    </label>
                    <input
                      id="access-fax"
                      name="fax"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={fax}
                      onChange={(e) => setFax(e.target.value)}
                      maxLength={120}
                    />
                  </div>

                  <label htmlFor="access-email" className="sr-only">
                    {t("access.ph")}
                  </label>
                  <input
                    id="access-email"
                    type="email"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("access.ph")}
                    className="w-full rounded-md border border-slate-800 bg-canvas px-5 py-3.5 text-[14px] font-medium tracking-tight text-ink placeholder:text-slate focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label htmlFor="access-company" className="sr-only">
                      {t("access.company")}
                    </label>
                    <input
                      id="access-company"
                      type="text"
                      maxLength={120}
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder={t("access.company")}
                      className="w-full rounded-md border border-slate-800 bg-canvas px-5 py-3.5 text-[14px] font-medium tracking-tight text-ink placeholder:text-slate focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                    />
                    <label htmlFor="access-volume" className="sr-only">
                      {t("access.monthlyVolume")}
                    </label>
                    <select
                      id="access-volume"
                      value={volume}
                      onChange={(e) => setVolume(e.target.value)}
                      className="w-full appearance-none rounded-md border border-slate-800 bg-canvas px-5 py-3.5 text-[14px] font-medium tracking-tight text-ink focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                    >
                      <option value="" disabled>
                        {t("access.volumePh")}
                      </option>
                      {volumeOptions.slice(1).map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div
                    className={`rounded-md border p-3.5 transition-colors duration-300 ease-out ${
                      consentError ? "border-red-400/60 bg-red-500/10" : "border-slate-800 bg-mist/40"
                    }`}
                  >
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => {
                          setConsent(e.target.checked);
                          if (e.target.checked) setConsentError(false);
                        }}
                        aria-invalid={consentError}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-800 bg-canvas accent-[#d9ae4e] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                      />
                      <span className="text-[12px] leading-relaxed text-slate">
                        {renderConsent(t("access.consent"))}
                      </span>
                    </label>
                    {consentError && (
                      <p role="alert" className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-red-600 dark:text-red-400">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
                        {t("access.consentReq")}
                      </p>
                    )}
                  </div>

                  <Magnetic className="inline-flex w-full" strength={0.2}>
                    <button
                      type="submit"
                      disabled={status.state === "loading"}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-b from-accent to-accent-strong px-6 py-3.5 text-[14px] font-semibold tracking-tight text-white shadow-gold transition-all duration-300 ease-out hover:brightness-110 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {status.state === "loading" ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
                          {t("access.submitting")}
                        </>
                      ) : (
                        <>
                          {t("requestAccess")}
                          <ArrowRight className="h-4 w-4 rtl:rotate-180" strokeWidth={2.25} />
                        </>
                      )}
                    </button>
                  </Magnetic>
                </form>
              )}
            </Reveal>

            {status.state === "error" && (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-md border border-slate-800 bg-mist/40 px-4 py-3 text-[13px] font-medium text-ink animate-fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" strokeWidth={2.25} />
                {status.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}