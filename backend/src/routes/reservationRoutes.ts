import { Router } from "express";
import { createReservation, getReservation } from "../controllers/reservationController";
import { asyncHandler } from "../utils/asyncHandler";
import { publicWriteRateLimit } from "../middleware/rateLimiters";

const router = Router();

router.post("/create", publicWriteRateLimit, asyncHandler(createReservation));
router.get("/:id", asyncHandler(getReservation));

export default router;
