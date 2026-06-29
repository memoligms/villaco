"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { LANGUAGE_CURRENCY, LANGUAGE_LOCALE } from "./languages";
import { useLanguage } from "./LanguageContext";

const STORAGE_KEY = "villaco_exchange_rates";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const RATES_ENDPOINT = "https://open.er-api.com/v6/latest/USD";

// Approximate fallback rates used only if the live rate fetch fails (e.g. offline).
const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  TRY: 34.5,
  EUR: 0.92,
  RUB: 90,
};

interface CachedRates {
  fetchedAt: number;
  rates: Record<string, number>;
}

interface CurrencyContextValue {
  rates: Record<string, number>;
  isLive: boolean;
}

const CurrencyContext = createContext<CurrencyContextValue>({ rates: FALLBACK_RATES, isLive: false });

async function loadRates(): Promise<{ rates: Record<string, number>; isLive: boolean }> {
  try {
    const cachedRaw = window.localStorage.getItem(STORAGE_KEY);
    if (cachedRaw) {
      const cached: CachedRates = JSON.parse(cachedRaw);
      if (Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
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

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CurrencyContextValue>({ rates: FALLBACK_RATES, isLive: false });

  useEffect(() => {
    loadRates().then(setState);
  }, []);

  return <CurrencyContext.Provider value={state}>{children}</CurrencyContext.Provider>;
}

export function useFormatPrice() {
  const { language } = useLanguage();
  const { rates } = useContext(CurrencyContext);

  return (value: string | number) => {
    const amountUsd = typeof value === "string" ? Number(value) : value;
    const currency = LANGUAGE_CURRENCY[language];
    const rate = currency === "USD" ? 1 : rates[currency] ?? FALLBACK_RATES[currency];
    const converted = amountUsd * rate;
    return new Intl.NumberFormat(LANGUAGE_LOCALE[language], { style: "currency", currency }).format(converted);
  };
}
