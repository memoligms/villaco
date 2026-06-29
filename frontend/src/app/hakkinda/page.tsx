"use client";

import Image from "next/image";
import Link from "next/link";
import { useT } from "@/lib/i18n/LanguageContext";

export default function AboutPage() {
  const t = useT();

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[320px] w-full overflow-hidden sm:h-[400px]">
        <Image src="/villa/villa-01.jpg" alt="Yalıkavak Villa" fill priority className="object-cover" unoptimized />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/90 via-brand-navy/40 to-transparent" />
        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-6xl px-4 pb-10 text-white sm:px-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-200">{t.about.heroEyebrow}</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-5xl">{t.about.heroTitle}</h1>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="space-y-4 text-slate-600">
            <h2 className="text-2xl font-bold text-brand-navy sm:text-3xl">{t.about.introHeading}</h2>
            {t.about.introParagraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <div className="relative h-72 overflow-hidden rounded-2xl bg-slate-100 sm:h-96">
            <Image src="/villa/villa-08.jpg" alt={t.about.introHeading} fill className="object-cover" unoptimized />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {t.about.stats.map((stat) => (
            <div key={stat.label} className="card text-center">
              <p className="text-3xl font-bold text-brand-blue">{stat.value}</p>
              <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold text-brand-navy sm:text-3xl">{t.about.valuesHeading}</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-slate-500">{t.about.valuesSubheading}</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.about.values.map((value) => (
              <div key={value.title} className="card">
                <span className="text-3xl">{value.icon}</span>
                <p className="mt-3 font-semibold text-brand-navy">{value.title}</p>
                <p className="mt-1 text-sm text-slate-500">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <h2 className="text-2xl font-bold text-brand-navy sm:text-3xl">{t.about.ctaHeading}</h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-500">{t.about.ctaSubheading}</p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/villa-detaylari"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-8 py-3 text-sm font-semibold text-brand-navy transition hover:border-brand-blue hover:text-brand-blue"
          >
            {t.about.ctaVillaDetails}
          </Link>
          <Link
            href="/rezervasyon"
            className="inline-flex items-center justify-center rounded-full bg-brand-blue px-8 py-3 text-sm font-semibold text-white transition hover:bg-brand-blue-dark"
          >
            {t.about.ctaBookNow}
          </Link>
        </div>
      </section>
    </div>
  );
}
