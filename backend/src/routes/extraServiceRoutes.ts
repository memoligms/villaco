import { Router } from "express";
import { listExtraServices } from "../controllers/extraServiceController";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(listExtraServices));

export default router;
