import { Router } from "express";
import { submitContact } from "../controllers/contactController";
import { asyncHandler } from "../utils/asyncHandler";
import { publicWriteRateLimit } from "../middleware/rateLimiters";

const router = Router();

router.post("/", publicWriteRateLimit, asyncHandler(submitContact));

export default router;
