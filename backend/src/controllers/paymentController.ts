import type { Request, Response } from "express";
import { randomUUID } from "crypto";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { initiateCheckoutForm, retrieveCheckoutForm } from "../services/iyzicoService";
import { create3DPayment, isSipayConfigured, validateHashKey } from "../services/sipayService";
import { env } from "../config/env";

const PAYMENT_CURRENCY = "USD";

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

// --- Sipay ---

export async function initializeSipayPayment(req: Request, res: Response) {
  if (!isSipayConfigured()) {
    throw new AppError("Ödeme altyapısı henüz yapılandırılmamış.", 503);
  }

  const { reservationCode, card } = req.body as {
    reservationCode?: string;
    card?: { holderName?: string; number?: string; expiryMonth?: string; expiryYear?: string; cvv?: string };
  };

  if (!reservationCode) {
    throw new AppError("reservationCode zorunludur.", 422);
  }
  if (!card?.holderName || !card.number || !card.expiryMonth || !card.expiryYear || !card.cvv) {
    throw new AppError("Kart bilgileri eksik.", 422);
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

  const [firstName, ...rest] = reservation.user.fullName.trim().split(/\s+/);
  const lastName = rest.join(" ") || firstName;

  await prisma.payment.upsert({
    where: { reservationId: reservation.id },
    create: {
      reservationId: reservation.id,
      amount: reservation.totalPrice,
      currency: PAYMENT_CURRENCY,
      status: "PENDING",
      iyzicoConversationId: reservation.reservationCode,
    },
    update: { status: "PENDING", currency: PAYMENT_CURRENCY },
  });

  const result = await create3DPayment({
    cardHolderName: card.holderName.trim(),
    cardNumber: card.number,
    expiryMonth: card.expiryMonth,
    expiryYear: card.expiryYear,
    cvv: card.cvv,
    currencyCode: PAYMENT_CURRENCY,
    total: Number(reservation.totalPrice),
    invoiceId: reservation.reservationCode,
    invoiceDescription: `${reservation.villa.name} Rezervasyonu`,
    name: firstName,
    surname: lastName,
    itemName: `${reservation.villa.name} Rezervasyonu`,
    returnUrl: `${env.backendBaseUrl}/api/payments/sipay/callback`,
    cancelUrl: `${env.backendBaseUrl}/api/payments/sipay/callback`,
    ip: req.ip ?? "127.0.0.1",
  });

  if (!result.ok || !result.html) {
    await prisma.payment.update({
      where: { reservationId: reservation.id },
      data: { status: "FAILED", rawResponse: (result.raw ?? null) as never },
    });
    throw new AppError(result.errorMessage ?? "Ödeme başlatılamadı.", 502);
  }

  res.json({ success: true, data: { html: result.html } });
}

export async function handleSipayCallback(req: Request, res: Response) {
  // Sipay başarı durumunda POST, bazı hata durumlarında GET ile döner.
  const body = { ...(req.query as Record<string, string>), ...(req.body as Record<string, string>) };
  const hashKey = body.hash_key ?? "";
  const invoiceId = body.invoice_id ?? "";

  const parsed = validateHashKey(hashKey);
  // Sipay: status "1" veya sipay_status "1" başarı; hash içindeki status da doğrulanır.
  const succeeded =
    (parsed?.status === "1" || body.sipay_status === "1" || body.status_code === "100") &&
    (!parsed || parsed.status !== "0");

  const code = parsed?.invoiceId || invoiceId;
  const reservation = code
    ? await prisma.reservation.findUnique({ where: { reservationCode: code } })
    : null;

  if (!reservation) {
    return res.redirect(`${env.frontendBaseUrl}/odeme/basarisiz?reason=not_found`);
  }

  if (succeeded) {
    await prisma.$transaction([
      prisma.payment.updateMany({
        where: { reservationId: reservation.id },
        data: { status: "PAID", iyzicoPaymentId: parsed?.orderId ?? body.order_no ?? null, rawResponse: body as never },
      }),
      prisma.reservation.update({
        where: { id: reservation.id },
        data: { paymentStatus: "PAID", reservationStatus: "CONFIRMED" },
      }),
    ]);
    return res.redirect(`${env.frontendBaseUrl}/odeme/basarili?code=${reservation.reservationCode}`);
  }

  await prisma.$transaction([
    prisma.payment.updateMany({
      where: { reservationId: reservation.id },
      data: { status: "FAILED", rawResponse: body as never },
    }),
    prisma.reservation.update({
      where: { id: reservation.id },
      data: { paymentStatus: "FAILED", reservationStatus: "FAILED" },
    }),
  ]);
  return res.redirect(`${env.frontendBaseUrl}/odeme/basarisiz?code=${reservation.reservationCode}`);
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
