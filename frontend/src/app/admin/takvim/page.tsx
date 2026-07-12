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
  const [blocked, setBlocked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  // Düzenleme modu: takvim varsayılan olarak kilitli. "Düzenle" ile açılır,
  // değişiklikler taslakta tutulur, "Kaydet" ile topluca işlenir.
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([adminApi.reservations(), adminApi.blockedDates()])
      .then(([res, bd]) => {
        setReservations(res);
        setBlocked(new Set(bd));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Rezervasyondan gelen dolu günler (manuel bloklardan ayrı)
  const reservedMap = useMemo(() => {
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

  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7;
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

  // Ekranda gösterilecek dolu-manuel kümesi: düzenlemedeyken taslak, değilse kayıtlı
  const view = editing ? draft : blocked;

  // Taslak ile kayıtlı arasında fark var mı?
  const dirtyCount = useMemo(() => {
    if (!editing) return 0;
    let n = 0;
    const all = new Set([...blocked, ...draft]);
    for (const k of all) {
      if (blocked.has(k) !== draft.has(k)) n++;
    }
    return n;
  }, [editing, blocked, draft]);

  function startEdit() {
    setError(null);
    setDraft(new Set(blocked));
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft(new Set());
    setError(null);
  }

  function toggleDraft(key: string) {
    // Rezervasyondan dolu günler buradan değiştirilemez
    if (reservedMap.has(key)) {
      setError("Bu gün bir rezervasyona ait; takvimden kaldırılamaz. (Rezervasyonlar sekmesinden yönetin.)");
      return;
    }
    setError(null);
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function save() {
    setError(null);
    setSaving(true);
    // Yalnızca değişen günleri gönder (eklenen + kaldırılan)
    const changed: string[] = [];
    const all = new Set([...blocked, ...draft]);
    for (const k of all) {
      if (blocked.has(k) !== draft.has(k)) changed.push(k);
    }
    try {
      for (const key of changed) {
        await adminApi.toggleBlockedDate(key);
      }
      setBlocked(new Set(draft));
      setEditing(false);
      setDraft(new Set());
    } catch (e) {
      // Hata: sunucudaki gerçek durumu yeniden çek
      setError(e instanceof Error ? e.message : "Kaydedilemedi.");
      try {
        const bd = await adminApi.blockedDates();
        setBlocked(new Set(bd));
        setDraft(new Set(bd));
      } catch { /* yoksay */ }
    } finally {
      setSaving(false);
    }
  }

  const todayKey = isoDate(new Date());

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Takvim</h1>
          <p className="mt-1 text-sm text-slate-500">
            {editing
              ? "Düzenleme modu — dolu/boş yapmak için günlere tıklayın, sonra Kaydet"
              : "Doluluk durumu — değişiklik için Düzenle'ye basın"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!editing ? (
            <button
              onClick={startEdit}
              disabled={loading}
              className="rounded-lg bg-brand-navy px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              Düzenle
            </button>
          ) : (
            <>
              <button
                onClick={cancelEdit}
                disabled={saving}
                className="rounded-lg bg-slate-100 px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50"
              >
                İptal
              </button>
              <button
                onClick={save}
                disabled={saving || dirtyCount === 0}
                className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? "Kaydediliyor..." : dirtyCount > 0 ? `Kaydet (${dirtyCount})` : "Kaydet"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200">←</button>
          <span className="min-w-[140px] text-center text-sm font-semibold text-brand-navy">{MONTHS[month]} {year}</span>
          <button onClick={nextMonth} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200">→</button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red-500" /> Rezervasyon (dolu)</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-400" /> Bekleyen ödeme</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-purple-500" /> Manuel dolu (Airbnb vb.)</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-slate-300 bg-white" /> Boş</span>
      </div>

      {editing ? (
        <p className="mt-2 text-xs text-slate-400">
          💡 Airbnb gibi başka platformlarda dolu olan günlere tıklayıp <b>mor (manuel dolu)</b> yapın; kaydettiğinizde o günler siteden rezervasyona kapanır.
        </p>
      ) : null}

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

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
              const resv = reservedMap.get(key);
              const isBlocked = view.has(key);
              const isToday = key === todayKey;
              const cls = resv === "confirmed"
                ? "bg-red-500 text-white font-semibold cursor-not-allowed"
                : resv === "pending"
                ? "bg-amber-400 text-white font-medium cursor-not-allowed"
                : isBlocked
                ? "bg-purple-500 text-white font-semibold" + (editing ? " hover:bg-purple-600" : "")
                : "bg-slate-50 text-slate-700" + (editing ? " hover:bg-slate-200" : "");
              const clickable = editing && !resv;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => editing && toggleDraft(key)}
                  disabled={!clickable}
                  title={
                    resv
                      ? "Rezervasyon"
                      : !editing
                      ? (isBlocked ? "Manuel dolu" : "Boş")
                      : isBlocked
                      ? "Manuel dolu — kaldırmak için tıkla"
                      : "Boş — dolu işaretlemek için tıkla"
                  }
                  className={`flex h-12 items-center justify-center rounded-lg text-sm transition ${cls} ${
                    isToday ? "ring-2 ring-brand-blue" : ""
                  } ${!clickable && !resv ? "cursor-default" : ""}`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
