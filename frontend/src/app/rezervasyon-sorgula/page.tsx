"use client";

import { useState } from "react";
import Link from "next/link";
import { ApiError, lookupReservation, type ReservationLookup } from "@/lib/api";
import { useT, useFormatDate } from "@/lib/i18n/LanguageContext";
import { useFormatPrice } from "@/lib/i18n/CurrencyContext";

export default function ReservationLookupPage() {
  const t = useT();
  const formatPrice = useFormatPrice();
  const formatDate = useFormatDate();
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReservationLookup | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    setResult(null);
    try {
      const data = await lookupReservation(code.trim(), email.trim());
      setResult(data);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setError(err instanceof ApiError ? err.message : t.common.errorGeneric);
    }
  }

  const statusNote = (r: ReservationLookup) => {
    if (r.paymentStatus === "PAID") return { tone: "ok", text: t.lookup.statusPaidNote };
    if (r.reservationStatus === "APPROVED") return { tone: "info", text: t.lookup.statusApprovedNote };
    if (r.reservationStatus === "AWAITING_APPROVAL") return { tone: "warn", text: t.lookup.statusAwaitingNote };
    if (r.reservationStatus === "REJECTED" || r.reservationStatus === "CANCELLED")
      return { tone: "err", text: t.lookup.statusRejectedNote };
    return { tone: "warn", text: t.lookup.statusAwaitingNote };
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-brand-navy">{t.lookup.heading}</h1>
      <p className="mt-3 text-slate-600">{t.lookup.intro}</p>

      <form onSubmit={handleSubmit} className="card mt-8 space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          {t.lookup.codeLabel}
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="VC-260713-XXXXX"
            className="input mt-1"
            required
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t.lookup.emailLabel}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input mt-1"
            required
          />
        </label>
        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-full bg-brand-blue px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-blue-dark disabled:opacity-60"
        >
          {status === "loading" ? t.lookup.submitting : t.lookup.submitCta}
        </button>
      </form>

      {result ? (
        <div className="card mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-brand-navy">{result.reservationCode}</h2>
            <span className="text-sm text-slate-500">{result.villaName}</span>
          </div>

          <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
            <Row label={t.payment.checkInLabel} value={formatDate(result.checkIn)} />
            <Row label={t.payment.checkOutLabel} value={formatDate(result.checkOut)} />
            <Row label={t.payment.nightsLabel} value={t.reservation.summaryNights(result.nightCount)} />
            <Row label={t.payment.guestsLabel} value={t.reservation.summaryGuests(result.guestCount)} />
            <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-base font-bold text-brand-navy">
              <span>{t.lookup.amountLabel}</span>
              <span>{formatPrice(result.totalPrice)}</span>
            </div>
          </div>

          {(() => {
            const s = statusNote(result);
            const cls =
              s.tone === "ok"
                ? "border-green-200 bg-green-50 text-green-700"
                : s.tone === "info"
                ? "border-blue-200 bg-blue-50 text-blue-800"
                : s.tone === "err"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-amber-200 bg-amber-50 text-amber-800";
            return <p className={`mt-4 rounded-xl border p-3 text-sm ${cls}`}>{s.text}</p>;
          })()}

          {result.payable ? (
            <Link
              href={`/odeme/${result.reservationCode}`}
              className="mt-4 block w-full rounded-full bg-brand-navy px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-blue"
            >
              {t.lookup.payCta}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-brand-navy">{value}</span>
    </div>
  );
}
