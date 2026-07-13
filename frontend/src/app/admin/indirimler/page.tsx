"use client";

import { useEffect, useState } from "react";
import { adminApi, type Promotion } from "@/lib/adminApi";

const TYPE_INFO: Record<string, { title: string; desc: string }> = {
  MOBILE: { title: "Mobil indirimi", desc: "Mobil cihazdan rezervasyon yapan kullanıcılara uygulanır." },
  WELCOME: { title: "Hoşgeldin indirimi", desc: "Siteden kiralama yapan ilk N müşteriye uygulanır." },
  LAST_MINUTE: { title: "Son dakika indirimi", desc: "Giriş tarihine belirtilen günden az kala yapılan rezervasyonlara uygulanır." },
};

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [form, setForm] = useState({ label: "", percentage: "10", startDate: "", endDate: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    adminApi
      .promotions()
      .then(setPromotions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const builtins = promotions.filter((p) => p.type !== "DATE_RANGE");
  const dateRanges = promotions.filter((p) => p.type === "DATE_RANGE");

  function patch(id: string, updated: Promotion) {
    setPromotions((prev) => prev.map((p) => (p.id === id ? updated : p)));
  }

  async function save(id: string, body: Partial<Promotion>) {
    setBusy(id);
    setError(null);
    try {
      const updated = await adminApi.updatePromotion(id, body);
      patch(id, updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Güncellenemedi.");
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Bu kampanyayı silmek istediğinize emin misiniz?")) return;
    setBusy(id);
    try {
      await adminApi.deletePromotion(id);
      setPromotions((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Silinemedi.");
    } finally {
      setBusy(null);
    }
  }

  async function createDateRange(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const pct = Number(form.percentage);
    if (form.label.trim().length < 2) return setFormError("Kampanya adı girin.");
    if (!(pct >= 1 && pct <= 100)) return setFormError("Yüzde 1-100 arasında olmalı.");
    if (!form.startDate || !form.endDate) return setFormError("Başlangıç ve bitiş tarihi seçin.");
    if (form.endDate < form.startDate) return setFormError("Bitiş tarihi başlangıçtan önce olamaz.");

    setCreating(true);
    try {
      const created = await adminApi.createPromotion({
        label: form.label.trim(),
        percentage: pct,
        startDate: form.startDate,
        endDate: form.endDate,
      });
      setPromotions((prev) => [...prev, created]);
      setForm({ label: "", percentage: "10", startDate: "", endDate: "" });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Oluşturulamadı.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-brand-navy">İndirimler & Kampanyalar</h1>
      <p className="mt-1 text-sm text-slate-500">
        İndirimler ödeme sayfasında müşteriye gösterilir ve toplanarak uygulanır. Buradan açıp kapatabilir, oranlarını değiştirebilirsiniz.
      </p>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <p className="mt-6 text-slate-400">Yükleniyor...</p>
      ) : (
        <>
          <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-400">Yerleşik indirimler</h2>
          <div className="mt-3 space-y-3">
            {builtins.map((p) => {
              const info = TYPE_INFO[p.type] ?? { title: p.label, desc: "" };
              return (
                <div key={p.id} className={`card ${p.isActive ? "" : "opacity-60"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-brand-navy">
                        {info.title}
                        {!p.isActive ? (
                          <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                            Kapalı
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">{info.desc}</p>
                    </div>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={p.isActive}
                        disabled={busy === p.id}
                        onChange={(e) => save(p.id, { isActive: e.target.checked })}
                        className="h-4 w-4 accent-brand-blue"
                      />
                      {p.isActive ? "Aktif" : "Pasif"}
                    </label>
                  </div>

                  <div className="mt-3 flex flex-wrap items-end gap-3">
                    <NumberField
                      label="İndirim (%)"
                      value={p.percentage}
                      min={1}
                      max={100}
                      disabled={busy === p.id}
                      onCommit={(v) => save(p.id, { percentage: v })}
                    />
                    {p.type === "WELCOME" ? (
                      <NumberField
                        label="İlk kaç müşteri"
                        value={p.maxRedemptions ?? 3}
                        min={1}
                        max={1000}
                        disabled={busy === p.id}
                        onCommit={(v) => save(p.id, { maxRedemptions: v })}
                      />
                    ) : null}
                    {p.type === "LAST_MINUTE" ? (
                      <NumberField
                        label="Kaç gün kala"
                        value={p.daysBefore ?? 10}
                        min={1}
                        max={365}
                        disabled={busy === p.id}
                        onCommit={(v) => save(p.id, { daysBefore: v })}
                      />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Tarih aralığına özel kampanyalar
          </h2>

          <form onSubmit={createDateRange} className="card mt-3">
            <p className="font-semibold text-brand-navy">Yeni kampanya ekle</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Kampanya adı
                <input
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="Örn. Bayram kampanyası"
                  className="input mt-1"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                İndirim (%)
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={form.percentage}
                  onChange={(e) => setForm((f) => ({ ...f, percentage: e.target.value }))}
                  className="input mt-1"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Başlangıç tarihi
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="input mt-1"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Bitiş tarihi
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  className="input mt-1"
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Giriş tarihi bu aralıkta olan rezervasyonlara uygulanır.
            </p>
            {formError ? <p className="mt-2 text-sm text-red-600">{formError}</p> : null}
            <button
              type="submit"
              disabled={creating}
              className="mt-3 rounded-full bg-brand-navy px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-blue disabled:opacity-60"
            >
              {creating ? "Ekleniyor..." : "Kampanya Ekle"}
            </button>
          </form>

          <div className="mt-3 space-y-3">
            {dateRanges.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
                Henüz tarih aralığı kampanyası yok.
              </p>
            ) : (
              dateRanges.map((p) => (
                <div key={p.id} className={`card ${p.isActive ? "" : "opacity-60"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-brand-navy">
                        {p.label} <span className="text-brand-blue">%{p.percentage}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {p.startDate?.slice(0, 10)} → {p.endDate?.slice(0, 10)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={p.isActive}
                          disabled={busy === p.id}
                          onChange={(e) => save(p.id, { isActive: e.target.checked })}
                          className="h-4 w-4 accent-brand-blue"
                        />
                        {p.isActive ? "Aktif" : "Pasif"}
                      </label>
                      <button
                        onClick={() => remove(p.id)}
                        disabled={busy === p.id}
                        className="font-medium text-red-600 hover:underline disabled:opacity-50"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  disabled,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onCommit: (v: number) => void;
}) {
  const [local, setLocal] = useState(String(value));
  // Üst bileşen değeri güncellediğinde (kaydetme sonrası) input'u eşitle.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setLocal(String(value)), [value]);

  function commit() {
    const n = Number(local);
    if (n >= min && n <= max && n !== value) onCommit(n);
    else setLocal(String(value));
  }

  return (
    <label className="block text-xs font-medium text-slate-600">
      {label}
      <input
        type="number"
        min={min}
        max={max}
        value={local}
        disabled={disabled}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className="input mt-1 w-28"
      />
    </label>
  );
}
