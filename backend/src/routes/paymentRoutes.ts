import { Router } from "express";
import express from "express";
import { handlePaymentCallback, initializePayment } from "../controllers/paymentController";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post("/iyzico/initialize", asyncHandler(initializePayment));
router.post("/iyzico/callback", express.urlencoded({ extended: true }), asyncHandler(handlePaymentCallback));

export default router;
