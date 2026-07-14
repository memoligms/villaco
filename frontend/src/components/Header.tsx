"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useT } from "@/lib/i18n/LanguageContext";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header() {
  const t = useT();
  const [open, setOpen] = useState(false);

  const navLinks = [
    { href: "/villa-detaylari", label: t.header.villaDetails },
    { href: "/hakkinda", label: t.header.about },
    { href: "/konum-ulasim", label: t.header.location },
    { href: "/iletisim", label: t.header.contact },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center" aria-label="Yalıkavak Villa">
          <Image
            src="/brand-dark.png"
            alt="Yalıkavak Villa"
            width={760}
            height={124}
            priority
            className="h-7 w-auto sm:h-8"
          />
        </Link>

        {/* Masaüstü navigasyon */}
        <nav className="hidden items-center gap-6 whitespace-nowrap text-sm font-medium text-slate-600 lg:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-brand-blue">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            href="/rezervasyon"
            className="hidden whitespace-nowrap rounded-full bg-brand-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-blue sm:inline-block"
          >
            {t.header.bookNow}
          </Link>

          {/* Mobil menü tuşu (hamburger) */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menü"
            aria-expanded={open}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-brand-navy transition hover:bg-slate-100 lg:hidden"
          >
            {open ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobil açılır menü */}
      {open ? (
        <nav className="border-t border-slate-200 bg-white lg:hidden">
          <div className="mx-auto flex max-w-6xl flex-col px-4 py-2 sm:px-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-brand-blue"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/rezervasyon"
              onClick={() => setOpen(false)}
              className="mt-2 mb-2 rounded-full bg-brand-navy px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-blue"
            >
              {t.header.bookNow}
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
