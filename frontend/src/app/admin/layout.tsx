"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearAdminToken, getAdminToken } from "@/lib/adminApi";

const navItems = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/takvim", label: "Takvim" },
  { href: "/admin/rezervasyonlar", label: "Rezervasyonlar" },
  { href: "/admin/mesajlar", label: "Mesajlar" },
  { href: "/admin/yorumlar", label: "Yorumlar" },
  { href: "/admin/indirimler", label: "İndirimler" },
  { href: "/admin/ek-hizmetler", label: "Ek Hizmetler" },
  { href: "/admin/villa", label: "Villa Ayarları" },
  { href: "/admin/sifre", label: "Şifre Değiştir" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Client-only auth gate: token presence can't be checked during SSR.
    if (isLogin) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReady(true);
      return;
    }
    if (!getAdminToken()) {
      router.replace("/admin/login");
      return;
    }
    setReady(true);
  }, [isLogin, pathname, router]);

  if (isLogin) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-400">Yükleniyor...</div>;
  }

  function logout() {
    clearAdminToken();
    router.replace("/admin/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="flex flex-col border-r border-slate-200 bg-white lg:min-h-screen">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <Image src="/brand-dark.png" alt="Yalıkavak Villa" width={760} height={124} className="h-6 w-auto" />
        </div>
        <nav className="flex flex-1 flex-row gap-1 overflow-x-auto p-3 lg:flex-col">
          {navItems.map((item) => {
            const active = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                  active ? "bg-brand-blue text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-200 p-3">
          <Link
            href="/"
            className="block rounded-lg px-4 py-2 text-sm text-slate-500 transition hover:bg-slate-100"
          >
            ← Siteye Dön
          </Link>
          <button
            onClick={logout}
            className="mt-1 w-full rounded-lg px-4 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
          >
            Çıkış Yap
          </button>
        </div>
      </aside>

      <main className="p-5 sm:p-8">{children}</main>
    </div>
  );
}
