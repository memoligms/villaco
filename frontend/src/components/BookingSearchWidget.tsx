"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/LanguageContext";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function BookingSearchWidget() {
  const router = useRouter();
  const t = useT();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guestCount, setGuestCount] = useState(2);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const diff = Math.round(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff > 0 ? diff : 0;
  }, [checkIn, checkOut]);

  function handleSearch() {
    const params = new URLSearchParams();
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    params.set("guestCount", String(guestCount));
    router.push(`/rezervasyon?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-xl sm:flex-row sm:items-stretch sm:gap-2 sm:p-3">
      <Field label={t.booking.checkIn}>
        <input
          type="date"
          min={todayISO()}
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          className="w-full border-none p-0 text-sm font-semibold text-brand-navy outline-none"
        />
      </Field>

      <Divider />

      <Field label={t.booking.checkOut} badge={nights > 0 ? t.booking.nightsBadge(nights) : undefined}>
        <input
          type="date"
          min={checkIn || todayISO()}
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          className="w-full border-none p-0 text-sm font-semibold text-brand-navy outline-none"
        />
      </Field>

      <Divider />

      <Field label={t.booking.guests}>
        <select
          value={guestCount}
          onChange={(e) => setGuestCount(Number(e.target.value))}
          className="w-full border-none p-0 text-sm font-semibold text-brand-navy outline-none"
        >
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {t.booking.guestOption(n)}
            </option>
          ))}
        </select>
      </Field>

      <button
        onClick={handleSearch}
        className="flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-blue-dark sm:px-8"
      >
        {t.booking.searchCta}
      </button>
    </div>
  );
}

function Field({ label, badge, children }: { label: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="flex-1 rounded-xl border border-slate-200 px-4 py-2 sm:border-0 sm:px-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        {badge ? (
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-brand-blue">{badge}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="hidden w-px self-stretch bg-slate-200 sm:block" />;
}
