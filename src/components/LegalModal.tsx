"use client";

import { useEffect, useRef, useState } from "react";
import { X, Scale, Check } from "lucide-react";
import { privacyPolicy, termsAndConditions } from "@/data/legal";

export type LegalTab = "privacy" | "terms";

export default function LegalModal({
  open,
  initialTab,
  onClose,
}: {
  open: boolean;
  initialTab: LegalTab;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<LegalTab>(initialTab);
  const [accepted, setAccepted] = useState<"privacy" | "terms" | null>(
    () => (typeof window !== "undefined" ? (localStorage.getItem("legal-accepted") as LegalTab | null) : null),
  );
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setTab(initialTab);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = setTimeout(() => {
      panelRef.current?.focus();
    }, 50);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      clearTimeout(focusTimer);
    };
  }, [open, initialTab, onClose]);

  useEffect(() => {
    if (open && panelRef.current) {
      panelRef.current.scrollTop = 0;
    }
  }, [open, tab]);

  if (!open) return null;

  const active = tab === "privacy" ? privacyPolicy : termsAndConditions;

  const acceptTab = () => {
    localStorage.setItem("legal-accepted", tab);
    setAccepted(tab);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      <div
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-lift animate-modal-in sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b hairline px-8 py-5">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-slate">
              <Scale className="h-3.5 w-3.5 text-accent" strokeWidth={2.2} />
              Legal Documentation · Updated September 2026
            </p>
            <h3 id="legal-modal-title" className="mt-1 text-xl font-semibold tracking-tight text-ink">
              {tab === "privacy" ? "Privacy Policy" : "Terms and Conditions of Service"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-300 ease-out hover:bg-mist"
            aria-label="Close legal document"
          >
            <X className="h-5 w-5 text-slate" />
          </button>
        </div>

        <div className="flex gap-1.5 border-b hairline bg-mist/40 px-8 py-3" role="tablist" aria-label="Legal documents">
          {(["privacy", "terms"] as LegalTab[]).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              aria-controls="legal-doc-panel"
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-[12px] font-medium transition-all duration-300 ease-out ${
                tab === t
                  ? "bg-accent text-white shadow-micro"
                  : "bg-white border hairline text-slate hover:text-ink"
              }`}
            >
              {t === "privacy" ? "Privacy Policy" : "Terms & Conditions"}
            </button>
          ))}
        </div>

        <div ref={panelRef} className="flex-1 overflow-y-auto px-8 py-7" role="tabpanel" aria-label={tab === "privacy" ? "Privacy Policy" : "Terms and Conditions"} tabIndex={-1}>
          <div key={tab} className="animate-fade-in space-y-7">
            {active.map((section) => {
              const Icon = section.icon;
              return (
                <section key={section.heading}>
                  <h4 className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight text-ink">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10">
                      <Icon className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
                    </span>
                    {section.heading}
                  </h4>
                  <div className="mt-2.5 space-y-2.5 pl-[38px]">
                    {section.paragraphs.map((p, i) => (
                      <p key={i} className="text-[13.5px] leading-relaxed text-slate">
                        {p}
                      </p>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t hairline bg-mist/40 px-8 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-[12px] text-slate">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors duration-300 ${
                accepted === tab ? "bg-accent" : "border hairline bg-white"
              }`}
            >
              {accepted === tab && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
            </span>
            {accepted === tab
              ? "You have accepted this document."
              : "Please review before continuing."}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-full border hairline bg-white px-5 py-2.5 text-[13px] font-medium text-ink transition-all duration-300 ease-out hover:bg-mist"
            >
              Close
            </button>
            <button
              onClick={acceptTab}
              className="rounded-full bg-accent px-5 py-2.5 text-[13px] font-semibold text-white shadow-micro transition-all duration-300 ease-out hover:shadow-lift hover:brightness-110"
            >
              Accept & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}