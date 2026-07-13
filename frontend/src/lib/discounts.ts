// Rezervasyon sayfasındaki "Sipariş Özeti" için indirim önizlemesi.
// Backend'deki computeDiscounts mantığını birebir yansıtır; nihai/kesin tutar
// rezervasyon oluşturulurken backend tarafında hesaplanır.

export interface ActivePromotion {
  type: "MOBILE" | "WELCOME" | "LAST_MINUTE" | "DATE_RANGE" | "WEEKLY" | "MONTHLY" | string;
  label: string;
  percentage: number;
  daysBefore: number | null;
  minNights: number | null;
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
  nightCount: number,
  isMobile: boolean
): DiscountPreview {
  const empty: DiscountPreview = { discounts: [], discountTotal: 0, finalTotal: grandTotal };
  if (!data || grandTotal <= 0 || !checkIn) return empty;

  const now = new Date();
  const nowMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const ci = new Date(`${checkIn}T00:00:00.000Z`);
  const daysUntil = Math.round((ci.getTime() - nowMidnight) / (1000 * 60 * 60 * 24));

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
        // Girişten en az daysBefore gün önce yapılan rezervasyonlar (erken rezervasyon).
        ok = p.daysBefore != null && daysUntil >= p.daysBefore;
        break;
      case "DATE_RANGE":
        ok = p.startDate != null && p.endDate != null && checkIn >= p.startDate && checkIn <= p.endDate;
        break;
      case "WEEKLY":
      case "MONTHLY":
        ok = p.minNights != null && nightCount >= p.minNights;
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

  // Haftalık/aylık birbirini dışlar: en yüksek yüzdeli olan uygulanır.
  const durationTypes = ["WEEKLY", "MONTHLY"];
  const durations = applied.filter((a) => durationTypes.includes(a.type));
  if (durations.length > 1) {
    const best = durations.reduce((a, b) => (b.percentage > a.percentage ? b : a));
    for (let i = applied.length - 1; i >= 0; i--) {
      if (durationTypes.includes(applied[i].type) && applied[i] !== best) applied.splice(i, 1);
    }
  }

  const raw = round2(applied.reduce((s, a) => s + a.amount, 0));
  const discountTotal = Math.min(raw, grandTotal);
  return { discounts: applied, discountTotal, finalTotal: round2(grandTotal - discountTotal) };
}
