export interface ExtraServiceSelection {
  unitPrice: number;
  quantity: number;
}

export interface PriceBreakdown {
  nightCount: number;
  nightlyPrice: number;
  nightsTotal: number;
  cleaningFee: number;
  depositFee: number;
  extrasTotal: number;
  totalPrice: number;
}

export function calculateNightCount(checkIn: Date, checkOut: Date): number {
  const msPerNight = 1000 * 60 * 60 * 24;
  return Math.round((checkOut.getTime() - checkIn.getTime()) / msPerNight);
}

export function calculatePrice(params: {
  checkIn: Date;
  checkOut: Date;
  nightlyPrice: number;
  cleaningFee: number;
  depositFee: number;
  extras?: ExtraServiceSelection[];
}): PriceBreakdown {
  const nightCount = calculateNightCount(params.checkIn, params.checkOut);
  const nightsTotal = round2(nightCount * params.nightlyPrice);
  const extrasTotal = round2((params.extras ?? []).reduce((sum, e) => sum + e.unitPrice * e.quantity, 0));
  const totalPrice = round2(nightsTotal + params.cleaningFee + params.depositFee + extrasTotal);

  return {
    nightCount,
    nightlyPrice: params.nightlyPrice,
    nightsTotal,
    cleaningFee: params.cleaningFee,
    depositFee: params.depositFee,
    extrasTotal,
    totalPrice,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
