import type { ApiResponse, ExtraService, Reservation, Villa } from "./types";

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
