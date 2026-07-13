import path from "path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import villaRoutes from "./routes/villaRoutes";
import reservationRoutes from "./routes/reservationRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import extraServiceRoutes from "./routes/extraServiceRoutes";
import contactRoutes from "./routes/contactRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import promotionRoutes from "./routes/promotionRoutes";
import stayRuleRoutes from "./routes/stayRuleRoutes";
import adminRoutes from "./routes/adminRoutes";

export function createApp() {
  const app = express();

  if (env.nodeEnv === "production") {
    // Reverse proxy / load balancer arkasında çalışırken gerçek istemci IP'sini
    // doğru tespit etmek için (rate limiting ve req.ip için gerekli).
    app.set("trust proxy", 1);
  }

  // Görsellerin başka bir origin'den (frontend) yüklenebilmesi için
  // cross-origin resource policy'yi gevşetiyoruz.
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: env.corsOrigin, credentials: true }));

  // Yüklenen villa görselleri (backend/public/uploads -> /uploads/...)
  app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));

  app.use(express.json());
  app.use(morgan(env.nodeEnv === "development" ? "dev" : "combined"));

  app.get("/api/health", (_req, res) => {
    res.json({ success: true, status: "ok" });
  });

  app.use("/api/villas", villaRoutes);
  app.use("/api/reservations", reservationRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/extra-services", extraServiceRoutes);
  app.use("/api/contact", contactRoutes);
  app.use("/api/reviews", reviewRoutes);
  app.use("/api/promotions", promotionRoutes);
  app.use("/api/stay-rules", stayRuleRoutes);
  app.use("/api/admin", adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
