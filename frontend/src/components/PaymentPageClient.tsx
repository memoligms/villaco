"use client";

import type { Reservation } from "@/lib/types";
import { useT, useFormatDate } from "@/lib/i18n/LanguageContext";
import { useFormatPrice } from "@/lib/i18n/CurrencyContext";
import { SipayCheckout } from "@/components/SipayCheckout";

export function PaymentPageClient({ reservation }: { reservation: Reservation }) {
  const t = useT();
  const formatPrice = useFormatPrice();
  const formatDate = useFormatDate();

  if (reservation.paymentStatus === "PAID") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <p className="text-lg font-semibold text-brand-navy">
          {t.payment.alreadyPaid} {reservation.reservationCode}
        </p>
      </div>
    );
  }

  // Onay bekleyen talep: ödeme yapılamaz, bilgilendirme gösterilir.
  if (reservation.reservationStatus === "AWAITING_APPROVAL") {
    return (
      <StatusNotice
        tone="info"
        title={t.payment.awaitingApprovalTitle}
        note={t.payment.awaitingApprovalNote}
        codeLabel={t.payment.reservationCodeLabel}
        code={reservation.reservationCode}
      />
    );
  }

  // Reddedilen/iptal talep.
  if (reservation.reservationStatus === "REJECTED" || reservation.reservationStatus === "CANCELLED") {
    return (
      <StatusNotice
        tone="error"
        title={t.payment.rejectedTitle}
        note={t.payment.rejectedNote}
        codeLabel={t.payment.reservationCodeLabel}
        code={reservation.reservationCode}
      />
    );
  }

  const nightsTotal = Number(reservation.nightlyPrice) * reservation.nightCount;
  const extrasTotal = reservation.extraServices.reduce((sum, item) => sum + Number(item.totalPrice), 0);
  const discounts = reservation.discounts ?? [];
  const discountTotal = Number(reservation.discountTotal ?? 0);
  const subtotal = Number(reservation.totalPrice) + discountTotal;

  const discountLabel = (type: string, fallback: string) => {
    if (type === "MOBILE") return t.payment.discountTypeMobile;
    if (type === "WELCOME") return t.payment.discountTypeWelcome;
    if (type === "LAST_MINUTE") return t.payment.discountTypeLastMinute;
    return fallback;
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <div className="card">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">{t.payment.summaryTitle}</p>
          <h2 className="mt-1 text-lg font-bold text-brand-navy">{reservation.villa.name}</h2>
          <p className="text-sm text-slate-500">{reservation.villa.location}</p>

          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <Row label={t.payment.checkInLabel} value={formatDate(reservation.checkIn)} />
            <Row label={t.payment.checkOutLabel} value={formatDate(reservation.checkOut)} />
            <Row label={t.payment.nightsLabel} value={t.reservation.summaryNights(reservation.nightCount)} />
            <Row label={t.payment.guestsLabel} value={t.reservation.summaryGuests(reservation.guestCount)} />
          </div>

          <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
            <Row label={t.payment.nightlyTimes(reservation.nightCount)} value={formatPrice(nightsTotal)} />
            {Number(reservation.cleaningFee) > 0 ? (
              <Row label={t.payment.cleaningLabel} value={formatPrice(reservation.cleaningFee)} />
            ) : null}
            {Number(reservation.depositFee) > 0 ? (
              <Row label={t.payment.depositLabel} value={formatPrice(reservation.depositFee)} />
            ) : null}
            {extrasTotal > 0 ? <Row label={t.payment.extrasLabel} value={formatPrice(extrasTotal)} /> : null}

            {discounts.length > 0 ? (
              <>
                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-slate-500">
                  <span>{t.payment.subtotalLabel}</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discounts.map((d, i) => (
                  <div key={`${d.type}-${i}`} className="flex items-center justify-between text-green-600">
                    <span>
                      {discountLabel(d.type, d.label)} (%{d.percentage})
                    </span>
                    <span>−{formatPrice(d.amount)}</span>
                  </div>
                ))}
              </>
            ) : null}

            <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-base font-bold text-brand-navy">
              <span>{t.payment.totalLabel}</span>
              <span>{formatPrice(reservation.totalPrice)}</span>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-600">
            <p className="font-semibold text-brand-navy">{t.payment.customerInfoTitle}</p>
            <p className="mt-1">{reservation.user.fullName}</p>
            <p>{reservation.user.email}</p>
            <p>{reservation.user.phone}</p>
          </div>

          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
            {t.payment.reservationCodeLabel} <span className="font-semibold">{reservation.reservationCode}</span>
          </p>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="card">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">{t.payment.securePaymentLabel}</p>
          <h2 className="mt-1 text-lg font-bold text-brand-navy">{t.payment.sandboxTitle}</h2>
          <p className="mt-2 text-sm text-slate-500">{t.payment.sandboxNote}</p>

          <div className="mt-6">
            <SipayCheckout reservationCode={reservation.reservationCode} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusNotice({
  tone,
  title,
  note,
  codeLabel,
  code,
}: {
  tone: "info" | "error";
  title: string;
  note: string;
  codeLabel: string;
  code: string;
}) {
  const styles =
    tone === "info"
      ? "border-blue-200 bg-blue-50 text-blue-800"
      : "border-red-200 bg-red-50 text-red-700";
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className={`rounded-2xl border p-6 text-center ${styles}`}>
        <p className="text-4xl">{tone === "info" ? "⏳" : "⚠️"}</p>
        <h1 className="mt-3 text-xl font-bold">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed">{note}</p>
        <p className="mt-4 text-sm">
          {codeLabel} <span className="font-semibold">{code}</span>
        </p>
      </div>
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
