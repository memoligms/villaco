"use client";

import { useEffect, useState } from "react";
import { adminApi, type StayRule } from "@/lib/adminApi";

export default function AdminStayRulesPage() {
  const [rules, setRules] = useState<StayRule[]>([]);
  const [defaultMinNights, setDefaultMinNights] = useState<number>(2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [form, setForm] = useState({ label: "", minNights: "5", startDate: "", endDate: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [savingDefault, setSavingDefault] = useState(false);

  useEffect(() => {
    Promise.all([adminApi.stayRules(), adminApi.villa()])
      .then(([r, villa]) => {
        setRules(r);
        setDefaultMinNights(villa.defaultMinNights ?? 2);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function saveDefault(value: number) {
    setSavingDefault(true);
    setError(null);
    try {
      const villa = await adminApi.updateVilla({ defaultMinNights: value });
      setDefaultMinNights(villa.defaultMinNights ?? value);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kaydedilemedi.");
    } finally {
      setSavingDefault(false);
    }
  }

  async function createRule(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const mn = Number(form.minNights);
    if (form.label.trim().length < 2) return setFormError("Kural adı girin.");
    if (!(mn >= 1 && mn <= 365)) return setFormError("Gece sayısı 1-365 arasında olmalı.");
    if (!form.startDate || !form.endDate) return setFormError("Başlangıç ve bitiş tarihi seçin.");
    if (form.endDate < form.startDate) return setFormError("Bitiş tarihi başlangıçtan önce olamaz.");

    setCreating(true);
    try {
      const created = await adminApi.createStayRule({
        label: form.label.trim(),
        minNights: mn,
        startDate: form.startDate,
        endDate: form.endDate,
      });
      setRules((prev) => [...prev, created]);
      setForm({ label: "", minNights: "5", startDate: "", endDate: "" });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Oluşturulamadı.");
    } finally {
      setCreating(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Bu kuralı silmek istediğinize emin misiniz?")) return;
    setBusy(id);
    try {
      await adminApi.deleteStayRule(id);
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Silinemedi.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-brand-navy">Minimum Konaklama Kuralları</h1>
      <p className="mt-1 text-sm text-slate-500">
        Belirli tarih aralıkları için minimum gece sayısı belirleyin. Kural uymayan tarihlerde varsayılan minimum uygulanır. Müşteri minimumun altında rezervasyon yapamaz.
      </p>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <p className="mt-6 text-slate-400">Yükleniyor...</p>
      ) : (
        <>
          {/* Varsayılan */}
          <div className="card mt-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-semibold text-brand-navy">Varsayılan minimum konaklama</p>
                <p className="mt-0.5 text-xs text-slate-500">Hiçbir tarih kuralı uymadığında geçerlidir.</p>
              </div>
              <label className="text-xs font-medium text-slate-600">
                Gece
                <input
                  type="number"
                  min={1}
                  max={365}
                  defaultValue={defaultMinNights}
                  key={defaultMinNights}
                  disabled={savingDefault}
                  onBlur={(e) => {
                    const v = Number(e.target.value);
                    if (v >= 1 && v <= 365 && v !== defaultMinNights) saveDefault(v);
                  }}
                  className="input mt-1 w-24"
                />
              </label>
            </div>
          </div>

          {/* Yeni kural */}
          <form onSubmit={createRule} className="card mt-4">
            <p className="font-semibold text-brand-navy">Yeni tarih aralığı kuralı</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Kural adı
                <input
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="Örn. Yüksek sezon"
                  className="input mt-1"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Minimum gece
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={form.minNights}
                  onChange={(e) => setForm((f) => ({ ...f, minNights: e.target.value }))}
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
            <p className="mt-2 text-xs text-slate-400">Giriş tarihi bu aralıkta olan rezervasyonlara uygulanır.</p>
            {formError ? <p className="mt-2 text-sm text-red-600">{formError}</p> : null}
            <button
              type="submit"
              disabled={creating}
              className="mt-3 rounded-full bg-brand-navy px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-blue disabled:opacity-60"
            >
              {creating ? "Ekleniyor..." : "Kural Ekle"}
            </button>
          </form>

          <div className="mt-4 space-y-3">
            {rules.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
                Henüz tarih aralığı kuralı yok. Varsayılan minimum ({defaultMinNights} gece) uygulanıyor.
              </p>
            ) : (
              rules.map((r) => (
                <div key={r.id} className="card">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-brand-navy">
                        {r.label} <span className="text-brand-blue">min {r.minNights} gece</span>
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {r.startDate} → {r.endDate}
                      </p>
                    </div>
                    <button
                      onClick={() => remove(r.id)}
                      disabled={busy === r.id}
                      className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
                    >
                      Sil
                    </button>
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
