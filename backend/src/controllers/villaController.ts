import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { localizeVilla, parseLang } from "../utils/localize";

export async function getVillaBySlug(req: Request, res: Response) {
  const slug = String(req.params.slug);
  const lang = parseLang(req.query.lang);
  const villa = await prisma.villa.findUnique({ where: { slug } });

  if (!villa || !villa.isActive) {
    throw new AppError("Villa bulunamadı.", 404);
  }

  res.json({ success: true, data: localizeVilla(villa, lang) });
}
