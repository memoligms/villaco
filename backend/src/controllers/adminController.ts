import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { signAdminToken } from "../middleware/requireAdmin";
import {
  adminLoginSchema,
  changePasswordSchema,
  createExtraServiceSchema,
  updateExtraServiceSchema,
  updateReservationSchema,
  updateVillaSchema,
} from "../schemas/adminSchemas";
import { VILLA_SLUG } from "../config/constants";
import { UPLOAD_DIR } from "../middleware/upload";

export async function adminLogin(req: Request, res: Response) {
  const { username, password } = adminLoginSchema.parse(req.body);

  if (username !== env.admin.username) {
    throw new AppError("Kullanıcı adı veya şifre hatalı.", 401);
  }

  // Şifre daha önce panelden değiştirildiyse DB'deki hash; değilse env değeri.
  const setting = await prisma.adminSetting.findUnique({ where: { id: 1 } });
  const ok = setting?.passwordHash
    ? await bcrypt.compare(password, setting.passwordHash)
    : password === env.admin.password;

  if (!ok) {
    throw new AppError("Kullanıcı adı veya şifre hatalı.", 401);
  }

  const token = signAdminToken(username);
  res.json({ success: true, data: { token, username } });
}

// Mevcut şifre doğruysa yeni şifreyi (bcrypt hash) kaydeder.
export async function adminChangePassword(req: Request, res: Response) {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

  const setting = await prisma.adminSetting.findUnique({ where: { id: 1 } });
  const currentOk = setting?.passwordHash
    ? await bcrypt.compare(currentPassword, setting.passwordHash)
    : currentPassword === env.admin.password;

  if (!currentOk) {
    throw new AppError("Mevcut şifre hatalı.", 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.adminSetting.upsert({
    where: { id: 1 },
    create: { id: 1, passwordHash },
    update: { passwordHash },
  });

  res.json({ success: true, data: { message: "Şifre başarıyla değiştirildi." } });
}

export async function adminStats(_req: Request, res: Response) {
  const [total, confirmed, pending, cancelled, paidAgg, unreadMessages, totalMessages] = await Promise.all([
    prisma.reservation.count(),
    prisma.reservation.count({ where: { reservationStatus: "CONFIRMED" } }),
    prisma.reservation.count({ where: { reservationStatus: "PENDING" } }),
    prisma.reservation.count({ where: { reservationStatus: "CANCELLED" } }),
    prisma.reservation.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { totalPrice: true },
    }),
    prisma.contactMessage.count({ where: { isRead: false } }),
    prisma.contactMessage.count(),
  ]);

  const recent = await prisma.reservation.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  res.json({
    success: true,
    data: {
      reservations: { total, confirmed, pending, cancelled },
      revenue: Number(paidAgg._sum.totalPrice ?? 0),
      messages: { unread: unreadMessages, total: totalMessages },
      recentReservations: recent,
    },
  });
}

function parseDateParam(value: unknown): Date | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export async function adminListReservations(req: Request, res: Response) {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const from = parseDateParam(req.query.from);
  const to = parseDateParam(req.query.to);

  const where: {
    reservationStatus?: "PENDING" | "CONFIRMED" | "CANCELLED" | "FAILED";
    checkIn?: { lte: Date };
    checkOut?: { gte: Date };
  } = {};

  if (status && ["PENDING", "CONFIRMED", "CANCELLED", "FAILED"].includes(status)) {
    where.reservationStatus = status as "PENDING" | "CONFIRMED" | "CANCELLED" | "FAILED";
  }

  // Konaklaması seçilen aralıkla çakışan rezervasyonlar: checkIn <= to && checkOut >= from
  if (to) where.checkIn = { lte: to };
  if (from) where.checkOut = { gte: from };

  const reservations = await prisma.reservation.findMany({
    where,
    orderBy: { checkIn: "desc" },
    include: {
      user: true,
      payment: true,
      extraServices: { include: { extraService: true } },
    },
  });

  res.json({ success: true, data: reservations });
}

export async function adminGetReservation(req: Request, res: Response) {
  const id = String(req.params.id);
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      user: true,
      villa: true,
      payment: true,
      extraServices: { include: { extraService: true } },
    },
  });

  if (!reservation) {
    throw new AppError("Rezervasyon bulunamadı.", 404);
  }

  res.json({ success: true, data: reservation });
}

export async function adminUpdateReservation(req: Request, res: Response) {
  const id = String(req.params.id);
  const input = updateReservationSchema.parse(req.body);

  const existing = await prisma.reservation.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Rezervasyon bulunamadı.", 404);
  }

  const reservation = await prisma.reservation.update({
    where: { id },
    data: {
      ...(input.reservationStatus ? { reservationStatus: input.reservationStatus } : {}),
      ...(input.paymentStatus ? { paymentStatus: input.paymentStatus } : {}),
    },
    include: { user: true, payment: true },
  });

  res.json({ success: true, data: reservation });
}

export async function adminListMessages(_req: Request, res: Response) {
  const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });
  res.json({ success: true, data: messages });
}

export async function adminMarkMessageRead(req: Request, res: Response) {
  const id = String(req.params.id);
  const existing = await prisma.contactMessage.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Mesaj bulunamadı.", 404);
  }

  const message = await prisma.contactMessage.update({
    where: { id },
    data: { isRead: !existing.isRead },
  });

  res.json({ success: true, data: message });
}

export async function adminGetVilla(_req: Request, res: Response) {
  const villa = await prisma.villa.findUnique({ where: { slug: VILLA_SLUG } });
  if (!villa) {
    throw new AppError("Villa bulunamadı.", 404);
  }
  res.json({ success: true, data: villa });
}

export async function adminUpdateVilla(req: Request, res: Response) {
  const input = updateVillaSchema.parse(req.body);

  const villa = await prisma.villa.update({
    where: { slug: VILLA_SLUG },
    data: input,
  });

  res.json({ success: true, data: villa });
}

// --- Ek Hizmetler (CRUD) ---

export async function adminListExtraServices(_req: Request, res: Response) {
  const services = await prisma.extraService.findMany({ orderBy: { name: "asc" } });
  res.json({ success: true, data: services });
}

export async function adminCreateExtraService(req: Request, res: Response) {
  const input = createExtraServiceSchema.parse(req.body);
  const service = await prisma.extraService.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      price: input.price,
      isActive: input.isActive ?? true,
    },
  });
  res.status(201).json({ success: true, data: service });
}

export async function adminUpdateExtraService(req: Request, res: Response) {
  const id = String(req.params.id);
  const input = updateExtraServiceSchema.parse(req.body);

  const existing = await prisma.extraService.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Ek hizmet bulunamadı.", 404);
  }

  const service = await prisma.extraService.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });

  res.json({ success: true, data: service });
}

export async function adminDeleteExtraService(req: Request, res: Response) {
  const id = String(req.params.id);

  const existing = await prisma.extraService.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Ek hizmet bulunamadı.", 404);
  }

  const usageCount = await prisma.reservationExtraService.count({ where: { extraServiceId: id } });
  if (usageCount > 0) {
    // Geçmiş rezervasyonlarla ilişkili hizmet silinemez; pasife alınır.
    const service = await prisma.extraService.update({ where: { id }, data: { isActive: false } });
    return res.json({
      success: true,
      data: service,
      message: "Bu hizmet rezervasyonlarda kullanıldığı için silinemez; pasife alındı.",
    });
  }

  await prisma.extraService.delete({ where: { id } });
  res.json({ success: true, data: { id } });
}

// --- Görsel yükleme ---

export async function adminUploadImage(req: Request, res: Response) {
  if (!req.file) {
    throw new AppError("Yüklenecek dosya bulunamadı.", 400);
  }
  const url = `${env.backendBaseUrl}/uploads/${req.file.filename}`;
  res.status(201).json({ success: true, data: { url } });
}

export async function adminDeleteImage(req: Request, res: Response) {
  // Sadece /uploads altındaki dosyalar silinebilir (frontend public görselleri korunur).
  const url = typeof req.body?.url === "string" ? req.body.url : "";
  const marker = "/uploads/";
  const idx = url.indexOf(marker);
  if (idx === -1) {
    throw new AppError("Bu görsel sunucudan silinemez.", 400);
  }
  const filename = path.basename(url.slice(idx + marker.length));
  const filePath = path.join(UPLOAD_DIR, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  res.json({ success: true, data: { url } });
}
