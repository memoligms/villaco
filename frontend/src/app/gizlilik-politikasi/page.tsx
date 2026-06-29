"use client";

import { LegalPage } from "@/components/LegalPage";
import { useT } from "@/lib/i18n/LanguageContext";

export default function PrivacyPolicyPage() {
  const t = useT();
  return <LegalPage title={t.legal.privacy.title} blocks={t.legal.privacy.blocks} />;
}
