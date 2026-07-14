import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env";
import { prisma } from "../config/prisma";

let transporter: Transporter | null = null;

export function isMailConfigured(): boolean {
  return Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);
}

function getTransporter(): Transporter | null {
  if (!isMailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }
  return transporter;
}

export interface EmailSettingsShape {
  senderName: string;
  fromEmail: string;
  adminEmails: string;
  notifyNewReservation: boolean;
  notifyApproved: boolean;
  notifyRejected: boolean;
  notifyPaymentSuccess: boolean;
  notifyPaymentFailed: boolean;
  notifyCancelled: boolean;
}

const DEFAULT_SETTINGS: EmailSettingsShape = {
  senderName: "Yalıkavak Villa",
  fromEmail: env.smtp.from || env.smtp.user || "yalikavakvillacom@gmail.com",
  adminEmails: "yalikavakvillacom@gmail.com",
  notifyNewReservation: true,
  notifyApproved: true,
  notifyRejected: true,
  notifyPaymentSuccess: true,
  notifyPaymentFailed: true,
  notifyCancelled: true,
};

let cache: { at: number; value: EmailSettingsShape } | null = null;
const CACHE_TTL = 30 * 1000;

export async function getEmailSettings(): Promise<EmailSettingsShape> {
  if (cache && Date.now() - cache.at < CACHE_TTL) return cache.value;
  try {
    const row = await prisma.emailSetting.findUnique({ where: { id: 1 } });
    const value: EmailSettingsShape = row
      ? {
          senderName: row.senderName,
          fromEmail: row.fromEmail,
          adminEmails: row.adminEmails,
          notifyNewReservation: row.notifyNewReservation,
          notifyApproved: row.notifyApproved,
          notifyRejected: row.notifyRejected,
          notifyPaymentSuccess: row.notifyPaymentSuccess,
          notifyPaymentFailed: row.notifyPaymentFailed,
          notifyCancelled: row.notifyCancelled,
        }
      : DEFAULT_SETTINGS;
    cache = { at: Date.now(), value };
    return value;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function invalidateEmailSettingsCache() {
  cache = null;
}

// Yönetici bildirim adreslerini diziye çevirir (virgül / yeni satır / boşluk ayrımı).
export function parseAdminEmails(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((e) => e.trim())
    .filter((e) => /^\S+@\S+\.\S+$/.test(e));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// E-posta gönderir: asenkron, başarısızlıkta otomatik yeniden dener, her gönderimi
// email_logs tablosuna kaydeder. Hata fırlatmaz (çağıran akışı bozulmaz).
export async function sendMail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  type: string;
}): Promise<{ sent: boolean }> {
  const to = Array.isArray(opts.to) ? opts.to.join(", ") : opts.to;
  if (!to.trim()) return { sent: false };

  const t = getTransporter();
  if (!t) {
    console.warn("[mail] SMTP yapılandırılmamış, e-posta atlandı:", opts.subject);
    await logEmail(to, opts.subject, opts.type, "FAILED", "SMTP yapılandırılmamış");
    return { sent: false };
  }

  const settings = await getEmailSettings();
  const from = `${settings.senderName} <${settings.fromEmail}>`;

  const maxAttempts = 3;
  let lastErr = "";
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await t.sendMail({ from, to, subject: opts.subject, html: opts.html, text: opts.text });
      await logEmail(to, opts.subject, opts.type, "SENT", null);
      return { sent: true };
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err);
      console.error(`[mail] Gönderim hatası (deneme ${attempt}/${maxAttempts}):`, lastErr);
      if (attempt < maxAttempts) await sleep(attempt * 1500);
    }
  }
  await logEmail(to, opts.subject, opts.type, "FAILED", lastErr);
  return { sent: false };
}

async function logEmail(
  to: string,
  subject: string,
  type: string,
  status: string,
  error: string | null
) {
  try {
    await prisma.emailLog.create({
      data: { toAddress: to.slice(0, 500), subject: subject.slice(0, 300), type, status, error: error?.slice(0, 500) ?? null },
    });
  } catch {
    /* log hatası akışı bozmasın */
  }
}
