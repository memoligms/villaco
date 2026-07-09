import { Router } from "express";
import express from "express";
import {
  handlePaymentCallback,
  handleSipayCallback,
  initializePayment,
  initializeSipayPayment,
} from "../controllers/paymentController";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post("/iyzico/initialize", asyncHandler(initializePayment));
router.post("/iyzico/callback", express.urlencoded({ extended: true }), asyncHandler(handlePaymentCallback));

// Sipay
router.post("/sipay/initialize", asyncHandler(initializeSipayPayment));
router.post("/sipay/callback", express.urlencoded({ extended: true }), asyncHandler(handleSipayCallback));
router.get("/sipay/callback", asyncHandler(handleSipayCallback));

export default router;
