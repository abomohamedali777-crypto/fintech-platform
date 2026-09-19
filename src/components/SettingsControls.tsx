"use client";

import { useState } from "react";
import { Moon, Sun, Check, Languages } from "lucide-react";
import { useSettings } from "@/lib/site";
import { LANGS, langNames, type Lang } from "@/data/translations";

export function ThemeToggle() {
  const { theme, toggleTheme, t } = useSettings();
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggleTheme}
      aria-label={t("themeToggle")}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate transition-all duration-300 ease-out hover:bg-mist hover:text-ink hover:shadow-[0_2px_10px_rgba(161,98,7,0.12)]"
    >
      {isDark ? (
        <Sun className="h-[18px] w-[18px]" strokeWidth={1.9} />
      ) : (
        <Moon className="h-[18px] w-[18px]" strokeWidth={1.9} />
      )}
    </button>
  );
}

export function LangPicker() {
  const { lang, setLang, t } = useSettings();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t("langSelect")}
        aria-expanded={open}
        className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-semibold uppercase tracking-tight text-slate transition-all duration-300 ease-out hover:bg-mist hover:text-ink"
      >
        <Languages className="h-4 w-4" strokeWidth={1.9} />
        {lang}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute end-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-md border border-slate-800 bg-canvas shadow-micro animate-fade-in">
            <p className="border-b border-slate-800 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-tight text-slate">
              {t("langSelect")}
            </p>
            <ul className="max-h-80 overflow-y-auto py-1.5">
              {LANGS.map((code: Lang) => {
                const meta = langNames.find((l) => l.code === code);
                const active = code === lang;
                return (
                  <li key={code}>
                    <button
                      onClick={() => {
                        setLang(code);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-[13px] transition-colors duration-200 ease-out ${
                        active
                          ? "font-semibold text-ink"
                          : "font-medium text-slate hover:bg-mist hover:text-ink"
                      }`}
                    >
                      <span className="flex min-w-0 items-baseline gap-2">
                        <span className="truncate">{meta?.native}</span>
                        <span className="text-[11px] text-slate/70">
                          {meta?.latin}
                        </span>
                      </span>
                      {active && <Check className="h-3.5 w-3.5 shrink-0 text-accent" strokeWidth={2.5} />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}