"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import type { Reservation } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";

const reservationStatuses = ["PENDING", "CONFIRMED", "CANCELLED", "FAILED"];
const statusLabels: Record<string, string> = {
  PENDING: "Beklemede",
  CONFIRMED: "Onaylandı",
  CANCELLED: "İptal",
  FAILED: "Başarısız",
};
const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  FAILED: "bg-slate-200 text-slate-600",
};
const paymentLabels: Record<string, string> = {
  PENDING: "Bekliyor",
  PAID: "Ödendi",
  FAILED: "Başarısız",
};

type Preset = "all" | "today" | "week" | "month" | "custom";

function toInputDate(d: Date): string {
  // yyyy-mm-dd (yerel saat dilimine göre)
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60 * 1000).toISOString().slice(0, 10);
}

function presetRange(preset: Preset): { from: string; to: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (preset === "today") {
    return { from: toInputDate(start), to: toInputDate(start) };
  }
  if (preset === "week") {
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { from: toInputDate(start), to: toInputDate(end) };
  }
  // month
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  end.setDate(end.getDate() - 1);
  return { from: toInputDate(start), to: toInputDate(end) };
}

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [status, setStatus] = useState("");
  const [preset, setPreset] = useState<Preset>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Reservation | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    adminApi
      .reservations({
        status: status || undefined,
        from: from || undefined,
        to: to || undefined,
      })
      .then(setReservations)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [status, from, to]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function applyPreset(p: Preset) {
    setPreset(p);
    if (p === "all") {
      setFrom("");
      setTo("");
    } else if (p !== "custom") {
      const r = presetRange(p);
      setFrom(r.from);
      setTo(r.to);
    }
  }

  const totalRevenue = useMemo(
    () =>
      reservations
        .filter((r) => r.paymentStatus === "PAID")
        .reduce((sum, r) => sum + Number(r.totalPrice), 0),
    [reservations]
  );

  async function changeStatus(id: string, reservationStatus: string) {
    setSavingId(id);
    try {
      await adminApi.updateReservation(id, { reservationStatus });
      setReservations((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, reservationStatus: reservationStatus as Reservation["reservationStatus"] } : r
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Güncellenemedi.");
    } finally {
      setSavingId(null);
    }
  }

  const presetButtons: { key: Preset; label: string }[] = [
    { key: "all", label: "Tümü" },
    { key: "today", label: "Günlük" },
    { key: "week", label: "Haftalık" },
    { key: "month", label: "Aylık" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Rezervasyonlar</h1>
          <p className="mt-1 text-sm text-slate-500">
            {reservations.length} kayıt · Tahsil edilen:{" "}
            <span className="font-semibold text-brand-blue">{formatCurrency(totalRevenue)}</span>
          </p>
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input w-48">
          <option value="">Tüm Durumlar</option>
          {reservationStatuses.map((s) => (
            <option key={s} value={s}>
              {statusLabels[s]}
            </option>
          ))}
        </select>
      </div>

      {/* Tarih filtreleri */}
      <div className="card mt-4 flex flex-wrap items-end gap-4">
        <div className="flex flex-wrap gap-1.5">
          {presetButtons.map((b) => (
            <button
              key={b.key}
              type="button"
              onClick={() => applyPreset(b.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                preset === b.key
                  ? "bg-brand-blue text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
        <label className="text-xs font-medium text-slate-500">
          Başlangıç
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPreset("custom");
            }}
            className="input mt-1 w-40 py-1.5"
          />
        </label>
        <label className="text-xs font-medium text-slate-500">
          Bitiş
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPreset("custom");
            }}
            className="input mt-1 w-40 py-1.5"
          />
        </label>
        {(from || to) && (
          <button
            type="button"
            onClick={() => applyPreset("all")}
            className="rounded-full px-3 py-1.5 text-sm text-slate-500 underline hover:text-slate-700"
          >
            Temizle
          </button>
        )}
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Kod</th>
              <th className="px-4 py-3">Misafir</th>
              <th className="px-4 py-3">Tarihler</th>
              <th className="px-4 py-3">Tutar</th>
              <th className="px-4 py-3">Ödeme</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Yükleniyor...
                </td>
              </tr>
            ) : reservations.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Kayıt bulunamadı.
                </td>
              </tr>
            ) : (
              reservations.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setDetail(r)}
                      className="font-medium text-brand-blue underline-offset-2 hover:underline"
                    >
                      {r.reservationCode}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div className="font-medium text-brand-navy">{r.user?.fullName}</div>
                    <div className="text-xs text-slate-400">{r.user?.email}</div>
                    <div className="text-xs text-slate-400">{r.user?.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(r.checkIn)} <span className="text-slate-400">→</span> {formatDate(r.checkOut)}
                    <div className="text-xs text-slate-400">
                      {r.nightCount} gece · {r.guestCount} kişi
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-brand-navy">{formatCurrency(r.totalPrice)}</td>
                  <td className="px-4 py-3 text-slate-600">{paymentLabels[r.paymentStatus] ?? r.paymentStatus}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[r.reservationStatus]}`}>
                      {statusLabels[r.reservationStatus] ?? r.reservationStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={r.reservationStatus}
                      disabled={savingId === r.id}
                      onChange={(e) => changeStatus(r.id, e.target.value)}
                      className="input w-36 py-1.5 text-xs"
                    >
                      {reservationStatuses.map((s) => (
                        <option key={s} value={s}>
                          {statusLabels[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {detail && <ReservationDetail reservation={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function ReservationDetail({ reservation, onClose }: { reservation: Reservation; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-brand-navy">{reservation.reservationCode}</h2>
            <span className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-medium ${statusColors[reservation.reservationStatus]}`}>
              {statusLabels[reservation.reservationStatus]}
            </span>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Kapat">
            ✕
          </button>
        </div>

        <dl className="mt-5 space-y-3 text-sm">
          <Row label="Misafir" value={reservation.user?.fullName} />
          <Row label="E-posta" value={reservation.user?.email} />
          <Row label="Telefon" value={reservation.user?.phone} />
          <Row label="Giriş" value={formatDate(reservation.checkIn)} />
          <Row label="Çıkış" value={formatDate(reservation.checkOut)} />
          <Row label="Gece / Kişi" value={`${reservation.nightCount} gece · ${reservation.guestCount} kişi`} />
          <Row label="Gecelik Fiyat" value={formatCurrency(reservation.nightlyPrice)} />
          {Number(reservation.cleaningFee) > 0 && (
            <Row label="Temizlik" value={formatCurrency(reservation.cleaningFee)} />
          )}
          {Number(reservation.depositFee) > 0 && (
            <Row label="Depozito" value={formatCurrency(reservation.depositFee)} />
          )}
          <Row label="Ödeme Durumu" value={paymentLabels[reservation.paymentStatus] ?? reservation.paymentStatus} />
          {reservation.note ? <Row label="Not" value={reservation.note} /> : null}
        </dl>

        {reservation.extraServices?.length > 0 && (
          <div className="mt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ek Hizmetler</h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              {reservation.extraServices.map((es) => (
                <li key={es.id} className="flex justify-between">
                  <span>
                    {es.extraService?.name} {es.quantity > 1 ? `× ${es.quantity}` : ""}
                  </span>
                  <span className="font-medium text-brand-navy">{formatCurrency(es.totalPrice)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
          <span className="text-sm font-medium text-slate-500">Toplam</span>
          <span className="text-xl font-bold text-brand-navy">{formatCurrency(reservation.totalPrice)}</span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-right font-medium text-brand-navy">{value ?? "—"}</dd>
    </div>
  );
}
