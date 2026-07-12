import nodemailer from "nodemailer";
import { env } from "../config/env";

export function isMailerConfigured(): boolean {
  return Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);
}

export async function sendMail(to: string, subject: string, text: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465, // 465 = SSL, diğerleri STARTTLS
    auth: { user: env.smtp.user, pass: env.smtp.pass },
  });

  await transporter.sendMail({
    from: env.smtp.from || env.smtp.user,
    to,
    subject,
    text,
  });
}
