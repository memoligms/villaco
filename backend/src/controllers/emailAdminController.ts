import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import {
  invalidateEmailSettingsCache,
  isMailConfigured,
  parseAdminEmails,
  sendMail,
} from "../services/mailService";
import { testEmail } from "../utils/emailTemplates";

async function ensureRow() {
  const row = await prisma.emailSetting.findUnique({ where: { id: 1 } });
  if (row) return row;
  return prisma.emailSetting.create({ data: { id: 1 } });
}

export async function adminGetEmailSettings(_req: Request, res: Response) {
  const row = await ensureRow();
  res.json({ success: true, data: { ...row, smtpConfigured: isMailConfigured() } });
}

const updateSchema = z.object({
  senderName: z.string().trim().min(2).max(80).optional(),
  fromEmail: z.string().trim().email().max(200).optional(),
  adminEmails: z.string().trim().max(1000).optional(),
  notifyNewReservation: z.boolean().optional(),
  notifyApproved: z.boolean().optional(),
  notifyRejected: z.boolean().optional(),
  notifyPaymentSuccess: z.boolean().optional(),
  notifyPaymentFailed: z.boolean().optional(),
  notifyCancelled: z.boolean().optional(),
});

export async function adminUpdateEmailSettings(req: Request, res: Response) {
  const input = updateSchema.parse(req.body);
  if (input.adminEmails !== undefined && parseAdminEmails(input.adminEmails).length === 0) {
    throw new AppError("En az bir geçerli yönetici e-posta adresi girin.", 422);
  }
  await ensureRow();
  const row = await prisma.emailSetting.update({ where: { id: 1 }, data: input });
  invalidateEmailSettingsCache();
  res.json({ success: true, data: row });
}

export async function adminListEmailLogs(_req: Request, res: Response) {
  const logs = await prisma.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  res.json({ success: true, data: logs });
}

// Panelden test e-postası — yönetici adreslerine gönderir.
export async function adminSendTestEmail(_req: Request, res: Response) {
  const row = await ensureRow();
  const admins = parseAdminEmails(row.adminEmails);
  if (admins.length === 0) throw new AppError("Yönetici e-posta adresi tanımlı değil.", 422);
  if (!isMailConfigured()) throw new AppError("SMTP yapılandırılmamış (sunucu ortam değişkenleri eksik).", 503);

  const m = testEmail();
  const result = await sendMail({ to: admins, subject: m.subject, html: m.html, text: m.text, type: "TEST" });
  if (!result.sent) throw new AppError("Test e-postası gönderilemedi. Gönderim geçmişini kontrol edin.", 502);
  res.json({ success: true, data: { sentTo: admins } });
}
