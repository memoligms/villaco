import type { Metadata } from "next";
import { VillaDetailsPageClient } from "@/components/VillaDetailsPageClient";

export const metadata: Metadata = {
  title: "Villa Detayları | Yalıkavak Villa",
  description:
    "Yalıkavak Villa'nın detaylı özellikleri: oda yapısı, olanaklar, konaklama kuralları, fotoğraf ve video galerisi.",
};

export default function VillaDetailsPage() {
  return <VillaDetailsPageClient />;
}
