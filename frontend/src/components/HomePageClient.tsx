"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Villa } from "@/lib/types";
import { getVilla } from "@/lib/api";
import { useLanguage, useT } from "@/lib/i18n/LanguageContext";
import { useFormatPrice } from "@/lib/i18n/CurrencyContext";
import { BookingSearchWidget } from "@/components/BookingSearchWidget";
import { TrustBadges } from "@/components/TrustBadges";
import { HeroSlideshow } from "@/components/HeroSlideshow";
import { ReviewsSection } from "@/components/ReviewsSection";

export function HomePageClient() {
  const t = useT();
  const { language } = useLanguage();
  const formatPrice = useFormatPrice();
  const [villa, setVilla] = useState<Villa | null>(null);

  useEffect(() => {
    getVilla(language)
      .then(setVilla)
      .catch(() => setVilla(null));
  }, [language]);

  return (
    <div>
      <section className="relative">
        <div className="relative h-[480px] w-full overflow-hidden sm:h-[560px]">
          <HeroSlideshow alt={villa?.name ?? "Yalıkavak Villa"} />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/90 via-brand-navy/40 to-transparent" />
        </div>

        <div className="absolute inset-0 flex flex-col items-start justify-end px-4 pb-28 text-white sm:px-6 sm:pb-32">
          <div className="mx-auto w-full max-w-6xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-200">{t.home.badge}</p>
            <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight sm:text-5xl">{t.home.title}</h1>
            <p className="mt-4 max-w-xl text-blue-100">{t.home.subtitle}</p>
            <Link
              href="/rezervasyon"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-navy transition hover:bg-blue-50 sm:hidden"
            >
              {t.home.heroCtaMobile}
            </Link>
          </div>
        </div>

        <div className="relative z-10 mx-auto -mt-16 hidden max-w-6xl px-4 sm:-mt-12 sm:block sm:px-6">
          <BookingSearchWidget />
        </div>
      </section>

      <div className="mx-auto block max-w-6xl px-4 pt-6 sm:hidden sm:px-6">
        <BookingSearchWidget />
      </div>

      {villa ? (
        <section id="villa-detay" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-blue">{villa.location}</p>
              <h2 className="mt-1 text-2xl font-bold text-brand-navy sm:text-3xl">{villa.name}</h2>
              <p className="mt-4 leading-relaxed text-slate-600">{villa.description}</p>

              <h3 className="mt-8 text-lg font-bold text-brand-navy">{t.home.villaFeatures}</h3>
              <ul className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-600">
                {villa.amenities.map((amenity) => (
                  <li key={amenity} className="flex items-center gap-2">
                    <span className="text-brand-blue">✓</span>
                    {amenity}
                  </li>
                ))}
              </ul>

              {villa.images.length > 1 ? (
                <>
                  <h3 className="mt-8 text-lg font-bold text-brand-navy">{t.home.gallery}</h3>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {villa.images.slice(1).map((image) => (
                      <div key={image} className="relative h-36 overflow-hidden rounded-xl bg-slate-100">
                        <Image src={image} alt={villa.name} fill className="object-cover" unoptimized />
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            <div className="card sticky top-24 h-fit">
              <p className="text-xs uppercase tracking-wide text-slate-400">{t.home.priceCardLabel}</p>
              <p className="mt-1 text-2xl font-bold text-brand-navy">{formatPrice(villa.baseNightlyPrice)}</p>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <Row label={t.home.maxGuestLabel} value={`${villa.maxGuest} ${t.common.guestsSuffix}`} />
                {Number(villa.cleaningFee) > 0 ? (
                  <Row label={t.home.cleaningFeeLabel} value={formatPrice(villa.cleaningFee)} />
                ) : null}
                {Number(villa.depositFee) > 0 ? (
                  <Row label={t.home.depositLabel} value={formatPrice(villa.depositFee)} />
                ) : null}
              </div>
              <Link
                href="/rezervasyon"
                className="mt-6 block w-full rounded-full bg-brand-blue px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-blue-dark"
              >
                {t.home.bookNow}
              </Link>
              <Link
                href="/villa-detaylari"
                className="mt-3 block w-full rounded-full border border-slate-300 px-6 py-3 text-center text-sm font-semibold text-brand-navy transition hover:border-brand-blue hover:text-brand-blue"
              >
                {t.home.viewAllDetails}
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <p className="mx-auto max-w-6xl px-4 py-16 text-center text-slate-500 sm:px-6">{t.home.noVillaError}</p>
      )}

      <TrustBadges />

      <ReviewsSection />

      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <h2 className="text-2xl font-bold text-brand-navy sm:text-3xl">{t.home.ctaTitle}</h2>
        <p className="mt-2 text-slate-500">{t.home.ctaSubtitle}</p>
        <Link
          href="/rezervasyon"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-brand-navy px-8 py-3 text-sm font-semibold text-white transition hover:bg-brand-blue"
        >
          {t.home.ctaButton}
        </Link>
      </section>
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
