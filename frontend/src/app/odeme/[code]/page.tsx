import { notFound } from "next/navigation";
import { ApiError, getReservation } from "@/lib/api";
import { PaymentPageClient } from "@/components/PaymentPageClient";

export default async function PaymentPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const reservation = await getReservation(code).catch((err) => {
    if (err instanceof ApiError) return null;
    throw err;
  });

  if (!reservation) {
    notFound();
  }

  return <PaymentPageClient reservation={reservation} />;
}
