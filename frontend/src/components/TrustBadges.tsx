"use client";

import { useT } from "@/lib/i18n/LanguageContext";

export function TrustBadges() {
  const t = useT();

  return (
    <section id="guven" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h2 className="text-center text-2xl font-bold text-brand-navy sm:text-3xl">{t.trustBadges.heading}</h2>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {t.trustBadges.items.map((badge) => (
          <div key={badge.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-brand-blue">
              ✓
            </div>
            <p className="font-semibold text-brand-navy">{badge.title}</p>
            <p className="mt-1 text-sm text-slate-500">{badge.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
