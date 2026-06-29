import { z } from "zod";

export const contactSchema = z.object({
  fullName: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ]{10,15}$/, "Geçerli bir telefon numarası girin."),
  message: z.string().trim().min(5).max(2000),
});

export type ContactInput = z.infer<typeof contactSchema>;
