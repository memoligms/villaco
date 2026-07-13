"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError, getReviews, submitReview, type Review } from "@/lib/api";
import { useLanguage, useT } from "@/lib/i18n/LanguageContext";

function Stars({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span className={`text-amber-400 ${className}`} aria-hidden>
      {"★★★★★".slice(0, value)}
      <span className="text-slate-300">{"★★★★★".slice(value)}</span>
    </span>
  );
}

export function ReviewsSection() {
  const t = useT();
  const { language } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({ name: "", email: "", rating: 0, comment: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    getReviews().then(setReviews).catch(() => setReviews([]));
  }, []);

  const average = useMemo(() => {
    if (reviews.length === 0) return "0.0";
    return (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
  }, [reviews]);

  const dateFmt = useMemo(
    () => new Intl.DateTimeFormat(language, { year: "numeric", month: "long" }),
    [language],
  );

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate() {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = t.reviews.validation.nameMin;
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = t.reviews.validation.emailInvalid;
    if (form.rating < 1) next.rating = t.reviews.validation.ratingRequired;
    if (form.comment.trim().length < 10) next.comment = t.reviews.validation.commentMin;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) return;

    setStatus("submitting");
    setErrorMessage(null);
    try {
      const res = await submitReview(form);
      setReviews((prev) => [res.review, ...prev]);
      setStatus("success");
      setForm({ name: "", email: "", rating: 0, comment: "" });
      setTimeout(() => {
        setOpen(false);
        setStatus("idle");
      }, 2500);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof ApiError ? err.message : t.reviews.notEligible);
    }
  }

  return (
    <section id="yorumlar" className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-brand-navy sm:text-3xl">{t.reviews.heading}</h2>
            <p className="mt-2 text-slate-500">{t.reviews.subtitle}</p>
            {reviews.length > 0 ? (
              <p className="mt-3 flex items-center gap-2 text-sm font-medium text-slate-600">
                <Stars value={Math.round(Number(average))} />
                {t.reviews.ratingSummary(average, reviews.length)}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="rounded-full bg-brand-blue px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-blue-dark"
          >
            {open ? t.reviews.cancel : t.reviews.writeCta}
          </button>
        </div>

        {open ? (
          <form onSubmit={handleSubmit} className="card mt-6">
            <h3 className="text-lg font-bold text-brand-navy">{t.reviews.formHeading}</h3>
            <p className="mt-1 text-sm text-slate-500">{t.reviews.formNote}</p>

            {status === "success" ? (
              <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                {t.reviews.successMessage}
              </div>
            ) : (
              <>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Field label={t.reviews.formName} error={errors.name}>
                    <input value={form.name} onChange={(e) => update("name", e.target.value)} className="input" />
                  </Field>
                  <Field label={t.reviews.formEmail} error={errors.email} hint={t.reviews.formEmailHint}>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      className="input"
                    />
                  </Field>
                </div>

                <div className="mt-3">
                  <span className="block text-sm font-medium text-slate-700">{t.reviews.formRating}</span>
                  <div className="mt-1 flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => update("rating", n)}
                        aria-label={`${n}`}
                        className={`text-3xl leading-none transition ${
                          n <= form.rating ? "text-amber-400" : "text-slate-300 hover:text-amber-300"
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  {errors.rating ? (
                    <span className="mt-1 block text-xs font-medium text-red-600">{errors.rating}</span>
                  ) : null}
                </div>

                <Field label={t.reviews.formComment} error={errors.comment}>
                  <textarea
                    rows={4}
                    value={form.comment}
                    onChange={(e) => update("comment", e.target.value)}
                    placeholder={t.reviews.formCommentPlaceholder}
                    className="input resize-none"
                  />
                </Field>

                {errorMessage ? (
                  <p className="mt-2 text-sm font-medium text-red-600">{errorMessage}</p>
                ) : null}

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="mt-4 w-full rounded-full bg-brand-navy px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-blue disabled:opacity-60"
                >
                  {status === "submitting" ? t.reviews.submitting : t.reviews.submitCta}
                </button>
              </>
            )}
          </form>
        ) : null}

        <div className="mt-8">
          {reviews.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
              {t.reviews.empty}
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r) => (
                <div key={r.id} className="card h-full">
                  <div className="flex items-center justify-between">
                    <Stars value={r.rating} />
                    <span className="text-xs text-slate-400">{dateFmt.format(new Date(r.createdAt))}</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{r.comment}</p>
                  <p className="mt-4 text-sm font-semibold text-brand-navy">{r.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <div className="mt-1">{children}</div>
      {hint && !error ? <span className="mt-1 block text-xs text-slate-400">{hint}</span> : null}
      {error ? <span className="mt-1 block text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
}
