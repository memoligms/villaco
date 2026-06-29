import type { Metadata } from "next";
import { VillaDetailsPageClient } from "@/components/VillaDetailsPageClient";

export const metadata: Metadata = {
  title: "Villa Details | Yalıkavak Villa",
  description: "Detailed features of Yalıkavak Villa: room layout, amenities, house rules and photo gallery.",
};

export default function VillaDetailsPage() {
  return <VillaDetailsPageClient />;
}
