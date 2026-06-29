# Villaco — Villa Rezervasyon & Ödeme Sistemi

Tek villa üzerine kurulu, çok dilli (TR/EN/DE/RU) ve çok para birimli rezervasyon + ödeme sitesi.
Next.js (frontend) + Express/Prisma/PostgreSQL (backend) + iyzico ödeme entegrasyonu + admin paneli.

## Klasör Yapısı

```
villaco/
  backend/   Express API, Prisma (PostgreSQL), iyzico entegrasyonu, admin API
  frontend/  Next.js (App Router) + Tailwind CSS, i18n, admin paneli arayüzü
```

## Gereksinimler

- Node.js 18+
- PostgreSQL (yerel veya uzak bir veritabanı)
- iyzico hesabı (sandbox test key/secret veya gerçek POS bilgileri) — https://sandbox-merchant.iyzipay.com

## Backend Kurulumu

```bash
cd backend
cp .env.example .env   # DATABASE_URL, iyzico ve admin bilgilerini doldurun
npm install
npm run prisma:migrate # veritabanı şemasını oluşturur
npm run seed            # villa + ek hizmet verisini (TR/EN/DE/RU çevirili) ekler
npm run dev              # http://localhost:4000
```

### Environment Variables (backend/.env)

| Değişken | Açıklama |
| --- | --- |
| `DATABASE_URL` | PostgreSQL bağlantı dizesi |
| `CORS_ORIGIN` | Frontend'in çalıştığı tam URL (prod'da gerçek domain) |
| `IYZICO_API_KEY` / `IYZICO_SECRET_KEY` | iyzico API anahtarları (sandbox veya production) |
| `IYZICO_BASE_URL` | Sandbox: `https://sandbox-api.iyzipay.com`, Production: `https://api.iyzipay.com` |
| `FRONTEND_BASE_URL` / `BACKEND_BASE_URL` | Ödeme yönlendirmeleri için kullanılan tam URL'ler |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Admin paneli giriş bilgileri — **prod'da mutlaka değiştirin** |
| `JWT_SECRET` | Admin oturum token'ı için gizli anahtar — **prod'da mutlaka güçlü, rastgele bir değerle değiştirin** |
| `ADMIN_TOKEN_TTL` | Admin oturumunun geçerlilik süresi (örn. `12h`) |

**Gerçek ödeme altyapısına geçiş:** `IYZICO_API_KEY`, `IYZICO_SECRET_KEY` ve `IYZICO_BASE_URL` değerlerini production bilgileriyle güncellemeniz yeterlidir; kod tarafında değişiklik gerekmez. Ödemeler şu an **USD** üzerinden tahsil edilmektedir (`backend/src/services/iyzicoService.ts`).

## Frontend Kurulumu

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev   # http://localhost:3000
```

## Rezervasyon & Ödeme Akışı

1. Kullanıcı ana sayfadaki arama widget'ı veya `/villa-detaylari` sayfasından `/rezervasyon` sayfasına geçer.
2. Tarih/misafir/ek hizmet/iletişim bilgilerini girer; backend rezervasyonu `PENDING` durumunda oluşturur, fiyatı `priceCalculator.ts` ile USD üzerinden hesaplar.
3. Kullanıcı `/odeme/[reservationCode]` sayfasına yönlendirilir; burada iyzico Checkout Form başlatılır (`POST /api/payments/iyzico/initialize`).
4. iyzico ödeme sonucunu `POST /api/payments/iyzico/callback` adresine gönderir; backend `Payment` ve `Reservation` durumunu günceller.
5. Kullanıcı `/odeme/basarili` veya `/odeme/basarisiz` sayfasına yönlendirilir.

## Çok Dil & Çok Para Birimi

- Dil seçimi (`frontend/src/lib/i18n/`) `localStorage`'da saklanır; TR/EN/DE/RU arasında anında geçiş yapılır, sayfa yenilenmez.
- Villa adı/açıklaması/özellikleri ve ek hizmet adları/açıklamaları, `Villa.translations` ve `ExtraService.translations` (Json) alanlarında dil bazlı saklanır; backend `?lang=en|de|ru` parametresiyle lokalize içerik döner (parametre verilmezse Türkçe baz alan kullanılır).
- Fiyatlar her zaman **USD** olarak hesaplanır/saklanır; görüntülenen para birimi (₺/$/€/₽) seçili dile göre [open.er-api.com](https://www.exchangerate-api.com/) üzerinden çekilen canlı kurla anlık dönüştürülür (`frontend/src/lib/i18n/CurrencyContext.tsx`, 1 saat cache).
- **Not:** Admin panelinden villa/ek hizmet düzenleme arayüzü şu an yalnızca Türkçe (baz) alanları düzenler; EN/DE/RU çevirileri `backend/prisma/seed.ts` üzerinden girilir.

## Admin Paneli

- Adres: `/admin/login` (footerdaki "Yönetim" linki).
- Giriş bilgisi `.env`'deki `ADMIN_USERNAME` / `ADMIN_PASSWORD`; oturum JWT ile yönetilir (`ADMIN_TOKEN_TTL` süresiyle).
- Bölümler: Dashboard (özet istatistikler), Rezervasyonlar (durum güncelleme), Mesajlar (iletişim formu), Villa Ayarları (fiyat/kapasite/açıklama — TR baz alanlar).
- Giriş denemeleri rate-limit ile korunur (15 dakikada IP başına 10 deneme).

## Güvenlik Notları (Yayın Öncesi Kontrol Listesi)

- [ ] `backend/.env` içindeki `ADMIN_PASSWORD` değerini güçlü bir şifreyle değiştirin.
- [ ] `JWT_SECRET` değerini uzun, rastgele bir değerle değiştirin (örn. `openssl rand -hex 32`).
- [ ] `CORS_ORIGIN`, `FRONTEND_BASE_URL`, `BACKEND_BASE_URL` değerlerini gerçek domain'lerle güncelleyin.
- [ ] `IYZICO_*` değerlerini gerçek (production) iyzico bilgileriyle değiştirin.
- [ ] `NODE_ENV=production` olarak ayarlayın (reverse proxy arkasında `trust proxy` otomatik aktifleşir).
- [ ] Test/deneme verilerini (rezervasyon, mesaj, kullanıcı) temizleyin — gerçek müşteri verisi olmadan başlayın.

## Notlar

- Fiyat hesaplama mantığı `backend/src/utils/priceCalculator.ts` içinde merkezi olarak tutulur.
- Rezervasyon kodları `backend/src/utils/reservationCode.ts` ile otomatik üretilir.
- Halka açık yazma endpoint'leri (`/api/contact`, `/api/reservations/create`) ve admin login, spam/brute-force koruması için rate-limit ile sınırlıdır.
