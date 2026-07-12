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
    baseNightlyPrice: number;
    cleaningFee: number;
    depositFee: number;
    amenities: string[];
    images: string[];
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
  deleteImage(url: string) {
    return request<{ url: string }>("/admin/upload", { method: "DELETE", body: JSON.stringify({ url }) });
  },
  requestPasswordCode() {
    return request<{ sentTo: string }>("/admin/password/request-code", { method: "POST" });
  },
  changePassword(code: string, newPassword: string) {
    return request<{ message: string }>("/admin/password/change", {
      method: "POST",
      body: JSON.stringify({ code, newPassword }),
    });
  },
};
