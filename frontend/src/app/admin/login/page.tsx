"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi, AdminApiError, setAdminToken } from "@/lib/adminApi";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token } = await adminApi.login(username.trim(), password);
      setAdminToken(token);
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Giriş yapılamadı.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm">
        <div className="mb-6 text-center">
          <Image
            src="/brand-dark.png"
            alt="Yalıkavak Villa"
            width={760}
            height={124}
            className="mx-auto h-7 w-auto"
          />
          <h1 className="mt-4 text-xl font-bold text-brand-navy">Admin Girişi</h1>
          <p className="mt-1 text-sm text-slate-500">Yönetim Paneli</p>
        </div>

        <label className="block text-sm font-medium text-slate-700">
          Kullanıcı Adı
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input mt-1"
            autoComplete="username"
          />
        </label>

        <label className="mt-3 block text-sm font-medium text-slate-700">
          Şifre
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input mt-1"
            autoComplete="current-password"
          />
        </label>

        {error ? <p className="mt-3 text-sm font-medium text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-full bg-brand-blue px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-blue-dark disabled:opacity-60"
        >
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>
      </form>
    </div>
  );
}
