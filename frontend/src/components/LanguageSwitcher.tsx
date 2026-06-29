"use client";

import { useState } from "react";
import { LANGUAGES, LANGUAGE_FLAGS, LANGUAGE_LABELS } from "@/lib/i18n/languages";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        onBlur={() => setTimeout(() => setOpen(false), 100)}
        className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-brand-blue hover:text-brand-blue"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{LANGUAGE_FLAGS[language]}</span>
        <span className="hidden sm:inline">{language.toUpperCase()}</span>
        <span aria-hidden className="text-xs">▾</span>
      </button>

      {open ? (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {LANGUAGES.map((lang) => (
            <li key={lang}>
              <button
                type="button"
                onClick={() => {
                  setLanguage(lang);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-slate-50 ${
                  lang === language ? "font-semibold text-brand-blue" : "text-slate-600"
                }`}
              >
                <span>{LANGUAGE_FLAGS[lang]}</span>
                <span>{LANGUAGE_LABELS[lang]}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
