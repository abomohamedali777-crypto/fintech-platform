"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { useSettings } from "@/lib/site";

declare global {
  interface Window {
    __mizanConsent?: (prefs?: { fonts?: boolean }) => void;
  }
}

export default function CookieBanner({
  onOpenPrivacy,
  onOpenTerms,
}: {
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
}) {
  const { t } = useSettings();
  const [visible, setVisible] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [fonts, setFonts] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem("sc-cookies")) return;
    } catch {
      /* storage unavailable */
    }
    const timer = setTimeout(() => setVisible(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  const persist = (prefs: { fonts: boolean }) => {
    try {
      localStorage.setItem("sc-cookies", JSON.stringify(prefs));
    } catch {
      /* storage unavailable */
    }
    window.__mizanConsent?.(prefs);
    setVisible(false);
  };

  if (!visible) return null;

  const renderText = (raw: string): ReactNode[] =>
    raw.split(/(\[\[terms\]\]|\[\[privacy\]\])/).map((part, i) => {
      if (part === "[[terms]]") {
        return (
          <button
            key={i}
            type="button"
            onClick={onOpenTerms}
            className="font-semibold text-ink underline decoration-slate/40 underline-offset-2 transition-colors duration-300 ease-out hover:text-accent"
          >
            {t("termsConditions")}
          </button>
        );
      }
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

  return (
    <div
      role="region"
      aria-label="Cookie preferences"
      className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-4 animate-slide-up"
    >
      <div className="w-full max-w-4xl rounded-md border border-slate-800 bg-canvas/95 p-5 shadow-micro backdrop-blur-md sm:px-6 animate-modal-in">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent/10">
              <ShieldCheck className="h-4 w-4 text-accent" strokeWidth={2} />
            </span>
            <p className="max-w-xl text-[13px] leading-relaxed text-slate">
              {renderText(t("cookieText"))}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPrefsOpen((v) => !v)}
              aria-expanded={prefsOpen}
              className="rounded-md border border-slate-800 bg-mist/50 px-5 py-2.5 text-[13px] font-semibold tracking-tight text-ink transition-colors duration-300 ease-out hover:border-accent/40 hover:text-accent"
            >
              {t("cookiePrefs")}
            </button>
            <button
              type="button"
              onClick={() => persist({ fonts: false })}
              className="rounded-md border border-slate-800 bg-mist/50 px-5 py-2.5 text-[13px] font-semibold tracking-tight text-ink transition-colors duration-300 ease-out hover:border-accent/40 hover:text-accent"
            >
              {t("cookieReject")}
            </button>
            <button
              type="button"
              onClick={() => persist({ fonts: true })}
              className="rounded-md bg-gradient-to-b from-accent to-accent-strong px-6 py-2.5 text-[13px] font-semibold tracking-tight text-white shadow-gold transition-all duration-300 ease-out hover:brightness-110"
            >
              {t("cookieAcceptAll")}
            </button>
          </div>
        </div>

        {prefsOpen && (
          <div className="mt-4 rounded-md border border-slate-800 bg-mist/40 p-4 animate-fade-in">
            <p className="text-[13px] font-semibold tracking-tight text-ink">{t("cookiePrefsTitle")}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-slate">{t("cookiePrefsBody")}</p>

            <div className="mt-3 space-y-2.5">
              <div className="flex items-center justify-between gap-4 rounded-md bg-canvas/70 px-4 py-3">
                <div>
                  <p className="text-[13px] font-semibold tracking-tight text-ink">{t("cookieEssential")}</p>
                  <p className="text-[12px] leading-relaxed text-slate">
                    {t("cookieEssentialSub")}
                  </p>
                </div>
                <span
                  aria-hidden
                  className="flex h-6 w-11 shrink-0 items-center rounded-sm bg-accent px-0.5 opacity-80"
                >
                  <span className="ml-auto h-5 w-5 rounded-sm bg-white shadow-micro" />
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-md bg-canvas/70 px-4 py-3">
                <div>
                  <p className="text-[13px] font-semibold tracking-tight text-ink">{t("cookieFonts")}</p>
                  <p className="text-[12px] leading-relaxed text-slate">{t("cookieFontsSub")}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={fonts}
                  aria-label={t("cookieFonts")}
                  onClick={() => setFonts((v) => !v)}
                  className={`flex h-6 w-11 shrink-0 items-center rounded-sm border border-slate-800 p-0.5 transition-colors duration-300 ease-out ${
                    fonts ? "bg-accent" : "bg-mist"
                  }`}
                >
                  <span
                    className={`h-5 w-5 rounded-sm bg-white shadow-micro transition-transform duration-300 ease-out ${
                      fonts ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => persist({ fonts })}
                className="rounded-md bg-accent px-6 py-2.5 text-[13px] font-semibold tracking-tight text-white shadow-micro transition-all duration-300 ease-out hover:brightness-110"
              >
                {t("cookieSave")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}