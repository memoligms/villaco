import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteChrome } from "@/components/SiteChrome";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { CurrencyProvider } from "@/lib/i18n/CurrencyContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Yalıkavak Villa | Bodrum'da Özel Villa Konaklama",
  description: "Yalıkavak'ta turizm konaklama onaylı özel villamızda güvenli ve şeffaf rezervasyon deneyimi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-brand-navy">
        <LanguageProvider>
          <CurrencyProvider>
            <SiteChrome>{children}</SiteChrome>
          </CurrencyProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
