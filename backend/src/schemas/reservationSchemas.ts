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
    extraServiceIds: z.array(z.object({ id: z.string().uuid(), quantity: z.number().int().min(1).default(1) })).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.checkOut <= data.checkIn) {
      ctx.addIssue({
        code: "custom",
        path: ["checkOut"],
        message: "Çıkış tarihi giriş tarihinden sonra olmalıdır.",
      });
    }
  });

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
