"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, type AdminStats } from "@/lib/adminApi";
import { formatCurrency, formatDate } from "@/lib/format";

const statusLabels: Record<string, string> = {
  PENDING: "Beklemede",
  AWAITING_APPROVAL: "Onay Bekliyor",
  APPROVED: "Onaylandı (ödeme bekliyor)",
  CONFIRMED: "Ödendi",
  REJECTED: "Reddedildi",
  CANCELLED: "İptal",
  FAILED: "Başarısız",
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi.stats().then(setStats).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!stats) return <p className="text-slate-400">Yükleniyor...</p>;

  const cards = [
    { label: "Toplam (onay bekleyen + ödenmiş)", value: stats.reservations.total, accent: "text-brand-navy" },
    { label: "Ödenmiş", value: stats.reservations.confirmed, accent: "text-green-600" },
    { label: "Onay Bekleyen", value: stats.reservations.pending, accent: "text-blue-600" },
    { label: "Toplam Gelir", value: formatCurrency(stats.revenue), accent: "text-brand-blue" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">Genel durum özeti</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card">
            <p className="text-xs uppercase tracking-wide text-slate-400">{c.label}</p>
            <p className={`mt-2 text-2xl font-bold ${c.accent}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Link href="/admin/mesajlar" className="card transition hover:shadow-md">
          <p className="text-xs uppercase tracking-wide text-slate-400">Okunmamış Mesaj</p>
          <p className="mt-2 text-2xl font-bold text-brand-navy">
            {stats.messages.unread}
            <span className="ml-1 text-sm font-normal text-slate-400">/ {stats.messages.total}</span>
          </p>
        </Link>
        <div className="card lg:col-span-2">
          <p className="text-xs uppercase tracking-wide text-slate-400">İptal Edilen</p>
          <p className="mt-2 text-2xl font-bold text-red-600">{stats.reservations.cancelled}</p>
        </div>
      </div>

      <h2 className="mt-10 text-lg font-bold text-brand-navy">Son Rezervasyonlar</h2>
      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Kod</th>
              <th className="px-4 py-3">Misafir</th>
              <th className="px-4 py-3">Giriş</th>
              <th className="px-4 py-3">Tutar</th>
              <th className="px-4 py-3">Durum</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentReservations.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Henüz rezervasyon yok.
                </td>
              </tr>
            ) : (
              stats.recentReservations.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-brand-navy">{r.reservationCode}</td>
                  <td className="px-4 py-3 text-slate-600">{r.user?.fullName}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(r.checkIn)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(r.totalPrice)}</td>
                  <td className="px-4 py-3 text-slate-600">{statusLabels[r.reservationStatus] ?? r.reservationStatus}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
