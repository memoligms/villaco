"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { LANGUAGE_CURRENCY, LANGUAGE_LOCALE } from "./languages";
import { useLanguage } from "./LanguageContext";

const STORAGE_KEY = "villaco_exchange_rates";
const CURRENCY_KEY = "villaco_currency";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const RATES_ENDPOINT = "https://open.er-api.com/v6/latest/USD";

export const SUPPORTED_CURRENCIES = ["TRY", "EUR", "USD", "GBP"] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_LABELS: Record<Currency, string> = {
  TRY: "₺ TRY",
  EUR: "€ EUR",
  USD: "$ USD",
  GBP: "£ GBP",
};

export const CURRENCY_FLAGS: Record<Currency, string> = {
  TRY: "🇹🇷",
  EUR: "🇪🇺",
  USD: "🇺🇸",
  GBP: "🇬🇧",
};

// Approximate fallback rates used only if the live rate fetch fails (e.g. offline).
const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  TRY: 34.5,
  EUR: 0.92,
  GBP: 0.79,
  RUB: 90,
};

interface CachedRates {
  fetchedAt: number;
  rates: Record<string, number>;
}

interface CurrencyContextValue {
  rates: Record<string, number>;
  isLive: boolean;
  currency: Currency;
  setCurrency: (c: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  rates: FALLBACK_RATES,
  isLive: false,
  currency: "TRY",
  setCurrency: () => {},
});

async function loadRates(): Promise<{ rates: Record<string, number>; isLive: boolean }> {
  try {
    const cachedRaw = window.localStorage.getItem(STORAGE_KEY);
    if (cachedRaw) {
      const cached: CachedRates = JSON.parse(cachedRaw);
      if (Date.now() - cached.fetchedAt < CACHE_TTL_MS && cached.rates.GBP) {
        return { rates: cached.rates, isLive: true };
      }
    }
  } catch {
    // ignore corrupt cache
  }

  try {
    const res = await fetch(RATES_ENDPOINT, { cache: "no-store" });
    const body = await res.json();
    if (body?.result === "success" && body?.rates) {
      const rates: Record<string, number> = {
        USD: 1,
        TRY: body.rates.TRY,
        EUR: body.rates.EUR,
        GBP: body.rates.GBP,
        RUB: body.rates.RUB,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ fetchedAt: Date.now(), rates }));
      return { rates, isLive: true };
    }
  } catch {
    // fall through to fallback rates
  }

  return { rates: FALLBACK_RATES, isLive: false };
}

function isCurrency(v: string | null): v is Currency {
  return !!v && (SUPPORTED_CURRENCIES as readonly string[]).includes(v);
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);
  const [isLive, setIsLive] = useState(false);
  const [currency, setCurrencyState] = useState<Currency>("TRY");
  const [userChose, setUserChose] = useState(false);

  useEffect(() => {
    loadRates().then((r) => {
      setRates(r.rates);
      setIsLive(r.isLive);
    });
    // Kullanıcı daha önce bir para birimi seçtiyse onu geri yükle.
    const saved = window.localStorage.getItem(CURRENCY_KEY);
    if (isCurrency(saved)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrencyState(saved);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUserChose(true);
    }
  }, []);

  // Kullanıcı elle seçmediyse, dile göre para birimini uygula.
  useEffect(() => {
    if (userChose) return;
    const byLang = LANGUAGE_CURRENCY[language];
    const next: Currency = byLang === "RUB" ? "USD" : (byLang as Currency);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrencyState(next);
  }, [language, userChose]);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    setUserChose(true);
    window.localStorage.setItem(CURRENCY_KEY, c);
  }, []);

  return (
    <CurrencyContext.Provider value={{ rates, isLive, currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const { currency, setCurrency } = useContext(CurrencyContext);
  return { currency, setCurrency };
}

export function useFormatPrice() {
  const { language } = useLanguage();
  const { rates, currency } = useContext(CurrencyContext);

  return (value: string | number) => {
    // Baz para birimi TRY'dir. Kurlar USD bazlı (rates[X] = 1 USD karşılığı X).
    // TRY tutarını hedef para birimine çevir: amountTry * (rates[hedef] / rates[TRY]).
    const amountTry = typeof value === "string" ? Number(value) : value;
    const perUsd = (c: string) => rates[c] ?? FALLBACK_RATES[c] ?? 1;
    const converted = currency === "TRY" ? amountTry : amountTry * (perUsd(currency) / perUsd("TRY"));
    return new Intl.NumberFormat(LANGUAGE_LOCALE[language], { style: "currency", currency }).format(converted);
  };
}
