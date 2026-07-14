"use client";

import { useEffect, useState } from "react";
import { adminApi, type EmailSettings, type EmailLog } from "@/lib/adminApi";
import { formatDate } from "@/lib/format";

const TOGGLES: { key: keyof EmailSettings; label: string; desc: string }[] = [
  { key: "notifyNewReservation", label: "Yeni rezervasyon (yönetici)", desc: "Yeni talep geldiğinde yönetici adreslerine." },
  { key: "notifyApproved", label: "Onay maili (misafir)", desc: "Rezervasyon onaylandığında misafire ödeme linki." },
  { key: "notifyRejected", label: "Red maili (misafir)", desc: "Rezervasyon reddedildiğinde misafire." },
  { key: "notifyPaymentSuccess", label: "Ödeme başarılı (misafir + yönetici)", desc: "Ödeme tamamlandığında." },
  { key: "notifyPaymentFailed", label: "Ödeme başarısız (misafir + yönetici)", desc: "Ödeme başarısız olduğunda." },
  { key: "notifyCancelled", label: "İptal maili (misafir + yönetici)", desc: "Rezervasyon iptal edildiğinde." },
];

const TYPE_LABELS: Record<string, string> = {
  NEW_RESERVATION: "Yeni rezervasyon",
  APPROVED: "Onay",
  REJECTED: "Red",
  PAYMENT_SUCCESS: "Ödeme başarılı",
  PAYMENT_FAILED: "Ödeme başarısız",
  CANCELLED: "İptal",
  TEST: "Test",
};

export default function AdminEmailPage() {
  const [form, setForm] = useState<EmailSettings | null>(null);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  function load() {
    Promise.all([adminApi.emailSettings(), adminApi.emailLogs()])
      .then(([s, l]) => {
        setForm(s);
        setLogs(l);
      })
      .catch((e) => setMsg({ type: "err", text: e.message }))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function update<K extends keyof EmailSettings>(key: K, value: EmailSettings[K]) {
    setForm((p) => (p ? { ...p, [key]: value } : p));
    setMsg(null);
  }

  async function save() {
    if (!form) return;
    setSaving(true);
    setMsg(null);
    try {
      const updated = await adminApi.updateEmailSettings({
        senderName: form.senderName,
        fromEmail: form.fromEmail,
        adminEmails: form.adminEmails,
        notifyNewReservation: form.notifyNewReservation,
        notifyApproved: form.notifyApproved,
        notifyRejected: form.notifyRejected,
        notifyPaymentSuccess: form.notifyPaymentSuccess,
        notifyPaymentFailed: form.notifyPaymentFailed,
        notifyCancelled: form.notifyCancelled,
      });
      setForm({ ...updated, smtpConfigured: form.smtpConfigured });
      setMsg({ type: "ok", text: "Ayarlar kaydedildi." });
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Kaydedilemedi." });
    } finally {
      setSaving(false);
    }
  }

  async function sendTest() {
    setTesting(true);
    setMsg(null);
    try {
      const { sentTo } = await adminApi.sendTestEmail();
      setMsg({ type: "ok", text: `Test e-postası gönderildi: ${sentTo.join(", ")}` });
      adminApi.emailLogs().then(setLogs).catch(() => {});
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Test gönderilemedi." });
    } finally {
      setTesting(false);
    }
  }

  if (loading) return <p className="text-slate-400">Yükleniyor...</p>;
  if (!form) return <p className="text-red-600">{msg?.text ?? "Ayarlar yüklenemedi."}</p>;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-brand-navy">E-posta Bildirimleri</h1>
      <p className="mt-1 text-sm text-slate-500">
        Rezervasyon oluşturma, onay, red, ödeme ve iptal olaylarında otomatik gönderilen e-postaları buradan yönetin.
      </p>

      {form.smtpConfigured === false ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          ⚠️ SMTP sunucu ayarları eksik. E-postalar gönderilemez. (Sunucu ortam değişkenleri: SMTP_HOST, SMTP_USER, SMTP_PASS)
        </p>
      ) : (
        <p className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          ✅ SMTP bağlantısı yapılandırılmış — e-postalar aktif.
        </p>
      )}

      {msg ? (
        <p className={`mt-3 text-sm font-medium ${msg.type === "ok" ? "text-green-600" : "text-red-600"}`}>{msg.text}</p>
      ) : null}

      {/* Gönderen ayarları */}
      <section className="card mt-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Gönderen Ayarları</h2>
        <label className="block text-sm font-medium text-slate-700">
          Gönderen Adı
          <input value={form.senderName} onChange={(e) => update("senderName", e.target.value)} className="input mt-1" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Gönderen E-posta
          <input value={form.fromEmail} onChange={(e) => update("fromEmail", e.target.value)} className="input mt-1" />
          <span className="mt-1 block text-xs text-slate-400">SMTP hesabıyla aynı olması teslimat için önerilir.</span>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Yönetici Bildirim Adresleri
          <textarea
            rows={2}
            value={form.adminEmails}
            onChange={(e) => update("adminEmails", e.target.value)}
            placeholder="ornek1@mail.com, ornek2@mail.com"
            className="input mt-1 resize-none"
          />
          <span className="mt-1 block text-xs text-slate-400">Virgül veya yeni satır ile birden fazla adres ekleyebilirsiniz.</span>
        </label>
      </section>

      {/* Bildirim türleri */}
      <section className="card mt-4 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Otomatik Bildirimler</h2>
        {TOGGLES.map((t) => (
          <label key={t.key} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
            <span>
              <span className="block text-sm font-medium text-slate-700">{t.label}</span>
              <span className="block text-xs text-slate-400">{t.desc}</span>
            </span>
            <input
              type="checkbox"
              checked={Boolean(form[t.key])}
              onChange={(e) => update(t.key, e.target.checked as EmailSettings[typeof t.key])}
              className="mt-1 h-5 w-5 shrink-0 accent-brand-blue"
            />
          </label>
        ))}
      </section>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-full bg-brand-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-blue-dark disabled:opacity-60"
        >
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
        <button
          onClick={sendTest}
          disabled={testing}
          className="rounded-full border border-slate-300 px-6 py-2.5 text-sm font-semibold text-brand-navy transition hover:border-brand-blue hover:text-brand-blue disabled:opacity-60"
        >
          {testing ? "Gönderiliyor..." : "Test E-postası Gönder"}
        </button>
      </div>

      {/* Gönderim geçmişi */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Gönderim Geçmişi (son 100)</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Tarih</th>
                <th className="px-4 py-2.5">Tür</th>
                <th className="px-4 py-2.5">Alıcı</th>
                <th className="px-4 py-2.5">Durum</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">Henüz gönderim yok.</td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="border-t border-slate-100 align-top">
                    <td className="px-4 py-2.5 text-slate-500">{formatDate(l.createdAt)}</td>
                    <td className="px-4 py-2.5 text-slate-700">{TYPE_LABELS[l.type] ?? l.type}</td>
                    <td className="px-4 py-2.5 text-slate-600">{l.toAddress}</td>
                    <td className="px-4 py-2.5">
                      {l.status === "SENT" ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Gönderildi</span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700" title={l.error ?? ""}>
                          Başarısız
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
