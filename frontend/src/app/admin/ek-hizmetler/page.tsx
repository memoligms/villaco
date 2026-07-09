"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import type { ExtraService } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

interface EditState {
  id: string | null; // null => yeni kayıt
  name: string;
  description: string;
  price: string;
  isActive: boolean;
}

const EMPTY: EditState = { id: null, name: "", description: "", price: "", isActive: true };

export default function AdminExtraServicesPage() {
  const [services, setServices] = useState<ExtraService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    adminApi
      .extraServices()
      .then(setServices)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function save() {
    if (!edit) return;
    if (edit.name.trim().length < 2) {
      setError("Hizmet adı en az 2 karakter olmalı.");
      return;
    }
    const priceNum = Number(edit.price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setError("Geçerli bir fiyat girin.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: edit.name.trim(),
        description: edit.description.trim() || null,
        price: priceNum,
        isActive: edit.isActive,
      };
      if (edit.id) {
        await adminApi.updateExtraService(edit.id, payload);
      } else {
        await adminApi.createExtraService(payload);
      }
      setEdit(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(s: ExtraService) {
    setBusyId(s.id);
    try {
      await adminApi.updateExtraService(s.id, { isActive: !s.isActive });
      setServices((prev) => prev.map((x) => (x.id === s.id ? { ...x, isActive: !x.isActive } : x)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Güncellenemedi.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(s: ExtraService) {
    if (!confirm(`"${s.name}" hizmetini silmek istediğinize emin misiniz?`)) return;
    setBusyId(s.id);
    setError(null);
    try {
      await adminApi.deleteExtraService(s.id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Silinemedi.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Ek Hizmetler</h1>
          <p className="mt-1 text-sm text-slate-500">{services.length} hizmet</p>
        </div>
        <button
          onClick={() => {
            setEdit({ ...EMPTY });
            setError(null);
          }}
          className="rounded-full bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-blue-dark"
        >
          + Yeni Hizmet
        </button>
      </div>

      <p className="mt-2 text-xs text-slate-400">
        Not: Hizmet adı/açıklaması Türkçe (baz) içeriktir; EN/DE/RU çevirileri seed üzerinden yönetilir.
      </p>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-slate-400">Yükleniyor...</p>
        ) : services.length === 0 ? (
          <p className="text-slate-400">Henüz ek hizmet yok.</p>
        ) : (
          services.map((s) => (
            <div
              key={s.id}
              className={`card flex flex-wrap items-center justify-between gap-3 ${
                s.isActive ? "" : "opacity-60"
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-brand-navy">{s.name}</span>
                  {!s.isActive && (
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">Pasif</span>
                  )}
                </div>
                {s.description ? <p className="mt-0.5 text-sm text-slate-500">{s.description}</p> : null}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-brand-blue">{formatCurrency(s.price)}</span>
                <button
                  onClick={() => toggleActive(s)}
                  disabled={busyId === s.id}
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                >
                  {s.isActive ? "Pasife Al" : "Aktif Et"}
                </button>
                <button
                  onClick={() =>
                    setEdit({
                      id: s.id,
                      name: s.name,
                      description: s.description ?? "",
                      price: String(s.price),
                      isActive: s.isActive,
                    })
                  }
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                >
                  Düzenle
                </button>
                <button
                  onClick={() => remove(s)}
                  disabled={busyId === s.id}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  Sil
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {edit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setEdit(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-brand-navy">
              {edit.id ? "Hizmeti Düzenle" : "Yeni Hizmet"}
            </h2>
            <div className="mt-4 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Hizmet Adı
                <input
                  value={edit.name}
                  onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                  className="input mt-1"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Açıklama
                <textarea
                  rows={3}
                  value={edit.description}
                  onChange={(e) => setEdit({ ...edit, description: e.target.value })}
                  className="input mt-1 resize-none"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Fiyat (₺)
                <input
                  type="number"
                  min={0}
                  value={edit.price}
                  onChange={(e) => setEdit({ ...edit, price: e.target.value })}
                  className="input mt-1"
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={edit.isActive}
                  onChange={(e) => setEdit({ ...edit, isActive: e.target.checked })}
                />
                Aktif (rezervasyonda seçilebilir)
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setEdit(null)}
                className="rounded-full px-5 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100"
              >
                İptal
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="rounded-full bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-blue-dark disabled:opacity-60"
              >
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
