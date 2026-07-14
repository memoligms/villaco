"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ExtraService, Villa } from "@/lib/types";
import {
  getExtraServices,
  getVilla,
  getUnavailableDates,
  getActivePromotions,
  getStayRules,
  type StayRulesResponse,
} from "@/lib/api";
import { useLanguage, useT } from "@/lib/i18n/LanguageContext";
import { useFormatPrice, useCurrency } from "@/lib/i18n/CurrencyContext";
import { ApiError, createReservation, type GuestInput } from "@/lib/api";
import {
  computeDiscountPreview,
  isMobileDevice,
  type ActivePromotions,
} from "@/lib/discounts";
import { CurrencySwitcher } from "./CurrencySwitcher";
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
  const { currency } = useCurrency();

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
  const [guests, setGuests] = useState<GuestInput[]>([]);
  const [unavailable, setUnavailable] = useState<Set<string>>(new Set());
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [kvkkOpen, setKvkkOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const guestCountNum = Math.max(1, Math.min(Number(form.guestCount) || 1, villa.maxGuest));

  // Misafir sayısı değiştikçe misafir bilgi satırlarını senkronla.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGuests((prev) => {
      const next = [...prev];
      while (next.length < guestCountNum) next.push({ gender: "male", firstName: "", lastName: "" });
      next.length = guestCountNum;
      return next;
    });
  }, [guestCountNum]);

  function updateGuest(index: number, key: keyof GuestInput, value: string) {
    setGuests((prev) => prev.map((g, i) => (i === index ? { ...g, [key]: value } : g)));
  }

  // Dolu (müsait olmayan) günleri çek.
  useEffect(() => {
    getUnavailableDates()
      .then((d) => setUnavailable(new Set(d)))
      .catch(() => {});
  }, []);

  // Aktif indirimleri + minimum konaklama kurallarını çek.
  const [promotions, setPromotions] = useState<ActivePromotions | null>(null);
  const [stayRules, setStayRules] = useState<StayRulesResponse | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    // Cihaz tipini yalnızca istemcide tespit edebiliriz (SSR'de bilinmez).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMobile(isMobileDevice());
    getActivePromotions()
      .then(setPromotions)
      .catch(() => {});
    getStayRules()
      .then(setStayRules)
      .catch(() => {});
  }, []);

  // Seçilen giriş tarihi için geçerli minimum gece sayısı.
  const minNights = useMemo(() => {
    if (!stayRules) return 0;
    const ci = form.checkIn;
    if (!ci) return stayRules.defaultMinNights;
    let m = 0;
    for (const r of stayRules.rules) {
      if (ci >= r.startDate && ci <= r.endDate && r.minNights > m) m = r.minNights;
    }
    return m > 0 ? m : stayRules.defaultMinNights;
  }, [stayRules, form.checkIn]);

  // Seçilen aralıkta dolu gün var mı?
  function rangeHasUnavailable(ci: string, co: string): boolean {
    const d = new Date(`${ci}T00:00:00.000Z`);
    const end = new Date(`${co}T00:00:00.000Z`);
    while (d < end) {
      if (unavailable.has(d.toISOString().slice(0, 10))) return true;
      d.setUTCDate(d.getUTCDate() + 1);
    }
    return false;
  }

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

  // İndirim önizlemesi (Sipariş Özeti). Kesin tutar rezervasyon oluşturulurken backend'de hesaplanır.
  const discountPreview = useMemo(
    () => computeDiscountPreview(promotions, totalPrice, form.checkIn, nights, isMobile),
    [promotions, totalPrice, form.checkIn, nights, isMobile]
  );

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
    } else if (form.checkIn && form.checkOut && rangeHasUnavailable(form.checkIn, form.checkOut)) {
      next.checkOut = t.reservation.validation.datesUnavailable;
    } else if (form.checkIn && form.checkOut && minNights > 0 && nights < minNights) {
      next.checkOut = t.reservation.validation.minStay(minNights);
    }
    const guestCount = Number(form.guestCount);
    if (!guestCount || guestCount < 1) next.guestCount = t.reservation.validation.guestMin;
    if (guestCount > villa.maxGuest) next.guestCount = t.reservation.validation.guestMax(villa.maxGuest);
    if (form.fullName.trim().length < 4) next.fullName = t.reservation.validation.nameMin;
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = t.reservation.validation.emailInvalid;
    if (!/^\+?[0-9 ]{10,15}$/.test(form.phone.trim())) next.phone = t.reservation.validation.phoneInvalid;

    if (guests.some((g) => g.firstName.trim().length < 1 || g.lastName.trim().length < 1)) {
      next.guests = t.reservation.validation.guestsRequired;
    }
    if (!kvkkAccepted) next.kvkk = t.reservation.validation.kvkkRequired;

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
        currency,
        guests: guests.map((g) => ({
          gender: g.gender,
          firstName: g.firstName.trim(),
          lastName: g.lastName.trim(),
        })),
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
        <Link
          href="/rezervasyon-sorgula"
          className="flex items-center justify-between gap-2 rounded-xl border border-brand-blue/30 bg-brand-blue/5 px-4 py-3 text-sm font-medium text-brand-blue transition hover:bg-brand-blue/10"
        >
          <span>{t.header.checkReservation}</span>
          <span aria-hidden>→</span>
        </Link>
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

        {/* Misafir Bilgileri — misafir sayısına göre satır */}
        <div className="card">
          <h2 className="text-lg font-bold text-brand-navy">{t.reservation.guestInfoHeading}</h2>
          <p className="mt-1 text-xs text-slate-500">{t.reservation.guestInfoHint}</p>
          <div className="mt-4 space-y-4">
            {guests.map((g, i) => (
              <div key={i} className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {t.reservation.guestLabel(i + 1)}
                </p>
                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <label className="block text-sm font-medium text-slate-700">
                    {t.reservation.gender}
                    <select
                      value={g.gender}
                      onChange={(e) => updateGuest(i, "gender", e.target.value)}
                      className="input mt-1"
                    >
                      <option value="male">{t.reservation.genderMale}</option>
                      <option value="female">{t.reservation.genderFemale}</option>
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    {t.reservation.firstName}
                    <input
                      value={g.firstName}
                      onChange={(e) => updateGuest(i, "firstName", e.target.value)}
                      className="input mt-1"
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    {t.reservation.lastName}
                    <input
                      value={g.lastName}
                      onChange={(e) => updateGuest(i, "lastName", e.target.value)}
                      className="input mt-1"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
          {errors.guests ? <p className="mt-2 text-xs font-medium text-red-600">{errors.guests}</p> : null}
        </div>

        {submitError ? <p className="text-sm font-medium text-red-600">{submitError}</p> : null}
      </div>

      <aside>
        <div className="card sticky top-24">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-brand-navy">{t.reservation.summaryHeading}</h3>
            <CurrencySwitcher />
          </div>
          {minNights > 1 ? (
            <p className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
              {t.reservation.validation.minStay(minNights)}
            </p>
          ) : null}
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

            {discountPreview.discounts.length > 0 ? (
              <>
                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-slate-500">
                  <span>{t.payment.subtotalLabel}</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                {discountPreview.discounts.map((d, i) => {
                  const label =
                    d.type === "MOBILE"
                      ? t.payment.discountTypeMobile
                      : d.type === "WELCOME"
                      ? t.payment.discountTypeWelcome
                      : d.type === "LAST_MINUTE"
                      ? t.payment.discountTypeLastMinute
                      : d.type === "WEEKLY"
                      ? t.payment.discountTypeWeekly
                      : d.type === "MONTHLY"
                      ? t.payment.discountTypeMonthly
                      : d.label;
                  return (
                    <div key={`${d.type}-${i}`} className="flex items-center justify-between text-green-600">
                      <span>
                        {label} (%{d.percentage})
                      </span>
                      <span>−{formatPrice(d.amount)}</span>
                    </div>
                  );
                })}
              </>
            ) : null}

            <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base font-bold text-brand-navy">
              <span>{t.reservation.summaryTotal}</span>
              <span>{formatPrice(discountPreview.finalTotal)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !kvkkAccepted}
            className="mt-6 w-full rounded-full bg-brand-blue px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? t.reservation.submitting : t.reservation.submitCta}
          </button>

          {/* KVKK Aydınlatma Metni — oku (açılır/kapanır) ve kabul et */}
          <div className="mt-3">
            <label className="flex items-start gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={kvkkAccepted}
                onChange={(e) => setKvkkAccepted(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                {t.reservation.kvkkAccept}{" "}
                <button
                  type="button"
                  onClick={() => setKvkkOpen((o) => !o)}
                  className="font-medium text-brand-blue underline underline-offset-2"
                >
                  {kvkkOpen ? t.reservation.kvkkHide : t.reservation.kvkkRead}
                </button>
              </span>
            </label>
            {errors.kvkk ? <p className="mt-1 text-xs font-medium text-red-600">{errors.kvkk}</p> : null}
            {kvkkOpen ? (
              <div className="mt-2 max-h-60 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                <p className="text-sm font-bold text-brand-navy">{t.legal.kvkk.title}</p>
                {t.legal.kvkk.blocks.map((b, i) =>
                  b.type === "h2" ? (
                    <p key={i} className="pt-1 font-semibold text-brand-navy">
                      {b.text}
                    </p>
                  ) : (
                    <p key={i}>{b.text}</p>
                  )
                )}
              </div>
            ) : null}
          </div>

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
