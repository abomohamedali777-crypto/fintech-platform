"use client";

import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  Scale,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";
import { useSettings } from "@/lib/site";
import Reveal from "@/components/Reveal";
import SectionHeader from "@/components/SectionHeader";
import type { IntelResponse } from "@/lib/intelligence/types";

type Status =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "success"; data: IntelResponse }
  | { state: "error"; message: string };

const exampleKeys = ["intel.ex1", "intel.ex2", "intel.ex3", "intel.ex4"] as const;
const domainKeys = ["auto", "regulatory", "legal"] as const;

function suffKey(sufficiency: IntelResponse["answer"]["sufficiency"]):
  | "intel.suff.sufficient"
  | "intel.suff.limited"
  | "intel.suff.insufficient" {
  if (sufficiency === "sufficient") return "intel.suff.sufficient";
  if (sufficiency === "limited") return "intel.suff.limited";
  return "intel.suff.insufficient";
}

function suffColor(sufficiency: IntelResponse["answer"]["sufficiency"]): string {
  if (sufficiency === "sufficient") return "text-emerald-500";
  if (sufficiency === "limited") return "text-amber-500";
  return "text-red-500";
}

function suffWidth(sufficiency: IntelResponse["answer"]["sufficiency"]): string {
  if (sufficiency === "sufficient") return "w-full bg-emerald-500";
  if (sufficiency === "limited") return "w-1/2 bg-amber-500";
  return "w-1/5 bg-red-500";
}

export default function Intelligence() {
  const { t } = useSettings();
  const [question, setQuestion] = useState("");
  const [domain, setDomain] = useState<"auto" | "regulatory" | "legal">("auto");
  const [status, setStatus] = useState<Status>({ state: "idle" });

  const run = async (q: string) => {
    const query = q.trim();
    if (query.length < 8 || status.state === "loading") return;
    setStatus({ state: "loading" });
    try {
      const res = await fetch("/api/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query, jurisdiction: "uae", domain }),
      });

      if (res.status === 429) {
        setStatus({ state: "error", message: t("intel.err.rate") });
        return;
      }
      if (res.status === 413 || res.status === 400 || res.status === 422) {
        setStatus({ state: "error", message: t("intel.err.invalid") });
        return;
      }
      if (!res.ok) {
        setStatus({ state: "error", message: t("intel.err.generic") });
        return;
      }

      const data = (await res.json()) as IntelResponse;
      setStatus({ state: "success", data });
    } catch {
      setStatus({ state: "error", message: t("intel.err.generic") });
    }
  };

  const providerLabel = (r: IntelResponse) => {
    const p = r.meta;
    if (p.providerKind === "openai-compatible") {
      return p.providerStatus === "ok"
        ? t("intel.provider.connected")
        : t("intel.provider.failed");
    }
    return t("intel.provider.local");
  };

  const providerDot = (r: IntelResponse) => {
    const p = r.meta;
    if (p.providerKind === "none") return "bg-slate/50";
    return p.providerStatus === "ok" ? "bg-emerald-500" : "bg-amber-500";
  };

  return (
    <section id="intelligence" className="scroll-mt-20 border-t border-slate-800 bg-mist/40 py-24 dark:bg-canvas">
      <div className="mx-auto max-w-[1200px] px-6">
        <Reveal>
          <SectionHeader
            index="01"
            eyebrow={t("intel.badge")}
            title={t("intel.title")}
            sub={t("intel.sub")}
          />
        </Reveal>

        <div className="mt-12 grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Reveal>
              <div className="rounded-md border border-slate-800 bg-canvas p-5">
                <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <p className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-tight text-ink">
                    <Search className="h-3.5 w-3.5 text-accent" strokeWidth={2} aria-hidden />
                    {t("intel.engineStatus")}
                  </p>
                  {status.state === "success" ? (
                    <span className="flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-tight text-slate">
                      <span className={`h-1.5 w-1.5 rounded-sm ${providerDot(status.data)}`} aria-hidden />
                      {providerLabel(status.data)}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-tight text-slate">
                      <span className="h-1.5 w-1.5 rounded-sm bg-slate/50" aria-hidden />
                      {t("intel.status.local")}
                    </span>
                  )}
                </div>

                <form
                  className="flex flex-col gap-3 pt-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void run(question);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label htmlFor="intel-jurisdiction" className="sr-only">
                        {t("intel.jurisdiction")}
                      </label>
                      <select
                        id="intel-jurisdiction"
                        disabled
                        title={t("intel.jurisdiction")}
                        className="w-full appearance-none rounded-md border border-slate-800 bg-canvas px-3 py-2 font-mono text-[12px] font-medium tracking-tight text-ink focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                      >
                        <option>AE · UAE</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label htmlFor="intel-domain" className="sr-only">
                        {t("intel.domain")}
                      </label>
                      <select
                        id="intel-domain"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value as typeof domain)}
                        className="w-full appearance-none rounded-md border border-slate-800 bg-canvas px-3 py-2 font-mono text-[12px] font-medium tracking-tight text-ink focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                      >
                        {domainKeys.map((k) => (
                          <option key={k} value={k}>
                            {k === "auto" ? t("intel.domain.auto") : k === "regulatory" ? t("intel.domain.regulatory") : t("intel.domain.legal")}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <label htmlFor="intel-question" className="sr-only">
                    {t("intel.qLabel")}
                  </label>
                  <textarea
                    id="intel-question"
                    rows={4}
                    maxLength={500}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder={t("intel.qPlaceholder")}
                    className="w-full resize-none rounded-md border border-slate-800 bg-canvas px-4 py-3.5 text-[14px] font-medium leading-relaxed tracking-tight text-ink placeholder:text-slate focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                  />

                  <button
                    type="submit"
                    disabled={status.state === "loading"}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-b from-accent to-accent-strong px-6 py-3.5 text-[14px] font-semibold tracking-tight text-white shadow-gold transition-all duration-300 ease-out hover:brightness-110 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {status.state === "loading" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
                        {t("intel.analyzing")}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" strokeWidth={2.25} />
                        {t("intel.analyze")}
                        <ArrowRight className="h-4 w-4 rtl:rotate-180" strokeWidth={2.25} />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-5 border-t border-slate-800 pt-4">
                  <p className="font-mono text-[10px] uppercase tracking-tight text-slate">
                    {t("intel.examples")}
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {exampleKeys.map((k) => (
                      <li key={k}>
                        <button
                          type="button"
                          onClick={() => void run(t(k))}
                          disabled={status.state === "loading"}
                          className="rounded-md border border-slate-800 bg-canvas px-3 py-1.5 text-left font-mono text-[11px] font-medium tracking-tight text-slate transition-colors duration-300 ease-out hover:border-accent/40 hover:text-ink disabled:opacity-60"
                        >
                          {t(k)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5 space-y-3 border-t border-slate-800 pt-4">
                  <p className="flex items-center gap-2.5 font-mono text-[11px] uppercase leading-relaxed tracking-tight text-slate">
                    <BookOpenCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                    {t("intel.fixtureNote")}
                  </p>
                  <p className="flex items-start gap-2.5 font-mono text-[11px] uppercase leading-relaxed tracking-tight text-slate">
                    <Scale className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                    {t("intel.disclaimer")}
                  </p>
                </div>
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <Reveal delay={0.1}>
              <div className="rounded-md border border-slate-800 bg-canvas">
                <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-5 py-3.5">
                  <p className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-tight text-ink">
                    <Zap className="h-3.5 w-3.5 text-accent" strokeWidth={2} aria-hidden />
                    {t("intel.title")}
                  </p>
                  {status.state === "success" && status.data.meta.cached && (
                    <span className="flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-tight text-slate">
                      <CheckCircle2 className="h-3 w-3 text-accent" strokeWidth={2} aria-hidden />
                      {t("intel.cached")}
                    </span>
                  )}
                </div>

                {status.state === "idle" && (
                  <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 px-8 py-16 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-md border border-slate-800 bg-mist/40">
                      <BookOpenCheck className="h-5 w-5 text-accent" strokeWidth={2} aria-hidden />
                    </span>
                    <p className="max-w-sm text-[14px] leading-relaxed text-slate">
                      {t("intel.empty")}
                    </p>
                    <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-tight text-slate/60">
                      <FileText className="h-3 w-3" strokeWidth={2} aria-hidden />
                      {t("intel.engineStatus")}: {t("intel.status.local")}
                    </p>
                  </div>
                )}

                {status.state === "loading" && (
                  <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 px-8 py-16 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-accent" strokeWidth={2} />
                    <p className="font-mono text-[12px] font-medium uppercase tracking-tight text-slate">
                      {t("intel.analyzing")}
                    </p>
                  </div>
                )}

                {status.state === "error" && (
                  <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 px-8 py-16 text-center">
                    <AlertCircle className="h-6 w-6 text-red-500" strokeWidth={2} aria-hidden />
                    <p className="font-mono text-[12px] font-medium uppercase tracking-tight text-slate">
                      {status.message}
                    </p>
                  </div>
                )}

                {status.state === "success" && (
                  <AnswerView data={status.data} />
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function AnswerView({ data }: { data: IntelResponse }) {
  const { t } = useSettings();
  const { answer, citations, meta } = data;

  return (
    <div className="divide-y divide-slate-800">
      <div className="px-5 py-5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono text-[10px] uppercase tracking-tight text-slate">
            {t("intel.evidence")}
          </p>
          <span className={`font-mono text-[10px] font-semibold uppercase tracking-tight ${suffColor(answer.sufficiency)}`}>
            {t(suffKey(answer.sufficiency))}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-tight text-slate/60">
            · {t("intel.coverageValue", { n: meta.corpusCount, m: "UAE" })}
          </span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-sm bg-slate-800/60">
          <div className={`h-full ${suffWidth(answer.sufficiency)}`} aria-hidden />
        </div>
      </div>

      <div className="px-5 py-5">
        <p className="font-mono text-[10px] uppercase tracking-tight text-slate">
          {t("intel.summary")}
        </p>
        <p className="mt-2 text-[14px] leading-relaxed text-ink">
          {answer.summary}
        </p>
      </div>

      {answer.considerations.length > 0 && (
        <div className="px-5 py-5">
          <p className="font-mono text-[10px] uppercase tracking-tight text-slate">
            {t("intel.considerations")}
          </p>
          <ul className="mt-3 space-y-3">
            {answer.considerations.map((c, i) => (
              <li key={i} className="flex items-start gap-3 rounded-md border border-slate-800 bg-mist/30 p-3.5">
                <span className="mt-0.5 font-mono text-[10px] font-semibold uppercase tracking-tight text-slate/60">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] leading-relaxed text-ink">{c.text}</p>
                  <p className="mt-1.5 flex flex-wrap items-center gap-1.5 font-mono text-[10px] uppercase tracking-tight text-slate/70">
                    {t("intel.citedIn")}
                    {c.refs.map((ref) => (
                      <span key={ref} className="rounded-sm border border-slate-800 bg-canvas px-1.5 py-0.5 font-semibold text-accent">
                        {ref}
                      </span>
                    ))}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {citations.length > 0 && (
        <div className="px-5 py-5">
          <p className="font-mono text-[10px] uppercase tracking-tight text-slate">
            {t("intel.sources")} · {citations.length}
          </p>
          <ul className="mt-3 divide-y divide-slate-800/60 border-y border-slate-800/60">
            {citations.map((c) => (
              <li key={c.id} className="flex items-start gap-3 py-3">
                <span className="w-6 shrink-0 pt-0.5 font-mono text-[11px] font-semibold text-accent">
                  {c.ref}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium leading-snug text-ink">{c.title}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-tight text-slate/70">
                    {c.publisher} · {c.publicationDate} · {c.jurisdiction.toUpperCase()}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {c.fixture && (
                    <span className="rounded-sm border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-tight text-amber-500">
                      {t("intel.fixture")}
                    </span>
                  )}
                  <a
                    href={c.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-tight text-ink transition-colors duration-300 ease-out hover:text-accent"
                  >
                    {t("intel.openSource")}
                    <ExternalLink className="h-3 w-3 rtl:rotate-180" strokeWidth={2} aria-hidden />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {answer.caveats.length > 0 && (
        <div className="px-5 py-5">
          <p className="font-mono text-[10px] uppercase tracking-tight text-slate">
            {t("intel.caveats")}
          </p>
          <ul className="mt-2 space-y-1.5">
            {answer.caveats.map((caveat, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] leading-relaxed text-slate">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-sm bg-slate/50" aria-hidden />
                {caveat}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}