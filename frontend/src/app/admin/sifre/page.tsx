"use client";

import { useState } from "react";
import { adminApi } from "@/lib/adminApi";

export default function AdminPasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!currentPassword) return setError("Mevcut şifreyi girin.");
    if (newPassword.length < 8) return setError("Yeni şifre en az 8 karakter olmalıdır.");
    if (newPassword !== confirm) return setError("Yeni şifreler eşleşmiyor.");

    setSaving(true);
    try {
      await adminApi.changePassword(currentPassword, newPassword);
      setSuccess("Şifreniz başarıyla değiştirildi. Bir sonraki girişte yeni şifrenizi kullanın.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Şifre değiştirilemedi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold text-brand-navy">Şifre Değiştir</h1>
      <p className="mt-1 text-sm text-slate-500">
        Mevcut şifrenizi girerek yeni bir şifre belirleyebilirsiniz.
      </p>

      <form onSubmit={submit} className="card mt-6 space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          Mevcut Şifre
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="input mt-1"
            autoComplete="current-password"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Yeni Şifre
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input mt-1"
            autoComplete="new-password"
          />
          <span className="mt-1 block text-xs text-slate-400">En az 8 karakter.</span>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Yeni Şifre (Tekrar)
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="input mt-1"
            autoComplete="new-password"
          />
        </label>

        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
        {success ? <p className="text-sm font-medium text-green-600">{success}</p> : null}

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-brand-blue px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-blue-dark disabled:opacity-60"
        >
          {saving ? "Kaydediliyor..." : "Şifreyi Değiştir"}
        </button>
      </form>
    </div>
  );
}
