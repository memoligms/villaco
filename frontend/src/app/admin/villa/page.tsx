"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import type { Villa } from "@/lib/types";

interface FormState {
  name: string;
  location: string;
  address: string;
  description: string;
  maxGuest: string;
  baseNightlyPrice: string;
  cleaningFee: string;
  depositFee: string;
  isActive: boolean;
  amenities: string[];
  images: string[];
}

export default function AdminVillaSettingsPage() {
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newAmenity, setNewAmenity] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    adminApi
      .villa()
      .then((v: Villa) =>
        setForm({
          name: v.name,
          location: v.location,
          address: v.address ?? "",
          description: v.description,
          maxGuest: String(v.maxGuest),
          baseNightlyPrice: String(v.baseNightlyPrice),
          cleaningFee: String(v.cleaningFee),
          depositFee: String(v.depositFee),
          isActive: v.isActive,
          amenities: v.amenities ?? [],
          images: v.images ?? [],
        })
      )
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSuccess(false);
  }

  function addAmenity() {
    const v = newAmenity.trim();
    if (!v || !form) return;
    update("amenities", [...form.amenities, v]);
    setNewAmenity("");
  }

  function removeAmenity(i: number) {
    if (!form) return;
    update(
      "amenities",
      form.amenities.filter((_, idx) => idx !== i)
    );
  }

  function moveImage(i: number, dir: -1 | 1) {
    if (!form) return;
    const next = [...form.images];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    update("images", next);
  }

  async function removeImage(i: number) {
    if (!form) return;
    const url = form.images[i];
    update(
      "images",
      form.images.filter((_, idx) => idx !== i)
    );
    // Sunucuya yüklenmiş dosyaysa diskten de sil (public görseller atlanır).
    if (url.includes("/uploads/")) {
      try {
        await adminApi.deleteImage(url);
      } catch {
        /* dosya zaten yoksa sorun değil */
      }
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0 || !form) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const { url } = await adminApi.uploadImage(file);
        uploaded.push(url);
      }
      update("images", [...form.images, ...uploaded]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Görsel yüklenemedi.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await adminApi.updateVilla({
        name: form.name.trim(),
        location: form.location.trim(),
        address: form.address.trim(),
        description: form.description.trim(),
        maxGuest: Number(form.maxGuest),
        baseNightlyPrice: Number(form.baseNightlyPrice),
        cleaningFee: Number(form.cleaningFee),
        depositFee: Number(form.depositFee),
        amenities: form.amenities,
        images: form.images,
        isActive: form.isActive,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-slate-400">Yükleniyor...</p>;
  if (!form) return <p className="text-red-600">{error ?? "Villa bilgisi yüklenemedi."}</p>;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-brand-navy">Villa Ayarları</h1>
      <p className="mt-1 text-sm text-slate-500">
        Fiyatlandırma, genel bilgiler, özellikler ve galeri görsellerini düzenleyin.
        <br />
        <span className="text-xs text-slate-400">
          Not: Metin alanları Türkçe (baz) içeriktir; EN/DE/RU çevirileri seed üzerinden yönetilir.
        </span>
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Genel bilgiler */}
        <section className="card space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Genel Bilgiler</h2>
          <Field label="Villa Adı">
            <input value={form.name} onChange={(e) => update("name", e.target.value)} className="input" />
          </Field>
          <Field label="Konum (kısa)">
            <input value={form.location} onChange={(e) => update("location", e.target.value)} className="input" />
          </Field>
          <Field label="Adres">
            <textarea
              rows={2}
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              className="input resize-none"
            />
          </Field>
          <Field label="Açıklama">
            <textarea
              rows={5}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              className="input resize-none"
            />
          </Field>
        </section>

        {/* Fiyatlandırma */}
        <section className="card space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Fiyatlandırma & Kapasite</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Maks. Misafir">
              <input
                type="number"
                min={1}
                value={form.maxGuest}
                onChange={(e) => update("maxGuest", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Gecelik Fiyat (₺)">
              <input
                type="number"
                min={0}
                value={form.baseNightlyPrice}
                onChange={(e) => update("baseNightlyPrice", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Temizlik Ücreti (₺)">
              <input
                type="number"
                min={0}
                value={form.cleaningFee}
                onChange={(e) => update("cleaningFee", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Depozito (₺)">
              <input
                type="number"
                min={0}
                value={form.depositFee}
                onChange={(e) => update("depositFee", e.target.value)}
                className="input"
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => update("isActive", e.target.checked)}
            />
            Villa aktif (rezervasyona açık)
          </label>
        </section>

        {/* Özellikler */}
        <section className="card space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Özellikler ({form.amenities.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {form.amenities.map((a, i) => (
              <span
                key={`${a}-${i}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700"
              >
                {a}
                <button
                  type="button"
                  onClick={() => removeAmenity(i)}
                  className="text-slate-400 hover:text-red-600"
                  aria-label="Kaldır"
                >
                  ✕
                </button>
              </span>
            ))}
            {form.amenities.length === 0 && (
              <span className="text-sm text-slate-400">Henüz özellik eklenmedi.</span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={newAmenity}
              onChange={(e) => setNewAmenity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addAmenity();
                }
              }}
              placeholder="Yeni özellik (örn. Özel havuz)"
              className="input flex-1"
            />
            <button
              type="button"
              onClick={addAmenity}
              className="rounded-lg bg-slate-100 px-4 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Ekle
            </button>
          </div>
        </section>

        {/* Galeri */}
        <section className="card space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Galeri ({form.images.length})
          </h2>
          <p className="text-xs text-slate-400">
            İlk görsel kapak fotoğrafı olarak kullanılır. Sıralamayı oklarla değiştirebilirsiniz.
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {form.images.map((src, i) => (
              <div key={`${src}-${i}`} className="group relative overflow-hidden rounded-lg border border-slate-200">
                <div className="relative aspect-[4/3] bg-slate-100">
                  <Image src={src} alt={`Görsel ${i + 1}`} fill className="object-cover" unoptimized />
                </div>
                {i === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded bg-brand-blue px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    Kapak
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/50 px-1.5 py-1 opacity-0 transition group-hover:opacity-100">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveImage(i, -1)}
                      disabled={i === 0}
                      className="rounded bg-white/90 px-1.5 text-xs text-slate-700 disabled:opacity-30"
                      aria-label="Sola taşı"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(i, 1)}
                      disabled={i === form.images.length - 1}
                      className="rounded bg-white/90 px-1.5 text-xs text-slate-700 disabled:opacity-30"
                      aria-label="Sağa taşı"
                    >
                      →
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="rounded bg-red-600 px-1.5 text-xs font-medium text-white"
                    aria-label="Sil"
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}

            <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-slate-400 transition hover:border-brand-blue hover:text-brand-blue">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              {uploading ? (
                <span className="text-sm">Yükleniyor...</span>
              ) : (
                <>
                  <span className="text-2xl">+</span>
                  <span className="text-xs">Görsel Ekle</span>
                </>
              )}
            </label>
          </div>
        </section>

        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
        {success ? <p className="text-sm font-medium text-green-600">Değişiklikler kaydedildi.</p> : null}

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-brand-blue px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-blue-dark disabled:opacity-60"
        >
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}
