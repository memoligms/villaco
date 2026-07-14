"use client";

import Image from "next/image";
import Link from "next/link";
import { useT } from "@/lib/i18n/LanguageContext";
import { CardLogos } from "./CardLogos";
import { useSiteSettings } from "./SiteSettingsProvider";

export function Footer() {
  const t = useT();
  const { contactEmail, contactPhone } = useSiteSettings();

  return (
    <footer className="mt-16 border-t border-slate-200 bg-brand-navy text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
        <div>
          <Image
            src="/brand-light.png"
            alt="Yalıkavak Villa"
            width={760}
            height={124}
            className="h-7 w-auto"
          />
          <p className="mt-3 text-sm text-slate-400">{t.footer.tagline}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{t.footer.corporateTitle}</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li>
              <Link href="/hakkinda" className="hover:text-white">
                {t.footer.about}
              </Link>
            </li>
            <li>
              <Link href="/konum-ulasim" className="hover:text-white">
                {t.footer.location}
              </Link>
            </li>
            <li>
              <Link href="/kvkk" className="hover:text-white">
                {t.footer.kvkk}
              </Link>
            </li>
            <li>
              <Link href="/gizlilik-politikasi" className="hover:text-white">
                {t.footer.privacy}
              </Link>
            </li>
            <li>
              <Link href="/mesafeli-satis-sozlesmesi" className="hover:text-white">
                {t.footer.distanceSales}
              </Link>
            </li>
            <li>
              <Link href="/iptal-iade" className="hover:text-white">
                {t.footer.cancellation}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{t.footer.contactTitle}</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li>
              <a href={`mailto:${contactEmail}`} className="hover:text-white">
                {contactEmail}
              </a>
            </li>
            <li>
              <a href={`tel:${contactPhone.replace(/\s+/g, "")}`} className="hover:text-white">
                {contactPhone}
              </a>
            </li>
            <li>
              <a
                href={`https://wa.me/${contactPhone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-green-400 hover:text-green-300"
              >
                <span aria-hidden>💬</span> WhatsApp
              </a>
            </li>
          </ul>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t.footer.securePayment}
          </p>
          <CardLogos className="mt-2" />
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-3 border-t border-white/10 py-4 text-center text-xs text-slate-500 sm:flex-row sm:gap-6">
        <span>
          © {new Date().getFullYear()} Yalıkavak Villa. {t.footer.copyright}
        </span>
        <a
          href="https://ceemedya.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 opacity-70 transition hover:opacity-100"
        >
          <span>{t.footer.designBy}</span>
          <Image src="/ceemedya-logo.png" alt="Cee Medya" width={174} height={120} className="h-6 w-auto" />
        </a>
        <Link href="/admin/login" className="text-slate-500 transition hover:text-slate-300">
          {t.footer.adminLink}
        </Link>
      </div>
    </footer>
  );
}
