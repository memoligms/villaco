import { Router } from "express";
import { submitReview, listReviews } from "../controllers/reviewController";
import { asyncHandler } from "../utils/asyncHandler";
import { publicWriteRateLimit } from "../middleware/rateLimiters";

const router = Router();

router.get("/", asyncHandler(listReviews));
router.post("/", publicWriteRateLimit, asyncHandler(submitReview));

export default router;
