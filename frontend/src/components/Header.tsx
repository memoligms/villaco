"use client";

import Image from "next/image";
import Link from "next/link";
import { useT } from "@/lib/i18n/LanguageContext";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header() {
  const t = useT();

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
        <nav className="hidden items-center gap-6 whitespace-nowrap text-sm font-medium text-slate-600 lg:flex">
          <Link href="/villa-detaylari" className="hover:text-brand-blue">
            {t.header.villaDetails}
          </Link>
          <Link href="/hakkinda" className="hover:text-brand-blue">
            {t.header.about}
          </Link>
          <Link href="/konum-ulasim" className="hover:text-brand-blue">
            {t.header.location}
          </Link>
          <Link href="/iletisim" className="hover:text-brand-blue">
            {t.header.contact}
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            href="/rezervasyon"
            className="whitespace-nowrap rounded-full bg-brand-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-blue"
          >
            {t.header.bookNow}
          </Link>
        </div>
      </div>
    </header>
  );
}
