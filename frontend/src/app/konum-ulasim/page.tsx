"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/LanguageContext";

const MAP_QUERY = encodeURIComponent("Yalıkavak Sitesi, Geriş Caddesi, Yalıkavak, Bodrum");

// Yalıkavak / Geriş yaklaşık koordinatları (anahtarsız OpenStreetMap embed)
const MAP_LAT = 37.0968;
const MAP_LON = 27.2772;
const MAP_BBOX = "27.244,37.078,27.311,37.116";
const OSM_EMBED = `https://www.openstreetmap.org/export/embed.html?bbox=${MAP_BBOX}&layer=mapnik&marker=${MAP_LAT},${MAP_LON}`;

export default function LocationPage() {
  const t = useT();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-blue">{t.location.eyebrow}</p>
        <h1 className="mt-3 text-3xl font-bold text-brand-navy sm:text-4xl">{t.location.title}</h1>
        <p className="mt-4 text-slate-600">{t.location.intro}</p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        {/* Harita */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
            <iframe
              title={t.location.mapTitle}
              src={OSM_EMBED}
              className="h-[420px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        {/* Adres kartı */}
        <div className="card h-fit">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">{t.location.addressLabel}</p>
          <p className="mt-2 leading-relaxed text-brand-navy">{t.location.addressValue}</p>

          <div className="mt-5 space-y-2 border-t border-slate-100 pt-5 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <span className="text-brand-blue">📍</span>
              <span>Yalıkavak, Bodrum / Muğla</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-brand-blue">📞</span>
              <span>{t.location.phoneLine}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-brand-blue">✉️</span>
              <span>{t.location.emailLine}</span>
            </div>
          </div>

          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${MAP_QUERY}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 block w-full rounded-full bg-brand-blue px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-blue-dark"
          >
            {t.location.directionsCta}
          </a>
        </div>
      </div>

      {/* Mesafeler */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold text-brand-navy sm:text-3xl">{t.location.distancesHeading}</h2>
        <p className="mt-2 text-slate-500">{t.location.distancesSubheading}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {t.location.distances.map((item) => (
            <div key={item.title} className="card">
              <div className="flex items-start justify-between">
                <span className="text-2xl">{item.icon}</span>
                <div className="text-right">
                  <p className="text-lg font-bold text-brand-navy">{item.distance}</p>
                  <p className="text-xs font-medium text-brand-blue">{item.duration}</p>
                </div>
              </div>
              <p className="mt-4 font-semibold text-brand-navy">{item.title}</p>
              <p className="mt-1 text-sm text-slate-500">{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Ulaşım ipuçları */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold text-brand-navy sm:text-3xl">{t.location.tipsHeading}</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {t.location.tips.map((tip) => (
            <div key={tip.title} className="card">
              <p className="font-semibold text-brand-navy">{tip.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{tip.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-16 rounded-2xl bg-brand-navy px-6 py-12 text-center text-white">
        <h2 className="text-2xl font-bold sm:text-3xl">{t.location.ctaHeading}</h2>
        <p className="mx-auto mt-3 max-w-xl text-blue-100">{t.location.ctaSubheading}</p>
        <Link
          href="/rezervasyon"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-brand-navy transition hover:bg-blue-50"
        >
          {t.location.ctaButton}
        </Link>
      </section>
    </div>
  );
}
