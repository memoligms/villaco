import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { VILLA_SLUG } from "../config/constants";

// Public: minimum konaklama kuralları + varsayılan (rezervasyon sayfası için).
export async function listStayRulesPublic(_req: Request, res: Response) {
  const [rules, villa] = await Promise.all([
    prisma.stayRule.findMany({ orderBy: { startDate: "asc" } }),
    prisma.villa.findUnique({ where: { slug: VILLA_SLUG }, select: { defaultMinNights: true } }),
  ]);
  res.json({
    success: true,
    data: {
      defaultMinNights: villa?.defaultMinNights ?? 2,
      rules: rules.map((r) => ({
        id: r.id,
        label: r.label,
        minNights: r.minNights,
        startDate: r.startDate.toISOString().slice(0, 10),
        endDate: r.endDate.toISOString().slice(0, 10),
      })),
    },
  });
}

// Admin: tüm kurallar.
export async function adminListStayRules(_req: Request, res: Response) {
  const rules = await prisma.stayRule.findMany({ orderBy: { startDate: "asc" } });
  res.json({ success: true, data: rules });
}

const createSchema = z
  .object({
    label: z.string().trim().min(2).max(120),
    minNights: z.coerce.number().int().min(1).max(365),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçersiz tarih (YYYY-MM-DD)."),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçersiz tarih (YYYY-MM-DD)."),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: "Bitiş tarihi başlangıçtan önce olamaz.",
    path: ["endDate"],
  });

export async function adminCreateStayRule(req: Request, res: Response) {
  const input = createSchema.parse(req.body);
  const rule = await prisma.stayRule.create({
    data: {
      label: input.label,
      minNights: input.minNights,
      startDate: new Date(`${input.startDate}T00:00:00.000Z`),
      endDate: new Date(`${input.endDate}T00:00:00.000Z`),
    },
  });
  res.status(201).json({ success: true, data: rule });
}

const updateSchema = z.object({
  label: z.string().trim().min(2).max(120).optional(),
  minNights: z.coerce.number().int().min(1).max(365).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function adminUpdateStayRule(req: Request, res: Response) {
  const id = String(req.params.id);
  const input = updateSchema.parse(req.body);
  const existing = await prisma.stayRule.findUnique({ where: { id } });
  if (!existing) throw new AppError("Kural bulunamadı.", 404);

  const rule = await prisma.stayRule.update({
    where: { id },
    data: {
      ...(input.label !== undefined ? { label: input.label } : {}),
      ...(input.minNights !== undefined ? { minNights: input.minNights } : {}),
      ...(input.startDate ? { startDate: new Date(`${input.startDate}T00:00:00.000Z`) } : {}),
      ...(input.endDate ? { endDate: new Date(`${input.endDate}T00:00:00.000Z`) } : {}),
    },
  });
  res.json({ success: true, data: rule });
}

export async function adminDeleteStayRule(req: Request, res: Response) {
  const id = String(req.params.id);
  const existing = await prisma.stayRule.findUnique({ where: { id } });
  if (!existing) throw new AppError("Kural bulunamadı.", 404);
  await prisma.stayRule.delete({ where: { id } });
  res.json({ success: true, data: { id } });
}
