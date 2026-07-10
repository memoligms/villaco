"use client";

import { useEffect, useMemo, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import type { Reservation } from "@/lib/types";

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];
const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function isoDate(d: Date): string {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60 * 1000).toISOString().slice(0, 10);
}

export default function AdminCalendarPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  useEffect(() => {
    adminApi
      .reservations()
      .then(setReservations)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Tarih -> durum: onaylı (dolu) veya bekleyen
  const bookedMap = useMemo(() => {
    const map = new Map<string, "confirmed" | "pending">();
    for (const r of reservations) {
      if (r.reservationStatus === "CANCELLED" || r.reservationStatus === "FAILED") continue;
      const start = new Date(r.checkIn);
      const end = new Date(r.checkOut);
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        const key = isoDate(d);
        if (r.reservationStatus === "CONFIRMED" || map.get(key) !== "confirmed") {
          map.set(key, r.reservationStatus === "CONFIRMED" ? "confirmed" : "pending");
        }
      }
    }
    return map;
  }, [reservations]);

  // Ay ızgarası (Pazartesi başlangıç)
  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7; // Pzt=0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const arr: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(new Date(year, month, d));
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [year, month]);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1);
  }

  const todayKey = isoDate(new Date());

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Takvim</h1>
          <p className="mt-1 text-sm text-slate-500">Villa doluluk durumu</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200">←</button>
          <span className="min-w-[140px] text-center text-sm font-semibold text-brand-navy">
            {MONTHS[month]} {year}
          </span>
          <button onClick={nextMonth} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200">→</button>
        </div>
      </div>

      {/* Açıklama */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red-500" /> Dolu (onaylı)</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-400" /> Bekleyen</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-slate-300 bg-white" /> Boş</span>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400">
          {WEEKDAYS.map((w) => <div key={w} className="py-1">{w}</div>)}
        </div>
        {loading ? (
          <p className="py-10 text-center text-slate-400">Yükleniyor...</p>
        ) : (
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const key = isoDate(d);
              const status = bookedMap.get(key);
              const isToday = key === todayKey;
              const base = "flex h-12 flex-col items-center justify-center rounded-lg text-sm";
              const cls =
                status === "confirmed"
                  ? "bg-red-500 text-white font-semibold"
                  : status === "pending"
                  ? "bg-amber-400 text-white font-medium"
                  : "bg-slate-50 text-slate-700";
              return (
                <div key={i} className={`${base} ${cls} ${isToday ? "ring-2 ring-brand-blue" : ""}`}>
                  {d.getDate()}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
