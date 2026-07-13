"use client";

import { useState } from "react";
import {
  SUPPORTED_CURRENCIES,
  CURRENCY_FLAGS,
  CURRENCY_LABELS,
  useCurrency,
} from "@/lib/i18n/CurrencyContext";

export function CurrencySwitcher({ className = "" }: { className?: string }) {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-brand-blue hover:text-brand-blue"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{CURRENCY_FLAGS[currency]}</span>
        <span>{CURRENCY_LABELS[currency]}</span>
        <span aria-hidden className="text-xs">▾</span>
      </button>

      {open ? (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {SUPPORTED_CURRENCIES.map((c) => (
            <li key={c}>
              <button
                type="button"
                onClick={() => {
                  setCurrency(c);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-slate-50 ${
                  c === currency ? "font-semibold text-brand-blue" : "text-slate-600"
                }`}
              >
                <span>{CURRENCY_FLAGS[c]}</span>
                <span>{CURRENCY_LABELS[c]}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
