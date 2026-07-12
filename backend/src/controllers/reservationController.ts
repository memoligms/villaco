import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { createReservationSchema } from "../schemas/reservationSchemas";
import { calculatePrice } from "../utils/priceCalculator";
import { generateReservationCode } from "../utils/reservationCode";
import { AppError } from "../utils/AppError";
import { VILLA_SLUG } from "../config/constants";

export async function createReservation(req: Request, res: Response) {
  const input = createReservationSchema.parse(req.body);

  const villa = await prisma.villa.findUnique({ where: { slug: VILLA_SLUG } });
  if (!villa || !villa.isActive) {
    throw new AppError("Villa bulunamadı.", 404);
  }

  if (input.guestCount > villa.maxGuest) {
    throw new AppError(`Bu villa en fazla ${villa.maxGuest} misafir kabul etmektedir.`, 422);
  }

  // Müsaitlik: onaylanan (ödenmiş) rezervasyonlar her zaman bloklar.
  // PENDING (ödeme bekleyen) yalnızca son 1 saatte oluşturulduysa bloklar; böylece
  // ödemesi tamamlanmayan/terk edilen denemeler tarihleri kalıcı olarak kapatmaz.
  const pendingCutoff = new Date(Date.now() - 60 * 60 * 1000);
  const overlapping = await prisma.reservation.findFirst({
    where: {
      villaId: villa.id,
      checkIn: { lt: input.checkOut },
      checkOut: { gt: input.checkIn },
      OR: [
        { reservationStatus: "CONFIRMED" },
        { reservationStatus: "PENDING", createdAt: { gt: pendingCutoff } },
      ],
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
      totalPrice: breakdown.totalPrice,
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

// Public: dolu (müsait olmayan) günler — onaylı rezervasyonlar + son 1 saatteki
// bekleyen ödemeler + manuel dolu işaretlenen günler.
export async function getUnavailableDates(_req: Request, res: Response) {
  const villa = await prisma.villa.findUnique({ where: { slug: VILLA_SLUG } });
  const pendingCutoff = new Date(Date.now() - 60 * 60 * 1000);

  const reservations = villa
    ? await prisma.reservation.findMany({
        where: {
          villaId: villa.id,
          OR: [
            { reservationStatus: "CONFIRMED" },
            { reservationStatus: "PENDING", createdAt: { gt: pendingCutoff } },
          ],
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
