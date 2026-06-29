import rateLimit from "express-rate-limit";

// Brute-force koruması: 15 dakikada IP başına en fazla 10 giriş denemesi.
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Çok fazla giriş denemesi. Lütfen daha sonra tekrar deneyin." },
});

// Spam koruması: halka açık form/oluşturma endpoint'leri için saatte IP başına 20 istek.
export const publicWriteRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin." },
});
