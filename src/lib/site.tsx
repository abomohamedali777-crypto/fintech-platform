"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  translations,
  extraTranslations,
  LANGS,
  RTL_LANGS,
  type Lang,
  type TKey,
  type ExtraKey,
} from "@/data/translations";

export const THEME_KEY = "sc-theme";
export const LANG_KEY = "sc-lang";

export type Theme = "light" | "dark";

interface SettingsValue {
  lang: Lang;
  theme: Theme;
  setLang: (lang: Lang) => void;
  toggleTheme: () => void;
  t: (key: TKey | ExtraKey, vars?: Record<string, string | number>) => string;
}

const SettingsContext = createContext<SettingsValue | null>(null);

function readStored(key: string, valid: readonly string[], fallback: string): string {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    if (v && (valid as readonly string[]).includes(v)) return v;
  } catch {
    /* ignore */
  }
  return fallback;
}

function systemTheme(): Theme {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function systemLang(): Lang {
  if (typeof window === "undefined" || !navigator.language) return "en";
  const base = navigator.language.split("-")[0].toLowerCase();
  return (LANGS as readonly string[]).includes(base) ? (base as Lang) : "en";
}

function applyDoc(theme: Theme, lang: Lang) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.lang = lang;
  root.dir = RTL_LANGS.has(lang) ? "rtl" : "ltr";
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [lang, setLangState] = useState<Lang>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setTheme(readStored(THEME_KEY, ["light", "dark"], systemTheme()) as Theme);
    setLangState(readStored(LANG_KEY, LANGS, systemLang()) as Lang);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    applyDoc(theme, lang);
    try {
      localStorage.setItem(THEME_KEY, theme);
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* ignore */
    }
  }, [theme, lang, ready]);

  const setLang = useCallback((next: Lang) => setLangState(next), []);

  const toggleTheme = useCallback(
    () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    [],
  );

  const t = useCallback(
    (key: TKey | ExtraKey, vars?: Record<string, string | number>) => {
      const dict = translations[lang] as Record<string, string>;
      const extra = extraTranslations[lang] as Record<string, string>;
      const enExtra = extraTranslations.en as Record<string, string>;
      const enDict = translations.en as Record<string, string>;
      let s = extra[key] ?? dict[key] ?? enExtra[key] ?? enDict[key] ?? String(key);
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          s = s.split(`{${k}}`).join(String(v));
        }
      }
      return s;
    },
    [lang],
  );

  const value = useMemo<SettingsValue>(
    () => ({ lang, theme, setLang, toggleTheme, t }),
    [lang, theme, setLang, toggleTheme, t],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within a SettingsProvider");
  return ctx;
}