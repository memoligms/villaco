import type { Promotion } from "@prisma/client";

export interface AppliedDiscount {
  type: string;
  label: string;
  percentage: number;
  amount: number;
}

export interface DiscountResult {
  discounts: AppliedDiscount[];
  discountTotal: number;
  finalTotal: number;
  percentageTotal: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// Basit User-Agent tabanlı mobil tespiti.
export function isMobileUserAgent(ua?: string | null): boolean {
  if (!ua) return false;
  return /Mobi|Android|iPhone|iPod|Windows Phone|BlackBerry|Opera Mini|IEMobile/i.test(ua);
}

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Aktif kampanyaları verilen rezervasyon bağlamına göre değerlendirir ve toplam
// indirimi hesaplar. İndirimler toplanarak uygulanır (kullanıcı tercihi); toplam
// indirim güvenlik amacıyla genel toplamı aşamaz.
export function computeDiscounts(params: {
  promotions: Promotion[];
  grandTotal: number;
  checkIn: Date;
  nightCount: number;
  isMobile: boolean;
  confirmedReservationCount: number;
  now?: Date;
}): DiscountResult {
  const { promotions, grandTotal, checkIn, nightCount, isMobile, confirmedReservationCount } = params;
  const now = params.now ?? new Date();
  const dayMs = 1000 * 60 * 60 * 24;
  // Takvim günü farkı (bugünün ve girişin UTC gece yarısı üzerinden).
  const nowMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const daysUntilCheckIn = Math.round((checkIn.getTime() - nowMidnight) / dayMs);
  const checkInDate = dateStr(checkIn);

  const applied: AppliedDiscount[] = [];

  for (const p of promotions) {
    if (!p.isActive || p.percentage <= 0) continue;
    let ok = false;
    switch (p.type) {
      case "MOBILE":
        ok = isMobile;
        break;
      case "WELCOME":
        ok = p.maxRedemptions != null && confirmedReservationCount < p.maxRedemptions;
        break;
      case "LAST_MINUTE":
        // Girişten en az daysBefore gün önce yapılan rezervasyonlar (erken rezervasyon).
        ok = p.daysBefore != null && daysUntilCheckIn >= p.daysBefore;
        break;
      case "DATE_RANGE":
        ok =
          p.startDate != null &&
          p.endDate != null &&
          checkInDate >= dateStr(p.startDate) &&
          checkInDate <= dateStr(p.endDate);
        break;
      case "WEEKLY":
      case "MONTHLY":
        // Haftalık/aylık: en az minNights gecelik konaklama.
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

  // Süreye bağlı indirimler (haftalık/aylık) birbirini dışlar: yalnızca en yüksek
  // yüzdeli olan uygulanır (ör. 30 gecede aylık %20, haftalık %10 değil).
  const durationTypes = ["WEEKLY", "MONTHLY"];
  const durationDiscounts = applied.filter((a) => durationTypes.includes(a.type));
  if (durationDiscounts.length > 1) {
    const best = durationDiscounts.reduce((a, b) => (b.percentage > a.percentage ? b : a));
    for (let i = applied.length - 1; i >= 0; i--) {
      if (durationTypes.includes(applied[i].type) && applied[i] !== best) applied.splice(i, 1);
    }
  }

  const rawTotal = round2(applied.reduce((sum, a) => sum + a.amount, 0));
  const discountTotal = Math.min(rawTotal, grandTotal);
  const percentageTotal = applied.reduce((sum, a) => sum + a.percentage, 0);
  const finalTotal = round2(grandTotal - discountTotal);

  return { discounts: applied, discountTotal, finalTotal, percentageTotal };
}
