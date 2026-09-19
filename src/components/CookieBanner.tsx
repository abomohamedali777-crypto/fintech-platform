"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { useSettings } from "@/lib/site";

export default function CookieBanner({
  onOpenPrivacy,
  onOpenTerms,
}: {
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
}) {
  const { t } = useSettings();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("consent-banner-dismissed")) {
      const timer = setTimeout(() => setVisible(true), 1800);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("consent-banner-dismissed", "true");
    setVisible(false);
  };

  if (!visible) return null;

  const renderText = (raw: string): ReactNode[] =>
    raw.split(/(\[\[terms\]\]|\[\[privacy\]\])/).map((part, i) => {
      if (part === "[[terms]]") {
        return (
          <button
            key={i}
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
    <div className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-4 animate-slide-up">
      <div className="flex w-full max-w-4xl flex-col gap-4 rounded-2xl border hairline bg-canvas/95 p-5 shadow-lift backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10">
            <ShieldCheck className="h-4 w-4 text-accent" strokeWidth={2} />
          </span>
          <p className="text-[13px] leading-relaxed text-slate">
            {renderText(t("cookieText"))}
          </p>
        </div>
        <button
          onClick={accept}
          className="shrink-0 rounded-full bg-accent px-6 py-3 text-[13px] font-semibold text-white shadow-micro transition-all duration-300 ease-out hover:shadow-lift hover:brightness-110"
        >
          {t("accept")}
        </button>
      </div>
    </div>
  );
}