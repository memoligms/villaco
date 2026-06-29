import type { Request, Response } from "express";
import { contactSchema } from "../schemas/contactSchema";
import { prisma } from "../config/prisma";

export async function submitContact(req: Request, res: Response) {
  const input = contactSchema.parse(req.body);

  await prisma.contactMessage.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      message: input.message,
    },
  });

  res.status(201).json({
    success: true,
    data: { message: "Mesajınız alındı. En kısa sürede sizinle iletişime geçeceğiz." },
  });
}
