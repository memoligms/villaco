// Rezervasyon sayfasındaki "Sipariş Özeti" için indirim önizlemesi.
// Backend'deki computeDiscounts mantığını birebir yansıtır; nihai/kesin tutar
// rezervasyon oluşturulurken backend tarafında hesaplanır.

export interface ActivePromotion {
  type: "MOBILE" | "WELCOME" | "LAST_MINUTE" | "DATE_RANGE" | string;
  label: string;
  percentage: number;
  daysBefore: number | null;
  startDate: string | null;
  endDate: string | null;
}

export interface ActivePromotions {
  welcomeEligible: boolean;
  promotions: ActivePromotion[];
}

export interface PreviewDiscount {
  type: string;
  label: string;
  percentage: number;
  amount: number;
}

export interface DiscountPreview {
  discounts: PreviewDiscount[];
  discountTotal: number;
  finalTotal: number;
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mobi|Android|iPhone|iPod|Windows Phone|BlackBerry|Opera Mini|IEMobile/i.test(navigator.userAgent);
}

export function computeDiscountPreview(
  data: ActivePromotions | null,
  grandTotal: number,
  checkIn: string,
  isMobile: boolean
): DiscountPreview {
  const empty: DiscountPreview = { discounts: [], discountTotal: 0, finalTotal: grandTotal };
  if (!data || grandTotal <= 0 || !checkIn) return empty;

  const now = new Date();
  const ci = new Date(`${checkIn}T00:00:00.000Z`);
  const daysUntil = Math.floor((ci.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const applied: PreviewDiscount[] = [];
  for (const p of data.promotions) {
    if (p.percentage <= 0) continue;
    let ok = false;
    switch (p.type) {
      case "MOBILE":
        ok = isMobile;
        break;
      case "WELCOME":
        ok = data.welcomeEligible;
        break;
      case "LAST_MINUTE":
        ok = p.daysBefore != null && daysUntil >= 0 && daysUntil <= p.daysBefore;
        break;
      case "DATE_RANGE":
        ok = p.startDate != null && p.endDate != null && checkIn >= p.startDate && checkIn <= p.endDate;
        break;
    }
    if (ok) {
      applied.push({
        type: p.type,
        label: p.label,
        percentage: p.percentage,
        amount: round2((grandTotal * p.percentage) / 100),
      });
    }
  }

  const raw = round2(applied.reduce((s, a) => s + a.amount, 0));
  const discountTotal = Math.min(raw, grandTotal);
  return { discounts: applied, discountTotal, finalTotal: round2(grandTotal - discountTotal) };
}
