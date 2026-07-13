import { z } from "zod";

export const adminLoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mevcut şifre gereklidir."),
  newPassword: z.string().min(8, "Yeni şifre en az 8 karakter olmalıdır.").max(100),
});

export const updateReservationSchema = z
  .object({
    reservationStatus: z
      .enum(["PENDING", "AWAITING_APPROVAL", "APPROVED", "CONFIRMED", "REJECTED", "CANCELLED", "FAILED"])
      .optional(),
    paymentStatus: z.enum(["PENDING", "PAID", "FAILED"]).optional(),
  })
  .refine((d) => d.reservationStatus || d.paymentStatus, {
    message: "En az bir alan güncellenmelidir.",
  });

export const updateVillaSchema = z.object({
  name: z.string().trim().min(2).optional(),
  description: z.string().trim().min(10).optional(),
  location: z.string().trim().min(2).optional(),
  address: z.string().trim().max(500).optional(),
  contactEmail: z.string().trim().email().max(200).optional(),
  contactPhone: z.string().trim().min(5).max(40).optional(),
  maxGuest: z.number().int().min(1).optional(),
  baseNightlyPrice: z.number().min(0).optional(),
  cleaningFee: z.number().min(0).optional(),
  depositFee: z.number().min(0).optional(),
  amenities: z.array(z.string().trim().min(1)).optional(),
  images: z.array(z.string().trim().min(1)).optional(),
  isActive: z.boolean().optional(),
});

export const createExtraServiceSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().max(1000).optional().nullable(),
  price: z.number().min(0),
  isActive: z.boolean().optional(),
});

export const updateExtraServiceSchema = z
  .object({
    name: z.string().trim().min(2).optional(),
    description: z.string().trim().max(1000).optional().nullable(),
    price: z.number().min(0).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "En az bir alan güncellenmelidir." });
