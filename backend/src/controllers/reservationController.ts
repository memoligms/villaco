import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { createReservationSchema } from "../schemas/reservationSchemas";
import { calculatePrice } from "../utils/priceCalculator";
import { generateReservationCode } from "../utils/reservationCode";
import { AppError } from "../utils/AppError";
import { VILLA_SLUG } from "../config/constants";
import { computeDiscounts, isMobileUserAgent } from "../utils/promotions";
import { resolveMinNights } from "../utils/stayRules";

export async function createReservation(req: Request, res: Response) {
  const input = createReservationSchema.parse(req.body);

  const villa = await prisma.villa.findUnique({ where: { slug: VILLA_SLUG } });
  if (!villa || !villa.isActive) {
    throw new AppError("Villa bulunamadı.", 404);
  }

  if (input.guestCount > villa.maxGuest) {
    throw new AppError(`Bu villa en fazla ${villa.maxGuest} misafir kabul etmektedir.`, 422);
  }

  // Müsaitlik: onay bekleyen, onaylanan ve ödenmiş rezervasyonlar tarihleri tutar.
  // (Reddedilen/iptal/başarısız olanlar tutmaz.)
  const overlapping = await prisma.reservation.findFirst({
    where: {
      villaId: villa.id,
      checkIn: { lt: input.checkOut },
      checkOut: { gt: input.checkIn },
      reservationStatus: { in: ["AWAITING_APPROVAL", "APPROVED", "CONFIRMED"] },
    },
  });
  // Manuel dolu işaretlenen günler (ör. Airbnb) da bloklar.
  const blocked = await prisma.blockedDate.findFirst({
    where: { date: { gte: input.checkIn, lt: input.checkOut } },
  });

  if (overlapping || blocked) {
    throw new AppError("Seçilen tarihler için villa müsait değil.", 409);
  }

  const extraServiceIds = input.extraServiceIds ?? [];
  const extraServices = extraServiceIds.length
    ? await prisma.extraService.findMany({
        where: { id: { in: extraServiceIds.map((e) => e.id) }, isActive: true },
      })
    : [];

  if (extraServices.length !== extraServiceIds.length) {
    throw new AppError("Seçilen ek hizmetlerden bazıları bulunamadı.", 422);
  }

  const extraSelections = extraServiceIds.map((selected) => {
    const service = extraServices.find((s) => s.id === selected.id)!;
    return { service, quantity: selected.quantity };
  });

  const breakdown = calculatePrice({
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    nightlyPrice: Number(villa.baseNightlyPrice),
    cleaningFee: Number(villa.cleaningFee),
    depositFee: Number(villa.depositFee),
    extras: extraSelections.map((e) => ({ unitPrice: Number(e.service.price), quantity: e.quantity })),
  });

  if (breakdown.nightCount < 1) {
    throw new AppError("En az 1 gecelik konaklama seçmelisiniz.", 422);
  }

  // Minimum konaklama kuralı (tarih aralığına göre veya varsayılan).
  const stayRules = await prisma.stayRule.findMany();
  const minNights = resolveMinNights(stayRules, input.checkIn, villa.defaultMinNights);
  if (breakdown.nightCount < minNights) {
    throw new AppError(`Seçtiğiniz tarihler için minimum konaklama süresi ${minNights} gecedir.`, 422);
  }

  // İndirimler: aktif kampanyaları bu rezervasyon bağlamında değerlendir.
  const promotions = await prisma.promotion.findMany({ where: { isActive: true } });
  const needsWelcome = promotions.some((p) => p.type === "WELCOME");
  const confirmedReservationCount = needsWelcome
    ? await prisma.reservation.count({ where: { reservationStatus: "CONFIRMED" } })
    : 0;
  const discountResult = computeDiscounts({
    promotions,
    grandTotal: breakdown.totalPrice,
    checkIn: input.checkIn,
    nightCount: breakdown.nightCount,
    isMobile: isMobileUserAgent(req.headers["user-agent"]),
    confirmedReservationCount,
  });

  const user = await prisma.user.upsert({
    where: { email: input.email },
    update: { fullName: input.fullName, phone: input.phone },
    create: { fullName: input.fullName, email: input.email, phone: input.phone },
  });

  const reservation = await prisma.reservation.create({
    data: {
      reservationCode: generateReservationCode(),
      userId: user.id,
      villaId: villa.id,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      guestCount: input.guestCount,
      nightCount: breakdown.nightCount,
      nightlyPrice: villa.baseNightlyPrice,
      cleaningFee: villa.cleaningFee,
      depositFee: villa.depositFee,
      reservationStatus: "AWAITING_APPROVAL",
      totalPrice: discountResult.finalTotal,
      discountTotal: discountResult.discountTotal,
      discounts: discountResult.discounts.length
        ? (discountResult.discounts as unknown as Prisma.InputJsonValue)
        : undefined,
      note: input.note,
      guests: input.guests ?? undefined,
      extraServices: {
        create: extraSelections.map((e) => ({
          extraServiceId: e.service.id,
          quantity: e.quantity,
          totalPrice: Number(e.service.price) * e.quantity,
        })),
      },
    },
    include: { villa: true, user: true, extraServices: { include: { extraService: true } } },
  });

  res.status(201).json({ success: true, data: reservation });
}

// Public: dolu (müsait olmayan) günler — onay bekleyen/onaylanan/ödenmiş
// rezervasyonlar + manuel dolu işaretlenen günler.
export async function getUnavailableDates(_req: Request, res: Response) {
  const villa = await prisma.villa.findUnique({ where: { slug: VILLA_SLUG } });

  const reservations = villa
    ? await prisma.reservation.findMany({
        where: {
          villaId: villa.id,
          reservationStatus: { in: ["AWAITING_APPROVAL", "APPROVED", "CONFIRMED"] },
        },
        select: { checkIn: true, checkOut: true },
      })
    : [];
  const blocked = await prisma.blockedDate.findMany({ select: { date: true } });

  const days = new Set<string>();
  for (const r of reservations) {
    const d = new Date(r.checkIn);
    while (d < r.checkOut) {
      days.add(d.toISOString().slice(0, 10));
      d.setUTCDate(d.getUTCDate() + 1);
    }
  }
  for (const b of blocked) days.add(b.date.toISOString().slice(0, 10));

  res.json({ success: true, data: [...days].sort() });
}

export async function getReservation(req: Request, res: Response) {
  const idOrCode = String(req.params.id);

  const reservation = await prisma.reservation.findFirst({
    where: { OR: [{ id: idOrCode }, { reservationCode: idOrCode }] },
    include: { villa: true, user: true, payment: true, extraServices: { include: { extraService: true } } },
  });

  if (!reservation) {
    throw new AppError("Rezervasyon bulunamadı.", 404);
  }

  res.json({ success: true, data: reservation });
}
