export const LANGUAGES = ["tr", "en", "de", "ru"] as const;
export type Language = (typeof LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<Language, string> = {
  tr: "Türkçe",
  en: "English",
  de: "Deutsch",
  ru: "Русский",
};

export const LANGUAGE_FLAGS: Record<Language, string> = {
  tr: "🇹🇷",
  en: "🇬🇧",
  de: "🇩🇪",
  ru: "🇷🇺",
};

export const LANGUAGE_CURRENCY: Record<Language, "TRY" | "USD" | "EUR" | "RUB"> = {
  tr: "TRY",
  en: "USD",
  de: "EUR",
  ru: "RUB",
};

export const LANGUAGE_LOCALE: Record<Language, string> = {
  tr: "tr-TR",
  en: "en-US",
  de: "de-DE",
  ru: "ru-RU",
};

export const DEFAULT_LANGUAGE: Language = "tr";

export function isLanguage(value: string | null | undefined): value is Language {
  return !!value && (LANGUAGES as readonly string[]).includes(value);
}
