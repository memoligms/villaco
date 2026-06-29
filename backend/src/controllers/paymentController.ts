import type { Request, Response } from "express";
import { randomUUID } from "crypto";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { initiateCheckoutForm, retrieveCheckoutForm } from "../services/iyzicoService";
import { env } from "../config/env";

export async function initializePayment(req: Request, res: Response) {
  const { reservationCode } = req.body as { reservationCode?: string };
  if (!reservationCode) {
    throw new AppError("reservationCode zorunludur.", 422);
  }

  const reservation = await prisma.reservation.findUnique({
    where: { reservationCode },
    include: { villa: true, user: true, payment: true },
  });

  if (!reservation) {
    throw new AppError("Rezervasyon bulunamadı.", 404);
  }
  if (reservation.paymentStatus === "PAID") {
    throw new AppError("Bu rezervasyon için ödeme zaten tamamlanmış.", 409);
  }

  const conversationId = randomUUID();
  const [firstName, ...rest] = reservation.user.fullName.trim().split(/\s+/);
  const lastName = rest.join(" ") || firstName;

  const checkout = await initiateCheckoutForm({
    conversationId,
    price: Number(reservation.totalPrice),
    basketId: reservation.id,
    callbackUrl: `${env.backendBaseUrl}/api/payments/iyzico/callback`,
    basketItemName: `${reservation.villa.name} Rezervasyonu`,
    buyer: {
      id: reservation.userId,
      name: firstName,
      surname: lastName,
      email: reservation.user.email,
      gsmNumber: reservation.user.phone,
      identityNumber: "11111111111",
      ip: req.ip ?? "127.0.0.1",
    },
  });

  if (checkout.status !== "success") {
    await prisma.payment.upsert({
      where: { reservationId: reservation.id },
      create: {
        reservationId: reservation.id,
        amount: reservation.totalPrice,
        status: "FAILED",
        iyzicoConversationId: conversationId,
        rawResponse: checkout.raw as any,
      },
      update: {
        status: "FAILED",
        iyzicoConversationId: conversationId,
        rawResponse: checkout.raw as any,
      },
    });
    throw new AppError(checkout.errorMessage ?? "Ödeme başlatılamadı.", 502);
  }

  await prisma.payment.upsert({
    where: { reservationId: reservation.id },
    create: {
      reservationId: reservation.id,
      amount: reservation.totalPrice,
      status: "PENDING",
      iyzicoConversationId: conversationId,
      iyzicoPaymentId: checkout.token,
      rawResponse: checkout.raw as any,
    },
    update: {
      status: "PENDING",
      iyzicoConversationId: conversationId,
      iyzicoPaymentId: checkout.token,
      rawResponse: checkout.raw as any,
    },
  });

  res.json({
    success: true,
    data: {
      checkoutFormContent: checkout.checkoutFormContent,
      paymentPageUrl: checkout.paymentPageUrl,
      token: checkout.token,
    },
  });
}

export async function handlePaymentCallback(req: Request, res: Response) {
  const token = (req.body?.token ?? req.query?.token) as string | undefined;

  if (!token) {
    return res.redirect(`${env.frontendBaseUrl}/odeme/basarisiz?reason=missing_token`);
  }

  const result = await retrieveCheckoutForm(token);
  const payment = await prisma.payment.findFirst({ where: { iyzicoPaymentId: token } });

  if (!payment) {
    return res.redirect(`${env.frontendBaseUrl}/odeme/basarisiz?reason=not_found`);
  }

  const reservation = await prisma.reservation.findUnique({ where: { id: payment.reservationId } });

  const paymentSucceeded = result.status === "success" && (result.raw as any)?.paymentStatus === "SUCCESS";

  if (paymentSucceeded) {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: "PAID", rawResponse: result.raw as any },
      }),
      prisma.reservation.update({
        where: { id: payment.reservationId },
        data: { paymentStatus: "PAID", reservationStatus: "CONFIRMED" },
      }),
    ]);
    return res.redirect(`${env.frontendBaseUrl}/odeme/basarili?code=${reservation?.reservationCode}`);
  }

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", rawResponse: result.raw as any },
    }),
    prisma.reservation.update({
      where: { id: payment.reservationId },
      data: { paymentStatus: "FAILED", reservationStatus: "FAILED" },
    }),
  ]);

  return res.redirect(`${env.frontendBaseUrl}/odeme/basarisiz?code=${reservation?.reservationCode}`);
}
