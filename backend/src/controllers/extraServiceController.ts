import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { localizeExtraService, parseLang } from "../utils/localize";

export async function listExtraServices(req: Request, res: Response) {
  const lang = parseLang(req.query.lang);
  const services = await prisma.extraService.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  res.json({ success: true, data: services.map((s) => localizeExtraService(s, lang)) });
}
