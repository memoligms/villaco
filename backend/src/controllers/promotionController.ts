import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";

const BUILTIN_TYPES = ["MOBILE", "WELCOME", "LAST_MINUTE"];

// Admin: tüm kampanyalar.
export async function adminListPromotions(_req: Request, res: Response) {
  const promotions = await prisma.promotion.findMany({ orderBy: { createdAt: "asc" } });
  res.json({ success: true, data: promotions });
}

const updateSchema = z.object({
  label: z.string().trim().min(2).max(120).optional(),
  percentage: z.coerce.number().int().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  maxRedemptions: z.coerce.number().int().min(1).max(100000).nullable().optional(),
  daysBefore: z.coerce.number().int().min(1).max(365).nullable().optional(),
});

// Admin: kampanya güncelle (yüzde, etiket, aktiflik, parametreler).
export async function adminUpdatePromotion(req: Request, res: Response) {
  const id = String(req.params.id);
  const input = updateSchema.parse(req.body);

  const existing = await prisma.promotion.findUnique({ where: { id } });
  if (!existing) throw new AppError("Kampanya bulunamadı.", 404);

  const promotion = await prisma.promotion.update({ where: { id }, data: input });
  res.json({ success: true, data: promotion });
}

const createSchema = z
  .object({
    label: z.string().trim().min(2).max(120),
    percentage: z.coerce.number().int().min(1).max(100),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçersiz tarih (YYYY-MM-DD)."),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçersiz tarih (YYYY-MM-DD)."),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: "Bitiş tarihi başlangıçtan önce olamaz.",
    path: ["endDate"],
  });

// Admin: tarih aralığına özel kampanya oluştur (DATE_RANGE).
export async function adminCreatePromotion(req: Request, res: Response) {
  const input = createSchema.parse(req.body);

  const promotion = await prisma.promotion.create({
    data: {
      type: "DATE_RANGE",
      label: input.label,
      percentage: input.percentage,
      isActive: true,
      startDate: new Date(`${input.startDate}T00:00:00.000Z`),
      endDate: new Date(`${input.endDate}T00:00:00.000Z`),
    },
  });
  res.status(201).json({ success: true, data: promotion });
}

// Admin: kampanya sil. Yerleşik türler silinemez (yalnızca kapatılabilir).
export async function adminDeletePromotion(req: Request, res: Response) {
  const id = String(req.params.id);
  const existing = await prisma.promotion.findUnique({ where: { id } });
  if (!existing) throw new AppError("Kampanya bulunamadı.", 404);
  if (BUILTIN_TYPES.includes(existing.type)) {
    throw new AppError("Yerleşik indirimler silinemez; kapatabilirsiniz.", 400);
  }

  await prisma.promotion.delete({ where: { id } });
  res.json({ success: true, data: { id } });
}
