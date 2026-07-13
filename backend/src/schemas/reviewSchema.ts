import { z } from "zod";

export const createReviewSchema = z.object({
  name: z.string().trim().min(2, "Lütfen adınızı girin.").max(80),
  email: z.string().trim().email("Geçerli bir e-posta girin."),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(10, "Yorum en az 10 karakter olmalı.").max(1000),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
