"use client";

import type { ApiResponse, ExtraService, Reservation, Villa } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";
const TOKEN_KEY = "villaco_admin_token";

export class AdminApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
  }
}

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init?: RequestInit, auth = true): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(init?.headers as Record<string, string>) };
  if (auth) {
    const token = getAdminToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, cache: "no-store" });
  const body = (await res.json().catch(() => ({}))) as ApiResponse<T>;

  if (res.status === 401) {
    clearAdminToken();
    throw new AdminApiError(body.message ?? "Oturum gerekli.", 401);
  }
  if (!res.ok || !body.success) {
    throw new AdminApiError(body.message ?? "Bir hata oluştu.", res.status);
  }
  return body.data as T;
}

export interface AdminStats {
  reservations: { total: number; confirmed: number; pending: number; cancelled: number };
  revenue: number;
  messages: { unread: number; total: number };
  recentReservations: Array<Reservation & { user: { fullName: string; email: string } }>;
}

export interface ContactMessage {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Promotion {
  id: string;
  type: "MOBILE" | "WELCOME" | "LAST_MINUTE" | "DATE_RANGE" | "WEEKLY" | "MONTHLY" | string;
  label: string;
  percentage: number;
  isActive: boolean;
  maxRedemptions: number | null;
  daysBefore: number | null;
  minNights: number | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export interface StayRule {
  id: string;
  label: string;
  minNights: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface EmailSettings {
  senderName: string;
  fromEmail: string;
  adminEmails: string;
  notifyNewReservation: boolean;
  notifyApproved: boolean;
  notifyRejected: boolean;
  notifyPaymentSuccess: boolean;
  notifyPaymentFailed: boolean;
  notifyCancelled: boolean;
  smtpConfigured?: boolean;
}

export interface EmailLog {
  id: string;
  toAddress: string;
  subject: string;
  type: string;
  status: string;
  error: string | null;
  createdAt: string;
}

export interface AdminReview {
  id: string;
  name: string;
  email: string;
  rating: number;
  comment: string;
  isVisible: boolean;
  reservationCode: string | null;
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
}

export const adminApi = {
  login(username: string, password: string) {
    return request<{ token: string; username: string }>(
      "/admin/login",
      { method: "POST", body: JSON.stringify({ username, password }) },
      false
    );
  },
  stats() {
    return request<AdminStats>("/admin/stats");
  },
  reservations(params?: { status?: string; from?: string; to?: string }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.from) qs.set("from", params.from);
    if (params?.to) qs.set("to", params.to);
    const q = qs.toString();
    return request<Reservation[]>(`/admin/reservations${q ? `?${q}` : ""}`);
  },
  reservation(id: string) {
    return request<Reservation>(`/admin/reservations/${id}`);
  },
  updateReservation(id: string, body: { reservationStatus?: string; paymentStatus?: string }) {
    return request<Reservation>(`/admin/reservations/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  },
  approveReservation(id: string) {
    return request<Reservation>(`/admin/reservations/${id}/approve`, { method: "PATCH" });
  },
  rejectReservation(id: string) {
    return request<Reservation>(`/admin/reservations/${id}/reject`, { method: "PATCH" });
  },
  messages() {
    return request<ContactMessage[]>("/admin/messages");
  },
  toggleMessageRead(id: string) {
    return request<ContactMessage>(`/admin/messages/${id}/toggle-read`, { method: "PATCH" });
  },
  villa() {
    return request<Villa>("/admin/villa");
  },
  updateVilla(body: Partial<{
    name: string;
    description: string;
    location: string;
    address: string;
    contactEmail: string;
    contactPhone: string;
    maxGuest: number;
    defaultMinNights: number;
    baseNightlyPrice: number;
    cleaningFee: number;
    depositFee: number;
    amenities: string[];
    images: string[];
    videos: string[];
    isActive: boolean;
  }>) {
    return request<Villa>("/admin/villa", { method: "PATCH", body: JSON.stringify(body) });
  },
  extraServices() {
    return request<ExtraService[]>("/admin/extra-services");
  },
  createExtraService(body: { name: string; description?: string | null; price: number; isActive?: boolean }) {
    return request<ExtraService>("/admin/extra-services", { method: "POST", body: JSON.stringify(body) });
  },
  updateExtraService(
    id: string,
    body: Partial<{ name: string; description: string | null; price: number; isActive: boolean }>
  ) {
    return request<ExtraService>(`/admin/extra-services/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  },
  deleteExtraService(id: string) {
    return request<{ id: string }>(`/admin/extra-services/${id}`, { method: "DELETE" });
  },
  async uploadImage(file: File): Promise<{ url: string }> {
    const token = getAdminToken();
    const fd = new FormData();
    fd.append("image", file);
    const res = await fetch(`${API_BASE_URL}/admin/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: fd,
      cache: "no-store",
    });
    const body = (await res.json().catch(() => ({}))) as ApiResponse<{ url: string }>;
    if (res.status === 401) {
      clearAdminToken();
      throw new AdminApiError(body.message ?? "Oturum gerekli.", 401);
    }
    if (!res.ok || !body.success) {
      throw new AdminApiError(body.message ?? "Görsel yüklenemedi.", res.status);
    }
    return body.data as { url: string };
  },
  async uploadVideo(file: File): Promise<{ url: string }> {
    const token = getAdminToken();
    const fd = new FormData();
    fd.append("video", file);
    const res = await fetch(`${API_BASE_URL}/admin/upload-video`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: fd,
      cache: "no-store",
    });
    const body = (await res.json().catch(() => ({}))) as ApiResponse<{ url: string }>;
    if (res.status === 401) {
      clearAdminToken();
      throw new AdminApiError(body.message ?? "Oturum gerekli.", 401);
    }
    if (!res.ok || !body.success) {
      throw new AdminApiError(body.message ?? "Video yüklenemedi.", res.status);
    }
    return body.data as { url: string };
  },
  deleteImage(url: string) {
    return request<{ url: string }>("/admin/upload", { method: "DELETE", body: JSON.stringify({ url }) });
  },
  changePassword(currentPassword: string, newPassword: string) {
    return request<{ message: string }>("/admin/password/change", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
  promotions() {
    return request<Promotion[]>("/admin/promotions");
  },
  updatePromotion(
    id: string,
    body: Partial<{
      label: string;
      percentage: number;
      isActive: boolean;
      maxRedemptions: number | null;
      daysBefore: number | null;
      minNights: number | null;
    }>
  ) {
    return request<Promotion>(`/admin/promotions/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  },
  createPromotion(body: { label: string; percentage: number; startDate: string; endDate: string }) {
    return request<Promotion>("/admin/promotions", { method: "POST", body: JSON.stringify(body) });
  },
  deletePromotion(id: string) {
    return request<{ id: string }>(`/admin/promotions/${id}`, { method: "DELETE" });
  },
  stayRules() {
    return request<StayRule[]>("/admin/stay-rules");
  },
  createStayRule(body: { label: string; minNights: number; startDate: string; endDate: string }) {
    return request<StayRule>("/admin/stay-rules", { method: "POST", body: JSON.stringify(body) });
  },
  updateStayRule(
    id: string,
    body: Partial<{ label: string; minNights: number; startDate: string; endDate: string }>
  ) {
    return request<StayRule>(`/admin/stay-rules/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  },
  deleteStayRule(id: string) {
    return request<{ id: string }>(`/admin/stay-rules/${id}`, { method: "DELETE" });
  },
  emailSettings() {
    return request<EmailSettings>("/admin/email-settings");
  },
  updateEmailSettings(body: Partial<Omit<EmailSettings, "smtpConfigured" | "updatedAt" | "id">>) {
    return request<EmailSettings>("/admin/email-settings", { method: "PATCH", body: JSON.stringify(body) });
  },
  sendTestEmail() {
    return request<{ sentTo: string[] }>("/admin/email-settings/test", { method: "POST" });
  },
  emailLogs() {
    return request<EmailLog[]>("/admin/email-logs");
  },
  reviews() {
    return request<AdminReview[]>("/admin/reviews");
  },
  toggleReviewVisibility(id: string) {
    return request<AdminReview>(`/admin/reviews/${id}/toggle-visibility`, { method: "PATCH" });
  },
  replyReview(id: string, reply: string) {
    return request<AdminReview>(`/admin/reviews/${id}/reply`, {
      method: "PATCH",
      body: JSON.stringify({ reply }),
    });
  },
  deleteReview(id: string) {
    return request<{ id: string }>(`/admin/reviews/${id}`, { method: "DELETE" });
  },
  blockedDates() {
    return request<string[]>("/admin/blocked-dates");
  },
  toggleBlockedDate(date: string) {
    return request<{ date: string; blocked: boolean }>("/admin/blocked-dates/toggle", {
      method: "POST",
      body: JSON.stringify({ date }),
    });
  },
};
