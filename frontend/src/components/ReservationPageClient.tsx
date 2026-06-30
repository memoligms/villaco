"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ExtraService, Villa } from "@/lib/types";
import { getExtraServices, getVilla } from "@/lib/api";
import { useLanguage, useT } from "@/lib/i18n/LanguageContext";
import { useFormatPrice } from "@/lib/i18n/CurrencyContext";
import { ApiError, createReservation } from "@/lib/api";
import { CardLogos } from "./CardLogos";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

interface FormState {
  checkIn: string;
  checkOut: string;
  guestCount: string;
  fullName: string;
  email: string;
  phone: string;
  note: string;
}

export function ReservationPageClient() {
  const { language } = useLanguage();
  const t = useT();
  const [villa, setVilla] = useState<Villa | null>(null);
  const [extraServices, setExtraServices] = useState<ExtraService[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([getVilla(language), getExtraServices(language).catch(() => [])])
      .then(([v, services]) => {
        setVilla(v);
        setExtraServices(services);
      })
      .catch(() => setVilla(null))
      .finally(() => setLoaded(true));
  }, [language]);

  if (!loaded) {
    return <p className="mx-auto max-w-6xl px-4 py-24 text-center text-slate-400 sm:px-6">{t.common.loading}</p>;
  }

  if (!villa) {
    return (
      <p className="mx-auto max-w-6xl px-4 py-24 text-center text-slate-500 sm:px-6">{t.common.backendError}</p>
    );
  }

  return <ReservationForm villa={villa} extraServices={extraServices} />;
}

function ReservationForm({ villa, extraServices }: { villa: Villa; extraServices: ExtraService[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();
  const formatPrice = useFormatPrice();

  const [form, setForm] = useState<FormState>({
    checkIn: searchParams.get("checkIn") ?? "",
    checkOut: searchParams.get("checkOut") ?? "",
    guestCount: searchParams.get("guestCount") ?? "2",
    fullName: "",
    email: "",
    phone: "",
    note: "",
  });
  const [selectedServices, setSelectedServices] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const nights = useMemo(() => {
    if (!form.checkIn || !form.checkOut) return 0;
    const diff = Math.round(
      (new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff > 0 ? diff : 0;
  }, [form.checkIn, form.checkOut]);

  const nightlyPrice = Number(villa.baseNightlyPrice);
  const cleaningFee = Number(villa.cleaningFee);
  const depositFee = Number(villa.depositFee);
  const nightsTotal = nights * nightlyPrice;

  const extrasTotal = extraServices.reduce((sum, service) => {
    const qty = selectedServices[service.id] ?? 0;
    return sum + qty * Number(service.price);
  }, 0);

  const totalPrice = nights > 0 ? nightsTotal + cleaningFee + depositFee + extrasTotal : 0;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Tarih seçiminde geçmiş tarih girilirse (mobil takvim min'i zorlamasa bile) bugüne çekilir.
  function updateDate(key: "checkIn" | "checkOut", value: string) {
    const today = todayISO();
    const safe = value && value < today ? today : value;
    setForm((prev) => ({ ...prev, [key]: safe }));
  }

  function toggleService(serviceId: string, checked: boolean) {
    setSelectedServices((prev) => {
      const next = { ...prev };
      if (checked) {
        next[serviceId] = 1;
      } else {
        delete next[serviceId];
      }
      return next;
    });
  }

  function updateServiceQuantity(serviceId: string, quantity: number) {
    setSelectedServices((prev) => ({ ...prev, [serviceId]: Math.max(1, quantity) }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    const today = new Date().toISOString().slice(0, 10);

    if (!form.checkIn) next.checkIn = t.reservation.validation.checkInRequired;
    if (!form.checkOut) next.checkOut = t.reservation.validation.checkOutRequired;
    if (form.checkIn && form.checkIn < today) next.checkIn = t.reservation.validation.checkInPast;
    if (form.checkIn && form.checkOut && form.checkOut <= form.checkIn) {
      next.checkOut = t.reservation.validation.checkOutAfterCheckIn;
    }
    const guestCount = Number(form.guestCount);
    if (!guestCount || guestCount < 1) next.guestCount = t.reservation.validation.guestMin;
    if (guestCount > villa.maxGuest) next.guestCount = t.reservation.validation.guestMax(villa.maxGuest);
    if (form.fullName.trim().length < 4) next.fullName = t.reservation.validation.nameMin;
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = t.reservation.validation.emailInvalid;
    if (!/^\+?[0-9 ]{10,15}$/.test(form.phone.trim())) next.phone = t.reservation.validation.phoneInvalid;

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    setSubmitError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const reservation = await createReservation({
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        guestCount: Number(form.guestCount),
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        note: form.note.trim() || undefined,
        extraServiceIds: Object.entries(selectedServices).map(([id, quantity]) => ({ id, quantity })),
      });
      router.push(`/odeme/${reservation.reservationCode}`);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : t.reservation.submitError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div className="card">
          <h2 className="text-lg font-bold text-brand-navy">{t.reservation.dateGuestHeading}</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Field label={t.reservation.checkIn} error={errors.checkIn}>
              <input type="date" min={todayISO()} value={form.checkIn} onChange={(e) => updateDate("checkIn", e.target.value)} className="input" />
            </Field>
            <Field label={t.reservation.checkOut} error={errors.checkOut}>
              <input type="date" min={form.checkIn || todayISO()} value={form.checkOut} onChange={(e) => updateDate("checkOut", e.target.value)} className="input" />
            </Field>
          </div>
          <Field label={t.reservation.guestCount} error={errors.guestCount}>
            <input
              type="number"
              min={1}
              max={villa.maxGuest}
              value={form.guestCount}
              onChange={(e) => update("guestCount", e.target.value)}
              className="input"
            />
          </Field>
        </div>

        {extraServices.length > 0 ? (
          <div className="card">
            <h2 className="text-lg font-bold text-brand-navy">{t.reservation.extraServicesHeading}</h2>
            <div className="mt-4 space-y-3">
              {extraServices.map((service) => {
                const checked = service.id in selectedServices;
                return (
                  <label
                    key={service.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-3"
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => toggleService(service.id, e.target.checked)}
                        className="mt-1"
                      />
                      <div>
                        <p className="text-sm font-semibold text-brand-navy">{service.name}</p>
                        {service.description ? <p className="text-xs text-slate-500">{service.description}</p> : null}
                        <p className="text-xs font-medium text-brand-blue">
                          {formatPrice(service.price)} {t.reservation.perUnit}
                        </p>
                      </div>
                    </div>
                    {checked ? (
                      <input
                        type="number"
                        min={1}
                        value={selectedServices[service.id]}
                        onChange={(e) => updateServiceQuantity(service.id, Number(e.target.value))}
                        className="input w-16 text-center"
                      />
                    ) : null}
                  </label>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="card">
          <h2 className="text-lg font-bold text-brand-navy">{t.reservation.contactHeading}</h2>
          <Field label={t.reservation.fullName} error={errors.fullName}>
            <input value={form.fullName} onChange={(e) => update("fullName", e.target.value)} className="input" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.reservation.phone} error={errors.phone}>
              <input
                type="tel"
                placeholder="+90 5xx xxx xx xx"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className="input"
              />
            </Field>
            <Field label={t.reservation.email} error={errors.email}>
              <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="input" />
            </Field>
          </div>
          <Field label={t.reservation.note}>
            <textarea
              rows={3}
              value={form.note}
              onChange={(e) => update("note", e.target.value)}
              className="input resize-none"
              placeholder={t.reservation.notePlaceholder}
            />
          </Field>
        </div>

        {submitError ? <p className="text-sm font-medium text-red-600">{submitError}</p> : null}
      </div>

      <aside>
        <div className="card sticky top-24">
          <h3 className="text-lg font-bold text-brand-navy">{t.reservation.summaryHeading}</h3>
          <div className="mt-4 space-y-2 text-sm">
            <SummaryRow label={t.reservation.summaryCheckIn} value={form.checkIn || "—"} />
            <SummaryRow label={t.reservation.summaryCheckOut} value={form.checkOut || "—"} />
            <SummaryRow label={t.reservation.summaryNightsLabel} value={t.reservation.summaryNights(nights)} />
            <SummaryRow label={t.reservation.summaryGuestsLabel} value={t.reservation.summaryGuests(Number(form.guestCount))} />
          </div>
          <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
            <SummaryRow label={t.reservation.summaryNightly(nights)} value={formatPrice(nightsTotal)} />
            {cleaningFee > 0 ? <SummaryRow label={t.reservation.summaryCleaning} value={formatPrice(cleaningFee)} /> : null}
            {depositFee > 0 ? <SummaryRow label={t.reservation.summaryDeposit} value={formatPrice(depositFee)} /> : null}
            {extrasTotal > 0 ? <SummaryRow label={t.reservation.summaryExtras} value={formatPrice(extrasTotal)} /> : null}
            <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base font-bold text-brand-navy">
              <span>{t.reservation.summaryTotal}</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-6 w-full rounded-full bg-brand-blue px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-blue-dark disabled:opacity-60"
          >
            {submitting ? t.reservation.submitting : t.reservation.submitCta}
          </button>

          <div className="mt-3 flex items-center justify-center gap-2">
            <CardLogos />
          </div>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="mt-3 block text-sm font-medium text-slate-700">
      {label}
      <div className="mt-1">{children}</div>
      {error ? <span className="mt-1 block text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-slate-600">
      <span>{label}</span>
      <span className="font-medium text-brand-navy">{value}</span>
    </div>
  );
}
