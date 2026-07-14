import { Router } from "express";
import {
  createReservation,
  getReservation,
  getUnavailableDates,
  lookupReservation,
} from "../controllers/reservationController";
import { asyncHandler } from "../utils/asyncHandler";
import { publicWriteRateLimit } from "../middleware/rateLimiters";

const router = Router();

router.post("/create", publicWriteRateLimit, asyncHandler(createReservation));
router.post("/lookup", publicWriteRateLimit, asyncHandler(lookupReservation));
router.get("/unavailable", asyncHandler(getUnavailableDates));
router.get("/:id", asyncHandler(getReservation));

export default router;
