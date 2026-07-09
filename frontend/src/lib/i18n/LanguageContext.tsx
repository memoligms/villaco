"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_LANGUAGE, isLanguage, LANGUAGE_LOCALE, RTL_LANGUAGES, type Language } from "./languages";
import { TRANSLATIONS } from "./index";
import type { Translations } from "./types";
import { formatDate } from "@/lib/format";

const STORAGE_KEY = "villaco_language";

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    // Hydrate from localStorage once on mount (unavailable during SSR).
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLanguage(stored)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLanguageState(stored);
    }
  }, []);

  useEffect(() => {
    // The root <html lang> is hardcoded to "tr" for SSR; keep it in sync on the
    // client so CSS text-transform:uppercase doesn't apply Turkish dotted-I
    // casing rules (e.g. "ANREISE" -> "ANREİSE") to non-Turkish text.
    document.documentElement.lang = language;
    // Arapça gibi sağdan sola diller için yön ayarı.
    document.documentElement.dir = RTL_LANGUAGES.includes(language) ? "rtl" : "ltr";
  }, [language]);

  function setLanguage(lang: Language) {
    setLanguageState(lang);
    window.localStorage.setItem(STORAGE_KEY, lang);
  }

  const value: LanguageContextValue = {
    language,
    setLanguage,
    t: TRANSLATIONS[language],
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}

export function useT() {
  return useLanguage().t;
}

export function useFormatDate() {
  const { language } = useLanguage();
  return (value: string | Date) => formatDate(value, LANGUAGE_LOCALE[language]);
}
