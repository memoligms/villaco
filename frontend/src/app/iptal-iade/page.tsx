"use client";

import { LegalPage } from "@/components/LegalPage";
import { useT } from "@/lib/i18n/LanguageContext";

export default function CancellationPolicyPage() {
  const t = useT();
  return <LegalPage title={t.legal.cancellation.title} blocks={t.legal.cancellation.blocks} />;
}
