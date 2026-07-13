import { Router } from "express";
import { listStayRulesPublic } from "../controllers/stayRuleController";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(listStayRulesPublic));

export default router;
