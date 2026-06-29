"use client";

import { useState } from "react";
import { ApiError, submitContact } from "@/lib/api";
import { useT } from "@/lib/i18n/LanguageContext";

export function ContactForm() {
  const t = useT();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate() {
    const next: Record<string, string> = {};
    if (form.fullName.trim().length < 2) next.fullName = t.contact.validation.nameMin;
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = t.contact.validation.emailInvalid;
    if (!/^\+?[0-9 ]{10,15}$/.test(form.phone.trim())) next.phone = t.contact.validation.phoneInvalid;
    if (form.message.trim().length < 5) next.message = t.contact.validation.messageMin;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) return;

    setStatus("submitting");
    setErrorMessage(null);
    try {
      await submitContact(form);
      setStatus("success");
      setForm({ fullName: "", email: "", phone: "", message: "" });
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof ApiError ? err.message : t.contact.submitError);
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-sm text-green-700">
        {t.contact.successMessage}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <Field label={t.contact.formName} error={errors.fullName}>
        <input value={form.fullName} onChange={(e) => update("fullName", e.target.value)} className="input" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t.contact.formEmail} error={errors.email}>
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="input" />
        </Field>
        <Field label={t.contact.formPhone} error={errors.phone}>
          <input
            type="tel"
            placeholder="+90 5xx xxx xx xx"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className="input"
          />
        </Field>
      </div>
      <Field label={t.contact.formMessage} error={errors.message}>
        <textarea rows={4} value={form.message} onChange={(e) => update("message", e.target.value)} className="input resize-none" />
      </Field>

      {errorMessage ? <p className="mt-2 text-sm font-medium text-red-600">{errorMessage}</p> : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-4 w-full rounded-full bg-brand-blue px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-blue-dark disabled:opacity-60"
      >
        {status === "submitting" ? t.contact.submitting : t.contact.submitCta}
      </button>
    </form>
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
