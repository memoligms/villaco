import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAdmin } from "../middleware/requireAdmin";
import { loginRateLimit } from "../middleware/rateLimiters";
import { uploadImage } from "../middleware/upload";
import {
  adminListReviews,
  adminToggleReviewVisibility,
  adminDeleteReview,
} from "../controllers/reviewController";
import {
  adminChangePassword,
  adminCreateExtraService,
  adminDeleteExtraService,
  adminListBlockedDates,
  adminToggleBlockedDate,
  adminDeleteImage,
  adminGetReservation,
  adminGetVilla,
  adminListExtraServices,
  adminListMessages,
  adminListReservations,
  adminLogin,
  adminMarkMessageRead,
  adminStats,
  adminUpdateExtraService,
  adminUpdateReservation,
  adminUpdateVilla,
  adminUploadImage,
} from "../controllers/adminController";

const router = Router();

// Public
router.post("/login", loginRateLimit, asyncHandler(adminLogin));

// Protected
router.use(requireAdmin);
router.get("/stats", asyncHandler(adminStats));
router.post("/password/change", asyncHandler(adminChangePassword));
router.get("/blocked-dates", asyncHandler(adminListBlockedDates));
router.post("/blocked-dates/toggle", asyncHandler(adminToggleBlockedDate));
router.get("/reservations", asyncHandler(adminListReservations));
router.get("/reservations/:id", asyncHandler(adminGetReservation));
router.patch("/reservations/:id", asyncHandler(adminUpdateReservation));
router.get("/messages", asyncHandler(adminListMessages));
router.patch("/messages/:id/toggle-read", asyncHandler(adminMarkMessageRead));
router.get("/villa", asyncHandler(adminGetVilla));
router.patch("/villa", asyncHandler(adminUpdateVilla));

// Müşteri yorumları
router.get("/reviews", asyncHandler(adminListReviews));
router.patch("/reviews/:id/toggle-visibility", asyncHandler(adminToggleReviewVisibility));
router.delete("/reviews/:id", asyncHandler(adminDeleteReview));

// Ek hizmetler
router.get("/extra-services", asyncHandler(adminListExtraServices));
router.post("/extra-services", asyncHandler(adminCreateExtraService));
router.patch("/extra-services/:id", asyncHandler(adminUpdateExtraService));
router.delete("/extra-services/:id", asyncHandler(adminDeleteExtraService));

// Görsel yükleme / silme
router.post("/upload", uploadImage.single("image"), asyncHandler(adminUploadImage));
router.delete("/upload", asyncHandler(adminDeleteImage));

export default router;
