"use client";

import { LegalPage } from "@/components/LegalPage";
import { useT } from "@/lib/i18n/LanguageContext";

export default function DistanceSalesAgreementPage() {
  const t = useT();
  return <LegalPage title={t.legal.distanceSales.title} blocks={t.legal.distanceSales.blocks} />;
}
