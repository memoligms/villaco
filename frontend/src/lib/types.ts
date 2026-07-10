export interface Villa {
  id: string;
  name: string;
  slug: string;
  description: string;
  location: string;
  address: string;
  maxGuest: number;
  baseNightlyPrice: string;
  cleaningFee: string;
  depositFee: string;
  images: string[];
  amenities: string[];
  isActive: boolean;
}

export interface ExtraService {
  id: string;
  name: string;
  description?: string | null;
  price: string;
  isActive: boolean;
}

export type PaymentStatus = "PENDING" | "PAID" | "FAILED";
export type ReservationStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "FAILED";

export interface ReservationExtraService {
  id: string;
  quantity: number;
  totalPrice: string;
  extraService: ExtraService;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface Reservation {
  id: string;
  reservationCode: string;
  userId: string;
  user: User;
  villaId: string;
  villa: Villa;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  nightCount: number;
  nightlyPrice: string;
  cleaningFee: string;
  depositFee: string;
  totalPrice: string;
  note?: string | null;
  guests?: { gender: "male" | "female"; firstName: string; lastName: string }[] | null;
  paymentStatus: PaymentStatus;
  reservationStatus: ReservationStatus;
  extraServices: ReservationExtraService[];
  payment?: {
    status: PaymentStatus;
  } | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: { path: string; message: string }[];
}
