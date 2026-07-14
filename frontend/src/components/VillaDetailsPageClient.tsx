"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Villa } from "@/lib/types";
import { getVilla } from "@/lib/api";
import { useLanguage, useT } from "@/lib/i18n/LanguageContext";
import { useFormatPrice } from "@/lib/i18n/CurrencyContext";
import { VillaGallery } from "@/components/VillaGallery";
import { VideoGallery } from "@/components/VideoGallery";

export function VillaDetailsPageClient() {
  const t = useT();
  const { language } = useLanguage();
  const formatPrice = useFormatPrice();
  const [villa, setVilla] = useState<Villa | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getVilla(language)
      .then(setVilla)
      .catch(() => setVilla(null))
      .finally(() => setLoaded(true));
  }, [language]);

  if (!loaded) {
    return <p className="mx-auto max-w-6xl px-4 py-24 text-center text-slate-400 sm:px-6">{t.common.loading}</p>;
  }

  if (!villa) {
    return (
      <p className="mx-auto max-w-6xl px-4 py-24 text-center text-slate-500 sm:px-6">{t.villaDetails.errorLoad}</p>
    );
  }

  const overview = villa.description;
  const addressLine = villa.address;
  const heroImage = villa.images[0];

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[360px] w-full overflow-hidden sm:h-[440px]">
        {heroImage ? (
          <Image src={heroImage} alt={villa.name} fill priority className="object-cover" unoptimized />
        ) : (
          <div className="h-full w-full bg-brand-navy" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/90 via-brand-navy/40 to-transparent" />
        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-6xl px-4 pb-10 text-white sm:px-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-200">{villa.location}</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-5xl">{villa.name}</h1>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="space-y-12 lg:col-span-2">
            {/* Genel Bakış */}
            <section>
              <h2 className="text-2xl font-bold text-brand-navy">{t.villaDetails.overviewHeading}</h2>
              <p className="mt-4 leading-relaxed text-slate-600">{overview}</p>
              {addressLine ? (
                <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  <span className="font-semibold text-brand-navy">{t.villaDetails.addressLabel}</span>{" "}
                  {addressLine.trim()}
                </p>
              ) : null}
            </section>

            {/* Oda & Yerleşim */}
            <section>
              <h2 className="text-2xl font-bold text-brand-navy">{t.villaDetails.layoutHeading}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {t.villaDetails.layoutDetails.map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-400">{item.label}</p>
                    <p className="mt-1 font-semibold text-brand-navy">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Olanaklar */}
            <section>
              <h2 className="text-2xl font-bold text-brand-navy">{t.villaDetails.amenitiesHeading}</h2>
              <ul className="mt-4 grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-2">
                {villa.amenities.map((amenity) => (
                  <li key={amenity} className="flex items-start gap-2">
                    <span className="mt-0.5 text-brand-blue">✓</span>
                    {amenity}
                  </li>
                ))}
              </ul>
            </section>

            {/* Galeri */}
            <section>
              <h2 className="text-2xl font-bold text-brand-navy">{t.villaDetails.galleryHeading}</h2>
              <p className="mt-1 text-sm text-slate-500">{t.villaDetails.galleryHint}</p>
              <div className="mt-4">
                <VillaGallery images={villa.images} alt={villa.name} />
              </div>
              {villa.videos && villa.videos.length > 0 ? (
                <VideoGallery videos={villa.videos} title={t.villaDetails.videosHeading} />
              ) : null}
            </section>
          </div>

          {/* Fiyat / rezervasyon */}
          <aside>
            <div className="card sticky top-24 h-fit">
              <p className="text-xs uppercase tracking-wide text-slate-400">{t.villaDetails.priceCardNightly}</p>
              <p className="mt-1 text-2xl font-bold text-brand-navy">{formatPrice(villa.baseNightlyPrice)}</p>
              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
                <Row label={t.villaDetails.maxGuestLabel} value={`${villa.maxGuest} ${t.common.guestsSuffix}`} />
                {Number(villa.cleaningFee) > 0 ? (
                  <Row label={t.villaDetails.cleaningFeeLabel} value={formatPrice(villa.cleaningFee)} />
                ) : null}
                {Number(villa.depositFee) > 0 ? (
                  <Row label={t.villaDetails.depositLabel} value={formatPrice(villa.depositFee)} />
                ) : null}
              </div>
              <Link
                href="/rezervasyon"
                className="mt-6 block w-full rounded-full bg-brand-blue px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-blue-dark"
              >
                {t.villaDetails.bookNow}
              </Link>
              <Link
                href="/konum-ulasim"
                className="mt-3 block w-full rounded-full border border-slate-300 px-6 py-3 text-center text-sm font-semibold text-brand-navy transition hover:border-brand-blue hover:text-brand-blue"
              >
                {t.villaDetails.locationLink}
              </Link>
            </div>
          </aside>
        </div>
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
