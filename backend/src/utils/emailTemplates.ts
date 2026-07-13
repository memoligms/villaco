interface ApprovedReservationData {
  reservationCode: string;
  guestName: string;
  checkIn: Date;
  checkOut: Date;
  nightCount: number;
  guestCount: number;
  totalPrice: number;
  paymentStatus: string;
}

const PAYMENT_LABELS: Record<string, string> = {
  PENDING: "Ödeme bekleniyor",
  PAID: "Ödendi",
  FAILED: "Başarısız",
};

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10).split("-").reverse().join(".");
}

function fmtTry(v: number): string {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(v);
}

// Rezervasyon onaylandığında işletmeye gönderilen bildirim e-postası.
export function reservationApprovedEmail(data: ApprovedReservationData): {
  subject: string;
  html: string;
  text: string;
} {
  const payment = PAYMENT_LABELS[data.paymentStatus] ?? data.paymentStatus;
  const rows: [string, string][] = [
    ["Rezervasyon No", data.reservationCode],
    ["Misafir Adı", data.guestName],
    ["Giriş Tarihi", fmtDate(data.checkIn)],
    ["Çıkış Tarihi", fmtDate(data.checkOut)],
    ["Konaklama Süresi", `${data.nightCount} gece`],
    ["Misafir Sayısı", `${data.guestCount} kişi`],
    ["Toplam Ücret", fmtTry(data.totalPrice)],
    ["Ödeme Durumu", payment],
  ];

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1e293b">
    <div style="background:#0f2540;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
      <h2 style="margin:0;font-size:18px">Yeni Onaylanan Rezervasyon</h2>
      <p style="margin:6px 0 0;font-size:13px;color:#cbd5e1">Yalıkavak Villa</p>
    </div>
    <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e2e8f0;border-top:none">
      ${rows
        .map(
          ([k, v], i) => `
        <tr style="background:${i % 2 ? "#f8fafc" : "#fff"}">
          <td style="padding:12px 16px;font-size:13px;color:#64748b;border-bottom:1px solid #f1f5f9">${k}</td>
          <td style="padding:12px 16px;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #f1f5f9">${v}</td>
        </tr>`
        )
        .join("")}
    </table>
    <p style="font-size:12px;color:#94a3b8;margin:16px 0 0">Bu e-posta rezervasyon onaylandığında otomatik gönderilmiştir.</p>
  </div>`;

  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");

  return {
    subject: `Rezervasyon Onaylandı — ${data.reservationCode} (${data.guestName})`,
    html,
    text,
  };
}
