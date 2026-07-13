import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env";

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

// E-posta gönderir. SMTP yapılandırılmamışsa sessizce atlar (akışı bozmaz).
export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ sent: boolean }> {
  const t = getTransporter();
  if (!t) {
    console.warn("[mail] SMTP yapılandırılmamış, e-posta atlandı:", opts.subject);
    return { sent: false };
  }
  try {
    await t.sendMail({
      from: env.smtp.from || env.smtp.user,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    return { sent: true };
  } catch (err) {
    console.error("[mail] Gönderim hatası:", err);
    return { sent: false };
  }
}
