"use client";

import { useState } from "react";
import { adminApi } from "@/lib/adminApi";

export default function AdminPasswordPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [sentTo, setSentTo] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function sendCode() {
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const { sentTo } = await adminApi.requestPasswordCode();
      setSentTo(sentTo);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kod gönderilemedi.");
    } finally {
      setSending(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!/^\d{6}$/.test(code)) return setError("Onay kodu 6 haneli olmalıdır.");
    if (newPassword.length < 8) return setError("Yeni şifre en az 8 karakter olmalıdır.");
    if (newPassword !== confirm) return setError("Şifreler eşleşmiyor.");

    setSaving(true);
    try {
      await adminApi.changePassword(code, newPassword);
      setSuccess("Şifreniz başarıyla değiştirildi. Bir sonraki girişte yeni şifrenizi kullanın.");
      setStep(1);
      setCode("");
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
        Güvenlik için, kayıtlı iletişim e-postanıza gönderilen onay kodunu doğruladıktan sonra yeni şifrenizi
        belirleyebilirsiniz.
      </p>

      <div className="card mt-6 space-y-4">
        {step === 1 ? (
          <>
            <p className="text-sm text-slate-600">
              Onay kodu, sitenin <span className="font-semibold">iletişim e-postasına</span> gönderilecektir.
            </p>
            <button
              onClick={sendCode}
              disabled={sending}
              className="rounded-full bg-brand-blue px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-blue-dark disabled:opacity-60"
            >
              {sending ? "Gönderiliyor..." : "Onay Kodu Gönder"}
            </button>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="rounded-lg bg-blue-50 p-3 text-xs text-brand-blue">
              Onay kodu <span className="font-semibold">{sentTo}</span> adresine gönderildi. (10 dakika geçerli)
            </p>
            <label className="block text-sm font-medium text-slate-700">
              Onay Kodu (6 haneli)
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                className="input mt-1 tracking-[0.4em]"
                placeholder="______"
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
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-brand-blue px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-blue-dark disabled:opacity-60"
              >
                {saving ? "Kaydediliyor..." : "Şifreyi Değiştir"}
              </button>
              <button
                type="button"
                onClick={sendCode}
                disabled={sending}
                className="text-sm text-slate-500 underline hover:text-slate-700"
              >
                Kodu tekrar gönder
              </button>
            </div>
          </form>
        )}

        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
        {success ? <p className="text-sm font-medium text-green-600">{success}</p> : null}
      </div>
    </div>
  );
}
