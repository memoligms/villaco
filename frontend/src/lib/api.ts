import type { ApiResponse, ExtraService, Reservation, Villa } from "./types";
import type { ActivePromotions } from "./discounts";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";
export const VILLA_SLUG = "yalikavak-villa";

export class ApiError extends Error {
  errors?: { path: string; message: string }[];

  constructor(message: string, errors?: { path: string; message: string }[]) {
    super(message);
    this.name = "ApiError";
    this.errors = errors;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = (await res.json()) as ApiResponse<T>;

  if (!res.ok || !body.success) {
    throw new ApiError(body.message ?? "Bir hata oluştu.", body.errors);
  }

  return body.data as T;
}

export function getVilla(lang?: string): Promise<Villa> {
  const q = lang && lang !== "tr" ? `?lang=${lang}` : "";
  return request<Villa>(`/villas/${VILLA_SLUG}${q}`, { cache: "no-store" });
}

export function getUnavailableDates(): Promise<string[]> {
  return request<string[]>("/reservations/unavailable", { cache: "no-store" });
}

export function getExtraServices(lang?: string): Promise<ExtraService[]> {
  const q = lang && lang !== "tr" ? `?lang=${lang}` : "";
  return request<ExtraService[]>(`/extra-services${q}`, { cache: "no-store" });
}

export interface GuestInput {
  gender: "male" | "female";
  firstName: string;
  lastName: string;
}

export interface CreateReservationPayload {
  checkIn: string;
  checkOut: string;
  guestCount: number;
  fullName: string;
  email: string;
  phone: string;
  note?: string;
  currency?: string;
  guests?: GuestInput[];
  extraServiceIds?: { id: string; quantity: number }[];
}

export function createReservation(payload: CreateReservationPayload): Promise<Reservation> {
  return request<Reservation>("/reservations/create", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getReservation(idOrCode: string): Promise<Reservation> {
  return request<Reservation>(`/reservations/${idOrCode}`, { cache: "no-store" });
}

export interface ReservationLookup {
  reservationCode: string;
  guestName: string;
  villaName: string;
  checkIn: string;
  checkOut: string;
  nightCount: number;
  guestCount: number;
  totalPrice: string;
  reservationStatus: string;
  paymentStatus: string;
  payable: boolean;
}

export function lookupReservation(reservationCode: string, email: string): Promise<ReservationLookup> {
  return request<ReservationLookup>("/reservations/lookup", {
    method: "POST",
    body: JSON.stringify({ reservationCode, email }),
  });
}

export interface InitiatePaymentResult {
  checkoutFormContent?: string;
  paymentPageUrl?: string;
  token?: string;
}

export function initializePayment(reservationCode: string): Promise<InitiatePaymentResult> {
  return request<InitiatePaymentResult>("/payments/iyzico/initialize", {
    method: "POST",
    body: JSON.stringify({ reservationCode }),
  });
}

export interface SipayCardInput {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
}

export function initializeSipayPayment(
  reservationCode: string,
  card: SipayCardInput
): Promise<{ html: string }> {
  return request<{ html: string }>("/payments/sipay/initialize", {
    method: "POST",
    body: JSON.stringify({ reservationCode, card }),
  });
}

export interface ContactPayload {
  fullName: string;
  email: string;
  phone: string;
  message: string;
}

export function submitContact(payload: ContactPayload): Promise<{ message: string }> {
  return request<{ message: string }>("/contact", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  reply?: string | null;
  repliedAt?: string | null;
  createdAt: string;
}

export function getReviews(): Promise<Review[]> {
  return request<Review[]>("/reviews", { cache: "no-store" });
}

export function getActivePromotions(): Promise<ActivePromotions> {
  return request<ActivePromotions>("/promotions/active", { cache: "no-store" });
}

export interface StayRule {
  id: string;
  label: string;
  minNights: number;
  startDate: string;
  endDate: string;
}

export interface StayRulesResponse {
  defaultMinNights: number;
  rules: StayRule[];
}

export function getStayRules(): Promise<StayRulesResponse> {
  return request<StayRulesResponse>("/stay-rules", { cache: "no-store" });
}

export interface CreateReviewPayload {
  name: string;
  email: string;
  rating: number;
  comment: string;
}

export function submitReview(
  payload: CreateReviewPayload
): Promise<{ message: string; review: Review }> {
  return request<{ message: string; review: Review }>("/reviews", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
