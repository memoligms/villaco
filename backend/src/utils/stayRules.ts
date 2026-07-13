import type { StayRule } from "@prisma/client";

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Verilen giriş tarihi için geçerli minimum gece sayısını hesaplar.
// Birden fazla kural uyarsa en yüksek (en kısıtlayıcı) değeri seçer; hiçbiri
// uymazsa varsayılan minimuma düşer.
export function resolveMinNights(
  stayRules: Pick<StayRule, "minNights" | "startDate" | "endDate">[],
  checkIn: Date,
  defaultMinNights: number
): number {
  const ci = dateStr(checkIn);
  let min = 0;
  for (const r of stayRules) {
    if (ci >= dateStr(r.startDate) && ci <= dateStr(r.endDate)) {
      if (r.minNights > min) min = r.minNights;
    }
  }
  return min > 0 ? min : defaultMinNights;
}
