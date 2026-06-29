"use client";

import { useEffect, useState } from "react";
import { adminApi, type ContactMessage } from "@/lib/adminApi";
import { formatDate } from "@/lib/format";

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .messages()
      .then(setMessages)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function toggleRead(id: string) {
    try {
      const updated = await adminApi.toggleMessageRead(id);
      setMessages((prev) => prev.map((m) => (m.id === id ? updated : m)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Güncellenemedi.");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy">İletişim Mesajları</h1>
      <p className="mt-1 text-sm text-slate-500">{messages.length} mesaj</p>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-slate-400">Yükleniyor...</p>
        ) : messages.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
            Henüz mesaj yok.
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`card ${m.isRead ? "opacity-70" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-brand-navy">
                    {m.fullName}
                    {!m.isRead ? (
                      <span className="ml-2 rounded-full bg-brand-blue px-2 py-0.5 text-xs font-medium text-white">
                        Yeni
                      </span>
                    ) : null}
                  </p>
                  <p className="text-sm text-slate-500">
                    {m.email} · {m.phone}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">{formatDate(m.createdAt)}</p>
                  <button
                    onClick={() => toggleRead(m.id)}
                    className="mt-1 text-xs font-medium text-brand-blue hover:underline"
                  >
                    {m.isRead ? "Okunmadı yap" : "Okundu yap"}
                  </button>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-slate-600">{m.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
