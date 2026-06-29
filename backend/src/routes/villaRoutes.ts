import { Router } from "express";
import { getVillaBySlug } from "../controllers/villaController";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/:slug", asyncHandler(getVillaBySlug));

export default router;
