import { ApiError, getReservation } from "@/lib/api";
import { PaymentSuccessClient } from "@/components/PaymentSuccessClient";

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const reservation = code
    ? await getReservation(code).catch((err) => {
        if (err instanceof ApiError) return null;
        throw err;
      })
    : null;

  return <PaymentSuccessClient reservation={reservation} />;
}
