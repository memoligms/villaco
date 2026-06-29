"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useT } from "@/lib/i18n/LanguageContext";

function PaymentFailedContent() {
  const t = useT();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl text-red-600">
        ✕
      </div>
      <h1 className="mt-6 text-2xl font-bold text-brand-navy">{t.paymentFailed.heading}</h1>
      <p className="mt-3 text-slate-600">{t.paymentFailed.message}</p>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        {code ? (
          <Link
            href={`/odeme/${code}`}
            className="inline-flex items-center justify-center rounded-full bg-brand-blue px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-blue-dark"
          >
            {t.paymentFailed.retryCta}
          </Link>
        ) : (
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-brand-blue px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-blue-dark"
          >
            {t.paymentFailed.backHome}
          </Link>
        )}
        <Link
          href="/iletisim"
          className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-brand-navy transition hover:border-brand-blue hover:text-brand-blue"
        >
          {t.paymentFailed.contactCta}
        </Link>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense>
      <PaymentFailedContent />
    </Suspense>
  );
}
