"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

export default function CookieBanner({
  onOpenPrivacy,
  onOpenTerms,
}: {
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("consent-banner-dismissed")) {
      const t = setTimeout(() => setVisible(true), 1800);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("consent-banner-dismissed", "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-4 animate-slide-up">
      <div className="flex w-full max-w-4xl flex-col gap-4 rounded-2xl border hairline bg-white/95 p-5 shadow-lift backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10">
            <ShieldCheck className="h-4 w-4 text-accent" strokeWidth={2} />
          </span>
          <p className="text-[13px] leading-relaxed text-slate">
            By using this enterprise infrastructure, you agree to our{" "}
            <button
              onClick={onOpenTerms}
              className="font-semibold text-ink underline decoration-slate/40 underline-offset-2 transition-colors duration-300 ease-out hover:text-accent"
            >
              Terms of Service
            </button>{" "}
            and{" "}
            <button
              onClick={onOpenPrivacy}
              className="font-semibold text-ink underline decoration-slate/40 underline-offset-2 transition-colors duration-300 ease-out hover:text-accent"
            >
              Privacy Policy
            </button>
            . All financial operations are subject to ISO-27001 security
            protocols.
          </p>
        </div>
        <button
          onClick={accept}
          className="shrink-0 rounded-full bg-accent px-6 py-3 text-[13px] font-semibold text-white shadow-micro transition-all duration-300 ease-out hover:shadow-lift hover:brightness-110"
        >
          Accept
        </button>
      </div>
    </div>
  );
}