import { z } from "zod";

export const createReservationSchema = z
  .object({
    checkIn: z.coerce.date(),
    checkOut: z.coerce.date(),
    guestCount: z.number().int().min(1),
    fullName: z.string().trim().min(2),
    email: z.string().trim().email(),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9 ]{10,15}$/, "Geçerli bir telefon numarası girin."),
    note: z.string().trim().max(1000).optional(),
    guests: z
      .array(
        z.object({
          gender: z.enum(["male", "female"]),
          firstName: z.string().trim().min(1).max(100),
          lastName: z.string().trim().min(1).max(100),
        })
      )
      .max(50)
      .optional(),
    extraServiceIds: z.array(z.object({ id: z.string().uuid(), quantity: z.number().int().min(1).default(1) })).optional(),
  })
  .superRefine((data, ctx) => {
    // Geçmiş tarihli giriş engellenir (bugünden önce olamaz).
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (data.checkIn < today) {
      ctx.addIssue({
        code: "custom",
        path: ["checkIn"],
        message: "Geçmiş bir tarih için rezervasyon oluşturulamaz.",
      });
    }
    if (data.checkOut <= data.checkIn) {
      ctx.addIssue({
        code: "custom",
        path: ["checkOut"],
        message: "Çıkış tarihi giriş tarihinden sonra olmalıdır.",
      });
    }
  });

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
