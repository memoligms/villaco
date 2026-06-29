import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

export interface AdminTokenPayload {
  sub: string;
  role: "admin";
}

export function signAdminToken(username: string): string {
  const payload: AdminTokenPayload = { sub: username, role: "admin" };
  return jwt.sign(payload, env.admin.jwtSecret, { expiresIn: env.admin.tokenTtl as jwt.SignOptions["expiresIn"] });
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new AppError("Yetkilendirme gerekli.", 401);
  }

  const token = header.slice("Bearer ".length).trim();
  try {
    const decoded = jwt.verify(token, env.admin.jwtSecret) as AdminTokenPayload;
    if (decoded.role !== "admin") {
      throw new AppError("Yetkisiz erişim.", 403);
    }
    next();
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError("Geçersiz veya süresi dolmuş oturum.", 401);
  }
}
