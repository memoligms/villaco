import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { createReviewSchema } from "../schemas/reviewSchema";
import { AppError } from "../utils/AppError";

// Public: yorum gönderimi. Yalnızca e-postası, ödemesi tamamlanmış (CONFIRMED) ve
// konaklaması bitmiş (checkOut geçmişte) bir rezervasyonla eşleşen kişilerin yorumu
// kaydedilir ve sitede görünür olur.
export async function submitReview(req: Request, res: Response) {
  const input = createReviewSchema.parse(req.body);
  const email = input.email.toLowerCase();

  const stay = await prisma.reservation.findFirst({
    where: {
      reservationStatus: "CONFIRMED",
      checkOut: { lte: new Date() },
      user: { is: { email: { equals: email, mode: "insensitive" } } },
    },
    orderBy: { checkOut: "desc" },
    select: { reservationCode: true },
  });

  if (!stay) {
    throw new AppError(
      "Bu e-posta ile tamamlanmış bir konaklama bulunamadı. Yorum yapabilmek için daha önce villamızda konaklamış olmanız gerekir.",
      403,
    );
  }

  const review = await prisma.review.create({
    data: {
      name: input.name,
      email,
      rating: input.rating,
      comment: input.comment,
      reservationCode: stay.reservationCode,
    },
    select: { id: true, name: true, rating: true, comment: true, createdAt: true },
  });

  res.status(201).json({
    success: true,
    data: { message: "Yorumunuz için teşekkürler! Değerlendirmeniz yayınlandı.", review },
  });
}

// Public: yayınlanmış (görünür) yorumlar.
export async function listReviews(_req: Request, res: Response) {
  const reviews = await prisma.review.findMany({
    where: { isVisible: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, rating: true, comment: true, createdAt: true },
  });
  res.json({ success: true, data: reviews });
}

// Admin: tüm yorumlar (görünür + gizli).
export async function adminListReviews(_req: Request, res: Response) {
  const reviews = await prisma.review.findMany({ orderBy: { createdAt: "desc" } });
  res.json({ success: true, data: reviews });
}

// Admin: yorumu göster/gizle.
export async function adminToggleReviewVisibility(req: Request, res: Response) {
  const id = String(req.params.id);
  const existing = await prisma.review.findUnique({ where: { id } });
  if (!existing) throw new AppError("Yorum bulunamadı.", 404);

  const review = await prisma.review.update({
    where: { id },
    data: { isVisible: !existing.isVisible },
  });
  res.json({ success: true, data: review });
}

// Admin: yorumu sil.
export async function adminDeleteReview(req: Request, res: Response) {
  const id = String(req.params.id);
  const existing = await prisma.review.findUnique({ where: { id } });
  if (!existing) throw new AppError("Yorum bulunamadı.", 404);

  await prisma.review.delete({ where: { id } });
  res.json({ success: true, data: { id } });
}
