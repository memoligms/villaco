"use client";

import { useRef, useState } from "react";
import { initializeSipayPayment } from "@/lib/api";
import { useT } from "@/lib/i18n/LanguageContext";

interface Props {
  reservationCode: string;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 12 }, (_, i) => String(currentYear + i));
const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));

export function SipayCheckout({ reservationCode }: Props) {
  const t = useT();
  const [holderName, setHolderName] = useState("");
  const [number, setNumber] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [redirecting, setRedirecting] = useState(false);

  function formatCardNumber(v: string) {
    return v
      .replace(/\D/g, "")
      .slice(0, 19)
      .replace(/(.{4})/g, "$1 ")
      .trim();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const digits = number.replace(/\s+/g, "");
    if (holderName.trim().length < 3) return setError(t.payment.cardHolderError);
    if (digits.length < 15) return setError(t.payment.cardNumberError);
    if (!expiryMonth || !expiryYear) return setError(t.payment.cardExpiryError);
    if (cvv.length < 3) return setError(t.payment.cardCvvError);

    setSubmitting(true);
    try {
      const { html } = await initializeSipayPayment(reservationCode, {
        holderName: holderName.trim(),
        number: digits,
        expiryMonth,
        expiryYear,
        cvv,
      });
      // Sipay 3D Secure formunu render et; otomatik bankaya yönlendirir.
      setRedirecting(true);
      renderHtml(html, containerRef.current);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.payment.formError);
      setSubmitting(false);
      setRedirecting(false);
    }
  }

  if (redirecting) {
    return (
      <div>
        <p className="text-sm text-slate-500">{t.payment.redirecting}</p>
        <div ref={containerRef} className="hidden" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block text-sm font-medium text-slate-700">
        {t.payment.cardHolder}
        <input
          value={holderName}
          onChange={(e) => setHolderName(e.target.value)}
          className="input mt-1"
          autoComplete="cc-name"
          placeholder="Ad Soyad"
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        {t.payment.cardNumber}
        <input
          value={number}
          onChange={(e) => setNumber(formatCardNumber(e.target.value))}
          className="input mt-1"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="0000 0000 0000 0000"
        />
      </label>

      <div className="grid grid-cols-3 gap-3">
        <label className="block text-sm font-medium text-slate-700">
          {t.payment.cardMonth}
          <select value={expiryMonth} onChange={(e) => setExpiryMonth(e.target.value)} className="input mt-1">
            <option value="">--</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t.payment.cardYear}
          <select value={expiryYear} onChange={(e) => setExpiryYear(e.target.value)} className="input mt-1">
            <option value="">--</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t.payment.cardCvv}
          <input
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
            className="input mt-1"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="000"
          />
        </label>
      </div>

      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-brand-blue px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-blue-dark disabled:opacity-60"
      >
        {submitting ? t.payment.formPreparing : t.payment.payNow}
      </button>

      <div ref={containerRef} className="hidden" />
    </form>
  );
}

function renderHtml(html: string, container: HTMLDivElement | null) {
  if (!container) return;
  container.innerHTML = "";
  const template = document.createElement("template");
  template.innerHTML = html;
  template.content.querySelectorAll("script").forEach((oldScript) => {
    const script = document.createElement("script");
    Array.from(oldScript.attributes).forEach((attr) => script.setAttribute(attr.name, attr.value));
    script.text = oldScript.textContent ?? "";
    template.content.replaceChild(script, oldScript);
  });
  container.appendChild(template.content);
  // Sipay HTML'i genelde otomatik submit olan bir <form> içerir; değilse ilk formu gönder.
  const form = container.querySelector("form");
  if (form) form.submit();
}
