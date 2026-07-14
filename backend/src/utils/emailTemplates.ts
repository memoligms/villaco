import { env } from "../config/env";

const BRAND_NAVY = "#0f2540";
const BRAND_BLUE = "#2563eb";
const LOGO_URL = `${env.frontendBaseUrl}/brand-light.png`;
const SITE_URL = env.frontendBaseUrl;

const PAYMENT_LABELS: Record<string, string> = {
  PENDING: "Ödeme bekleniyor",
  PAID: "Ödendi",
  FAILED: "Başarısız",
};

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10).split("-").reverse().join(".");
}

function fmtDateTime(d: Date): string {
  const iso = new Date(d.getTime() + 3 * 3600 * 1000).toISOString(); // TR (UTC+3)
  return `${iso.slice(0, 10).split("-").reverse().join(".")} ${iso.slice(11, 16)}`;
}

function fmtTry(v: number): string {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(v);
}

// Kurumsal, mobil uyumlu HTML e-posta iskeleti (UTF-8 — Türkçe karakter güvenli).
function baseEmail(opts: {
  heading: string;
  accent?: string;
  intro?: string;
  rows?: [string, string][];
  button?: { url: string; label: string };
  footerNote?: string;
}): string {
  const accent = opts.accent ?? BRAND_NAVY;
  const rowsHtml = (opts.rows ?? [])
    .map(
      ([k, v], i) => `
        <tr style="background:${i % 2 ? "#f8fafc" : "#ffffff"}">
          <td style="padding:11px 16px;font-size:13px;color:#64748b;border-bottom:1px solid #eef2f7">${k}</td>
          <td style="padding:11px 16px;font-size:14px;font-weight:600;color:#0f172a;text-align:right;border-bottom:1px solid #eef2f7">${v}</td>
        </tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 4px rgba(15,37,64,.08)">
        <tr><td style="background:${accent};padding:22px 28px">
          <img src="${LOGO_URL}" alt="Yalıkavak Villa" height="26" style="height:26px;display:block;border:0" />
          <div style="color:#e2e8f0;font-size:12px;margin-top:6px;letter-spacing:.5px">Bodrum · Yalıkavak</div>
        </td></tr>
        <tr><td style="padding:26px 28px">
          <h1 style="margin:0 0 ${opts.intro ? "10" : "16"}px;font-size:20px;color:${accent}">${opts.heading}</h1>
          ${opts.intro ? `<p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#334155">${opts.intro}</p>` : ""}
          ${
            rowsHtml
              ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eef2f7;border-radius:10px;overflow:hidden;margin-bottom:${opts.button ? "20" : "4"}px">${rowsHtml}</table>`
              : ""
          }
          ${
            opts.button
              ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px auto"><tr><td style="border-radius:9999px;background:${BRAND_BLUE}">
                  <a href="${opts.button.url}" style="display:inline-block;padding:13px 30px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:9999px">${opts.button.label}</a>
                </td></tr></table>
                <p style="margin:14px 0 0;font-size:12px;color:#94a3b8;text-align:center;word-break:break-all">${opts.button.url}</p>`
              : ""
          }
          ${opts.footerNote ? `<p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#475569">${opts.footerNote}</p>` : ""}
        </td></tr>
        <tr><td style="padding:16px 28px;background:#f8fafc;border-top:1px solid #eef2f7">
          <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center">
            <a href="${SITE_URL}" style="color:#64748b;text-decoration:none">yalikavakvilla.com</a> · Bu e-posta otomatik gönderilmiştir.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function toText(heading: string, rows: [string, string][], extra?: string): string {
  return `${heading}\n\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}${extra ? `\n\n${extra}` : ""}`;
}

export interface ReservationEmailData {
  reservationCode: string;
  guestName: string;
  guestPhone?: string;
  guestEmail?: string;
  villaName: string;
  checkIn: Date;
  checkOut: Date;
  nightCount: number;
  guestCount: number;
  totalPrice: number;
  displayCurrency?: string;
  paymentStatus: string;
  createdAt?: Date;
}

type Mail = { subject: string; html: string; text: string };

const paymentUrl = (code: string) => `${env.frontendBaseUrl}/odeme/${code}`;

// 1) Yeni rezervasyon — YÖNETİCİ bildirimi
export function newReservationAdminEmail(d: ReservationEmailData): Mail {
  const rows: [string, string][] = [
    ["Rezervasyon No", d.reservationCode],
    ["Misafir", d.guestName],
    ["Telefon", d.guestPhone ?? "-"],
    ["E-posta", d.guestEmail ?? "-"],
    ["Giriş Tarihi", fmtDate(d.checkIn)],
    ["Çıkış Tarihi", fmtDate(d.checkOut)],
    ["Konaklama", `${d.nightCount} gece`],
    ["Kişi Sayısı", `${d.guestCount} kişi`],
    ["Toplam Tutar", fmtTry(d.totalPrice)],
    ["Görüntülenen Para Birimi", d.displayCurrency ?? "TRY"],
    ["Oluşturulma", d.createdAt ? fmtDateTime(d.createdAt) : fmtDateTime(new Date())],
    ["Durum", "Onay Bekliyor"],
  ];
  return {
    subject: `Yeni Rezervasyon Talebi — ${d.reservationCode} (${d.guestName})`,
    html: baseEmail({
      heading: "Yeni Rezervasyon Talebi",
      accent: BRAND_NAVY,
      intro: "Siteden yeni bir rezervasyon talebi alındı. Yönetim panelinden onaylayabilir veya reddedebilirsiniz.",
      rows,
      button: { url: `${env.frontendBaseUrl}/admin/rezervasyonlar`, label: "Yönetim Panelini Aç" },
    }),
    text: toText("Yeni Rezervasyon Talebi", rows),
  };
}

// 2) Onay — MİSAFİR
export function reservationApprovedCustomerEmail(d: ReservationEmailData): Mail {
  const rows: [string, string][] = [
    ["Rezervasyon No", d.reservationCode],
    ["Villa", d.villaName],
    ["Giriş Tarihi", fmtDate(d.checkIn)],
    ["Çıkış Tarihi", fmtDate(d.checkOut)],
    ["Konaklama", `${d.nightCount} gece`],
    ["Kişi Sayısı", `${d.guestCount} kişi`],
    ["Toplam Ödeme", fmtTry(d.totalPrice)],
  ];
  return {
    subject: `Rezervasyonunuz Onaylandı — Ödeme Linki (${d.reservationCode})`,
    html: baseEmail({
      heading: "Rezervasyonunuz Onaylandı 🎉",
      accent: BRAND_NAVY,
      intro: `Merhaba ${d.guestName}, rezervasyon talebiniz onaylanmıştır. Ödemenizi tamamlamak için lütfen aşağıdaki butondan güvenli ödeme sayfasına giriş yapınız.`,
      rows,
      button: { url: paymentUrl(d.reservationCode), label: "Ödemeyi Tamamla" },
    }),
    text: toText(
      "Rezervasyonunuz onaylandı.",
      rows,
      `Ödemenizi tamamlamak için: ${paymentUrl(d.reservationCode)}`
    ),
  };
}

// 3) Red — MİSAFİR
export function reservationRejectedCustomerEmail(d: ReservationEmailData): Mail {
  const rows: [string, string][] = [
    ["Rezervasyon No", d.reservationCode],
    ["Villa", d.villaName],
    ["Giriş Tarihi", fmtDate(d.checkIn)],
    ["Çıkış Tarihi", fmtDate(d.checkOut)],
  ];
  return {
    subject: `Rezervasyon Talebiniz Hakkında — ${d.reservationCode}`,
    html: baseEmail({
      heading: "Rezervasyon Talebiniz Onaylanmadı",
      accent: "#b91c1c",
      intro: `Merhaba ${d.guestName}, maalesef seçtiğiniz tarihler için rezervasyon talebiniz onaylanamamıştır. Farklı tarihler için bizimle iletişime geçebilir veya yeniden rezervasyon oluşturabilirsiniz.`,
      rows,
      button: { url: `${env.frontendBaseUrl}/iletisim`, label: "Bizimle İletişime Geçin" },
    }),
    text: toText("Rezervasyon talebiniz onaylanmadı.", rows),
  };
}

// 4) Ödeme başarılı — MİSAFİR
export function paymentSuccessCustomerEmail(d: ReservationEmailData): Mail {
  const rows: [string, string][] = [
    ["Rezervasyon No", d.reservationCode],
    ["Villa", d.villaName],
    ["Giriş Tarihi", fmtDate(d.checkIn)],
    ["Çıkış Tarihi", fmtDate(d.checkOut)],
    ["Konaklama", `${d.nightCount} gece`],
    ["Ödenen Tutar", fmtTry(d.totalPrice)],
  ];
  return {
    subject: `Ödemeniz Alındı — Rezervasyonunuz Kesinleşti (${d.reservationCode})`,
    html: baseEmail({
      heading: "Ödemeniz Başarıyla Alındı ✅",
      accent: "#15803d",
      intro: `Merhaba ${d.guestName}, ödemeniz başarıyla tamamlandı ve rezervasyonunuz kesinleşmiştir. Sizi ağırlamaktan mutluluk duyacağız!`,
      rows,
      footerNote: "Giriş saati en erken 14:00, çıkış saati en geç 10:00'dir. İyi tatiller dileriz.",
    }),
    text: toText("Ödemeniz alındı, rezervasyonunuz kesinleşti.", rows),
  };
}

// 4) Ödeme başarılı — YÖNETİCİ
export function paymentSuccessAdminEmail(d: ReservationEmailData): Mail {
  const rows: [string, string][] = [
    ["Rezervasyon No", d.reservationCode],
    ["Misafir", d.guestName],
    ["Telefon", d.guestPhone ?? "-"],
    ["Giriş Tarihi", fmtDate(d.checkIn)],
    ["Çıkış Tarihi", fmtDate(d.checkOut)],
    ["Ödenen Tutar", fmtTry(d.totalPrice)],
    ["Durum", "Ödendi / Kesinleşti"],
  ];
  return {
    subject: `Ödeme Alındı — ${d.reservationCode} (${d.guestName})`,
    html: baseEmail({
      heading: "Ödeme Alındı",
      accent: "#15803d",
      intro: "Bir rezervasyonun ödemesi başarıyla tamamlandı ve rezervasyon kesinleşti.",
      rows,
    }),
    text: toText("Ödeme alındı.", rows),
  };
}

// 5) Ödeme başarısız — MİSAFİR
export function paymentFailedCustomerEmail(d: ReservationEmailData): Mail {
  const rows: [string, string][] = [
    ["Rezervasyon No", d.reservationCode],
    ["Villa", d.villaName],
    ["Ödenecek Tutar", fmtTry(d.totalPrice)],
  ];
  return {
    subject: `Ödeme Tamamlanamadı — ${d.reservationCode}`,
    html: baseEmail({
      heading: "Ödemeniz Tamamlanamadı",
      accent: "#b45309",
      intro: `Merhaba ${d.guestName}, ödeme işleminiz tamamlanamadı. Rezervasyonunuz halen geçerli; aşağıdaki butondan tekrar deneyebilirsiniz.`,
      rows,
      button: { url: paymentUrl(d.reservationCode), label: "Tekrar Dene" },
    }),
    text: toText("Ödemeniz tamamlanamadı.", rows, `Tekrar deneyin: ${paymentUrl(d.reservationCode)}`),
  };
}

// 5) Ödeme başarısız — YÖNETİCİ
export function paymentFailedAdminEmail(d: ReservationEmailData): Mail {
  const rows: [string, string][] = [
    ["Rezervasyon No", d.reservationCode],
    ["Misafir", d.guestName],
    ["Telefon", d.guestPhone ?? "-"],
    ["Tutar", fmtTry(d.totalPrice)],
  ];
  return {
    subject: `Başarısız Ödeme — ${d.reservationCode} (${d.guestName})`,
    html: baseEmail({
      heading: "Başarısız Ödeme Denemesi",
      accent: "#b45309",
      intro: "Bir rezervasyon için ödeme denemesi başarısız oldu. Müşteri tekrar deneyebilir.",
      rows,
    }),
    text: toText("Başarısız ödeme denemesi.", rows),
  };
}

// 6) İptal — MİSAFİR / YÖNETİCİ
export function reservationCancelledEmail(d: ReservationEmailData, forAdmin: boolean): Mail {
  const rows: [string, string][] = [
    ["Rezervasyon No", d.reservationCode],
    ["Villa", d.villaName],
    ["Giriş Tarihi", fmtDate(d.checkIn)],
    ["Çıkış Tarihi", fmtDate(d.checkOut)],
    ...(forAdmin ? ([["Misafir", d.guestName]] as [string, string][]) : []),
  ];
  return {
    subject: `Rezervasyon İptal Edildi — ${d.reservationCode}`,
    html: baseEmail({
      heading: "Rezervasyon İptal Edildi",
      accent: "#b91c1c",
      intro: forAdmin
        ? "Bir rezervasyon iptal edildi."
        : `Merhaba ${d.guestName}, rezervasyonunuz iptal edilmiştir. Sorularınız için bizimle iletişime geçebilirsiniz.`,
      rows,
    }),
    text: toText("Rezervasyon iptal edildi.", rows),
  };
}

// Panelden test gönderimi
export function testEmail(): Mail {
  return {
    subject: "Test E-postası — Yalıkavak Villa",
    html: baseEmail({
      heading: "E-posta Sistemi Çalışıyor ✅",
      intro: "Bu bir test e-postasıdır. E-posta bildirim sisteminiz doğru şekilde yapılandırılmıştır.",
    }),
    text: "Bu bir test e-postasıdır. E-posta sistemi çalışıyor.",
  };
}
