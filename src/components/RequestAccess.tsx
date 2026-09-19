"use client";

import { useState } from "react";
import { Check, ArrowRight, ShieldCheck, Lock, Loader2, AlertCircle } from "lucide-react";
import { useSettings } from "@/lib/site";
import Reveal from "@/components/Reveal";

export default function RequestAccess() {
  const { t } = useSettings();
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<
    { state: "idle" } | { state: "loading" } | { state: "success" } | { state: "error"; message: string }
  >({ state: "idle" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus({ state: "loading" });

    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, company }),
      });

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

  return (
    <section id="access" className="relative scroll-mt-20 overflow-hidden bg-panel py-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_50%_100%_at_50%_0%,rgba(0,102,204,0.18),transparent)]" />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[8%] top-16 h-56 w-56 rounded-full bg-accent/10 blur-3xl animate-float-delayed"
      />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
              {t("access.title")}
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/60">
              {t("access.sub")}
            </p>
          </Reveal>
          <Reveal delay={0.16}>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] font-medium text-white/50">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-white/70" strokeWidth={2.5} />
                {t("access.check1")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-white/70" strokeWidth={2.5} />
                {t("access.check2")}
              </span>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.12} className="mx-auto mt-10 max-w-xl">
          {status.state === "success" ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center animate-modal-in">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                <Check className="h-6 w-6 text-white" strokeWidth={2.5} />
              </span>
              <h3 className="mt-4 text-xl font-semibold tracking-tight text-white">
                {t("access.success")}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-white/60">
                {t("access.successBody", { email })}
              </p>
            </div>
          ) : (
            <form
              onSubmit={submit}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 sm:flex-row"
            >
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("access.ph")}
                className="w-full flex-1 rounded-xl border border-white/10 bg-canvas px-5 py-3.5 text-[14px] font-medium text-ink placeholder:text-slate focus:border-accent focus:outline-none"
              />
              <button
                type="submit"
                disabled={status.state === "loading"}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-[14px] font-semibold text-white shadow-micro transition-all duration-300 ease-out hover:shadow-lift hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {status.state === "loading" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
                    {t("access.submitting")}
                  </>
                ) : (
                  <>
                    {t("requestAccess")}
                    <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
                  </>
                )}
              </button>
            </form>
          )}

          {status.state === "error" && (
            <div className="mx-auto mt-4 flex max-w-xl items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[13px] font-medium text-white/80 animate-fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" strokeWidth={2.25} />
              {status.message}
            </div>
          )}

          <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-medium text-white/60">
            <Lock className="h-3.5 w-3.5" strokeWidth={2} />
            {t("access.encrypt")}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3 text-[12px] font-medium text-white/60">
            <ShieldCheck className="h-4 w-4" strokeWidth={2} />
            {t("access.agree")}
          </div>
        </Reveal>
      </div>
    </section>
  );
}