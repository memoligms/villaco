"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SiteSettingsProvider } from "@/components/SiteSettingsProvider";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <SiteSettingsProvider>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </SiteSettingsProvider>
  );
}
