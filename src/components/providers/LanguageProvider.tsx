"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { en, fa, type Translations, type Locale, LOCALE_COOKIE, DEFAULT_LOCALE } from "@/i18n";

interface LanguageContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const dictionaries: Record<Locale, Translations> = { en, fa };

function getInitialLocale(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const cookie = document.cookie.split("; ").find((r) => r.startsWith(LOCALE_COOKIE + "="));
  const val = cookie?.split("=")[1];
  if (val === "fa" || val === "en") return val;
  return DEFAULT_LOCALE;
}

// Resolve nested key like "nav.feed" → "Feed"
function resolve(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let cur: unknown = obj;
  for (const k of keys) {
    if (cur == null || typeof cur !== "object") return path;
    cur = (cur as Record<string, unknown>)[k];
  }
  return typeof cur === "string" ? cur : path;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    setLocaleState(getInitialLocale());
  }, []);

  useEffect(() => {
    const dir = locale === "fa" ? "rtl" : "ltr";
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000`;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
  }, []);

  const t = useCallback(
    (key: string) => resolve(dictionaries[locale] as unknown as Record<string, unknown>, key),
    [locale]
  );

  const dir: "ltr" | "rtl" = locale === "fa" ? "rtl" : "ltr";

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
