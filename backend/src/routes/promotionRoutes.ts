import { Router } from "express";
import { listActivePromotions } from "../controllers/promotionController";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/active", asyncHandler(listActivePromotions));

export default router;
