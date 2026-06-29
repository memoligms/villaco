"use client";

import { LegalPage } from "@/components/LegalPage";
import { useT } from "@/lib/i18n/LanguageContext";

export default function KvkkPage() {
  const t = useT();
  return <LegalPage title={t.legal.kvkk.title} blocks={t.legal.kvkk.blocks} />;
}
