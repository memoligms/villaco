"use client";

import Link from "next/link";
import type { Reservation } from "@/lib/types";
import { useT } from "@/lib/i18n/LanguageContext";

export function PaymentSuccessClient({ reservation }: { reservation: Reservation | null }) {
  const t = useT();

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600">
        ✓
      </div>
      <h1 className="mt-6 text-2xl font-bold text-brand-navy">{t.paymentSuccess.heading}</h1>
      <p className="mt-3 text-slate-600">{t.paymentSuccess.message}</p>

      {reservation ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-left text-sm shadow-sm">
          <Row label={t.paymentSuccess.reservationCode} value={reservation.reservationCode} />
          <Row label={t.paymentSuccess.villaLabel} value={reservation.villa.name} />
          <Row
            label={t.paymentSuccess.paymentStatusLabel}
            value={
              reservation.paymentStatus === "PAID"
                ? t.paymentSuccess.paymentStatusPaid
                : t.paymentSuccess.paymentStatusPending
            }
          />
        </div>
      ) : null}

      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center rounded-full bg-brand-blue px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-blue-dark"
      >
        {t.paymentSuccess.backHome}
      </Link>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-brand-navy">{value}</span>
    </div>
  );
}
