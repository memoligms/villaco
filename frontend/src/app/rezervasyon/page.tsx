import { Suspense } from "react";
import { ReservationPageClient } from "@/components/ReservationPageClient";

export default function ReservationPage() {
  return (
    <Suspense>
      <ReservationPageClient />
    </Suspense>
  );
}
