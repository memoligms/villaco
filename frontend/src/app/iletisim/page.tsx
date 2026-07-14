"use client";

import { ContactForm } from "@/components/ContactForm";
import { useT } from "@/lib/i18n/LanguageContext";
import { useSiteSettings } from "@/components/SiteSettingsProvider";

export default function ContactPage() {
  const t = useT();
  const { contactEmail, contactPhone } = useSiteSettings();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-brand-navy">{t.contact.heading}</h1>
      <p className="mt-4 text-slate-600">{t.contact.intro}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold text-brand-navy">{t.contact.emailLabel}</p>
          <a href={`mailto:${contactEmail}`} className="mt-1 block text-slate-600 hover:text-brand-blue">
            {contactEmail}
          </a>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold text-brand-navy">{t.contact.phoneLabel}</p>
          <a
            href={`tel:${contactPhone.replace(/\s+/g, "")}`}
            className="mt-1 block text-slate-600 hover:text-brand-blue"
          >
            {contactPhone}
          </a>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold text-brand-navy">WhatsApp</p>
          <a
            href={`https://wa.me/${contactPhone.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1.5 text-green-600 hover:text-green-700"
          >
            <span aria-hidden>💬</span> Mesaj Gönder
          </a>
        </div>
      </div>

      <div className="mt-8">
        <ContactForm />
      </div>
    </div>
  );
}
