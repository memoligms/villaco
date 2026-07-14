import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAdmin } from "../middleware/requireAdmin";
import { loginRateLimit } from "../middleware/rateLimiters";
import { uploadImage, uploadVideo } from "../middleware/upload";
import {
  adminListReviews,
  adminToggleReviewVisibility,
  adminReplyReview,
  adminDeleteReview,
} from "../controllers/reviewController";
import {
  adminListPromotions,
  adminUpdatePromotion,
  adminCreatePromotion,
  adminDeletePromotion,
} from "../controllers/promotionController";
import {
  adminListStayRules,
  adminCreateStayRule,
  adminUpdateStayRule,
  adminDeleteStayRule,
} from "../controllers/stayRuleController";
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
  adminApproveReservation,
  adminRejectReservation,
  adminListReservations,
  adminLogin,
  adminMarkMessageRead,
  adminStats,
  adminUpdateExtraService,
  adminUpdateReservation,
  adminUpdateVilla,
  adminUploadImage,
  adminUploadVideo,
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
router.patch("/reservations/:id/approve", asyncHandler(adminApproveReservation));
router.patch("/reservations/:id/reject", asyncHandler(adminRejectReservation));
router.patch("/reservations/:id", asyncHandler(adminUpdateReservation));
router.get("/messages", asyncHandler(adminListMessages));
router.patch("/messages/:id/toggle-read", asyncHandler(adminMarkMessageRead));
router.get("/villa", asyncHandler(adminGetVilla));
router.patch("/villa", asyncHandler(adminUpdateVilla));

// Kampanyalar / indirimler
router.get("/promotions", asyncHandler(adminListPromotions));
router.post("/promotions", asyncHandler(adminCreatePromotion));
router.patch("/promotions/:id", asyncHandler(adminUpdatePromotion));
router.delete("/promotions/:id", asyncHandler(adminDeletePromotion));

// Minimum konaklama kuralları
router.get("/stay-rules", asyncHandler(adminListStayRules));
router.post("/stay-rules", asyncHandler(adminCreateStayRule));
router.patch("/stay-rules/:id", asyncHandler(adminUpdateStayRule));
router.delete("/stay-rules/:id", asyncHandler(adminDeleteStayRule));

// Müşteri yorumları
router.get("/reviews", asyncHandler(adminListReviews));
router.patch("/reviews/:id/toggle-visibility", asyncHandler(adminToggleReviewVisibility));
router.patch("/reviews/:id/reply", asyncHandler(adminReplyReview));
router.delete("/reviews/:id", asyncHandler(adminDeleteReview));

// Ek hizmetler
router.get("/extra-services", asyncHandler(adminListExtraServices));
router.post("/extra-services", asyncHandler(adminCreateExtraService));
router.patch("/extra-services/:id", asyncHandler(adminUpdateExtraService));
router.delete("/extra-services/:id", asyncHandler(adminDeleteExtraService));

// Görsel yükleme / silme
router.post("/upload", uploadImage.single("image"), asyncHandler(adminUploadImage));
router.post("/upload-video", uploadVideo.single("video"), asyncHandler(adminUploadVideo));
router.delete("/upload", asyncHandler(adminDeleteImage));

export default router;
