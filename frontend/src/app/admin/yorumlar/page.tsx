"use client";

import { useEffect, useState } from "react";
import { adminApi, type AdminReview } from "@/lib/adminApi";
import { formatDate } from "@/lib/format";

function Stars({ value }: { value: number }) {
  return (
    <span className="text-amber-400" aria-hidden>
      {"★★★★★".slice(0, value)}
      <span className="text-slate-300">{"★★★★★".slice(value)}</span>
    </span>
  );
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .reviews()
      .then(setReviews)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function toggle(id: string) {
    setBusy(id);
    try {
      const updated = await adminApi.toggleReviewVisibility(id);
      setReviews((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Güncellenemedi.");
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Bu yorumu kalıcı olarak silmek istediğinize emin misiniz?")) return;
    setBusy(id);
    try {
      await adminApi.deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Silinemedi.");
    } finally {
      setBusy(null);
    }
  }

  const visibleCount = reviews.filter((r) => r.isVisible).length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy">Müşteri Yorumları</h1>
      <p className="mt-1 text-sm text-slate-500">
        {reviews.length} yorum · {visibleCount} yayında
      </p>
      <p className="mt-1 text-xs text-slate-400">
        Yorumlar yalnızca e-postası tamamlanmış bir konaklamayla eşleşen kişilerce yazılabilir. Buradan gizleyebilir veya silebilirsiniz.
      </p>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-slate-400">Yükleniyor...</p>
        ) : reviews.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
            Henüz yorum yok.
          </p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className={`card ${r.isVisible ? "" : "opacity-60"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 font-semibold text-brand-navy">
                    <Stars value={r.rating} />
                    {r.name}
                    {!r.isVisible ? (
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                        Gizli
                      </span>
                    ) : null}
                  </p>
                  <p className="text-sm text-slate-500">
                    {r.email}
                    {r.reservationCode ? ` · ${r.reservationCode}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">{formatDate(r.createdAt)}</p>
                  <div className="mt-1 flex justify-end gap-3">
                    <button
                      onClick={() => toggle(r.id)}
                      disabled={busy === r.id}
                      className="text-xs font-medium text-brand-blue hover:underline disabled:opacity-50"
                    >
                      {r.isVisible ? "Gizle" : "Yayınla"}
                    </button>
                    <button
                      onClick={() => remove(r.id)}
                      disabled={busy === r.id}
                      className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-slate-600">{r.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
