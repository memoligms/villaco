# Villaco — Yayınlama Rehberi (VPS + Coolify)

Bu rehber, siteyi **tek bir sunucuda (VPS)**, **Coolify** paneliyle yayınlamak içindir.
Üç parça aynı sunucuda çalışır: **Frontend (Next.js)** + **Backend (Express)** + **PostgreSQL**.

```
Sunucu (VPS) ── Coolify paneli
 ├── PostgreSQL (veritabanı)
 ├── Backend  (Express API)  → api.alanadiniz.com
 └── Frontend (Next.js)      → alanadiniz.com
```

> Bu repodaki `backend/Dockerfile` ve `frontend/Dockerfile` Coolify tarafından sunucuda otomatik derlenir. Senin elle bir şey derlemen gerekmez.

---

## Adım 0 — Repoyu GitHub'a gönder

Coolify, kodu GitHub'dan çeker. Önce repoyu GitHub'a yükle (GitHub Desktop ile: *Add local repository* → klasörü seç → *Publish repository*, **Private** önerilir).

---

## Adım 1 — VPS kirala

- [hetzner.com/cloud](https://www.hetzner.com/cloud) → hesap aç → **Add Server**
  - Konum: **Almanya** (Türkiye'ye yakın)
  - İmaj: **Ubuntu 24.04**
  - Tip: **CX22** (2 vCPU / 4 GB RAM) ≈ €4.5/ay
- Oluştur → sana bir **IP adresi** ve **root şifresi** verilir.

> Türk bir firmadan da olur; şartlar: **VPS (paylaşımlı hosting değil)**, root/SSH erişimi, ≥4 GB RAM, Ubuntu, Docker kurulabilir.

---

## Adım 2 — Coolify'ı kur

Sunucuya SSH ile bağlan (Windows'ta PowerShell):
```bash
ssh root@SUNUCU_IP
```
Sonra tek komutla Coolify'ı kur:
```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```
Kurulum bitince tarayıcıdan **`http://SUNUCU_IP:8000`** adresine git, ilk yönetici hesabını oluştur.

---

## Adım 3 — Proje + PostgreSQL oluştur

1. Coolify'da **+ New** → **Project** → ad: `villaco`.
2. İçinde **+ New Resource** → **Database** → **PostgreSQL** seç → oluştur.
3. Veritabanı açılınca Coolify sana bir **Internal Connection URL** verir
   (örn. `postgres://postgres:xxx@<host>:5432/postgres`). Bunu kopyala — backend'de kullanacağız.

---

## Adım 4 — Backend servisi (Express API)

1. **+ New Resource** → **Application** → kaynağı **GitHub repo** olarak seç (Coolify'ı GitHub'a bağla).
2. Ayarlar:
   - **Build Pack:** `Dockerfile`
   - **Base Directory:** `/backend`
   - **Port (Ports Exposes):** `4000`
3. **Environment Variables** (aşağıdaki tabloyu kullan):
   ```
   NODE_ENV=production
   PORT=4000
   DATABASE_URL=<Adım 3'teki PostgreSQL URL>
   CORS_ORIGIN=https://alanadiniz.com
   FRONTEND_BASE_URL=https://alanadiniz.com
   BACKEND_BASE_URL=https://api.alanadiniz.com
   IYZICO_API_KEY=<iyzico production api key>
   IYZICO_SECRET_KEY=<iyzico production secret key>
   IYZICO_BASE_URL=https://api.iyzipay.com
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=<güçlü şifre>
   JWT_SECRET=<openssl rand -hex 32 çıktısı>
   ADMIN_TOKEN_TTL=12h
   ```
4. **Persistent Storage** (foto yüklemeleri kaybolmasın diye):
   - **+ Add** → Mount Path: `/app/public/uploads`
5. **Domains:** `https://api.alanadiniz.com`
6. **Deploy** et.
7. İlk deploy başarılıysa, bir kez veri yükle: Coolify'da backend servisi → **Terminal / Execute Command** →
   ```bash
   npm run seed
   ```
   (Villa + 5 ek hizmeti TR/EN/DE/RU çevirileriyle ekler. Migration'lar her başlangıçta otomatik uygulanır.)

---

## Adım 5 — Frontend servisi (Next.js)

1. **+ New Resource** → **Application** → aynı GitHub repo.
2. Ayarlar:
   - **Build Pack:** `Dockerfile`
   - **Base Directory:** `/frontend`
   - **Port:** `3000`
3. **Build Variable (build-time!):**
   ```
   NEXT_PUBLIC_API_BASE_URL=https://api.alanadiniz.com/api
   ```
   > Bu değişken **build sırasında** koda gömülür; Coolify'da "Build Variable / Build Time" olarak işaretli olmalı. `/api` ekini unutma.
4. **Domains:** `https://alanadiniz.com`
5. **Deploy** et.

---

## Adım 6 — Domain / DNS (Natro)

Natro panelinde alan adının **DNS** ayarlarına gir, iki **A kaydı** ekle (her ikisi de sunucu IP'sine):

| Tip | Ad (Host) | Değer (IP) |
| --- | --- | --- |
| A | `@` | SUNUCU_IP |
| A | `api` | SUNUCU_IP |
| A | `www` | SUNUCU_IP (opsiyonel) |

DNS yayılması birkaç dakika–saat sürebilir. Coolify, domain bağlı servisler için **SSL/HTTPS sertifikasını otomatik** alır (Let's Encrypt).

---

## Adım 7 — Kontrol

- `https://alanadiniz.com` → site açılıyor mu?
- `https://api.alanadiniz.com/api/health` → `{"success":true,"status":"ok"}` dönüyor mu?
- Bir test rezervasyonu + admin paneli (`/admin/login`) girişi.
- iyzico **production** anahtarlarıyla gerçek/küçük bir test ödemesi.

---

## Ortam Değişkenleri Özeti

| Değişken | Nerede | Değer |
| --- | --- | --- |
| `DATABASE_URL` | Backend | Coolify PostgreSQL internal URL |
| `CORS_ORIGIN` | Backend | `https://alanadiniz.com` |
| `FRONTEND_BASE_URL` | Backend | `https://alanadiniz.com` |
| `BACKEND_BASE_URL` | Backend | `https://api.alanadiniz.com` |
| `IYZICO_API_KEY` / `IYZICO_SECRET_KEY` | Backend | iyzico **production** anahtarları |
| `IYZICO_BASE_URL` | Backend | `https://api.iyzipay.com` |
| `ADMIN_PASSWORD` | Backend | Güçlü şifre |
| `JWT_SECRET` | Backend | `openssl rand -hex 32` |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend (**build-time**) | `https://api.alanadiniz.com/api` |

> Bu değerler GitHub'a gitmez (`.env` gitignore'da). Hepsi yalnızca Coolify panelinde tutulur.

---

## Güncelleme (sonraki değişiklikler)

Koda her değişiklik yapıp GitHub'a push ettiğinde, Coolify'da ilgili servise **Redeploy** dersin (veya otomatik deploy'u açarsan kendi günceller). Veritabanı şeması değiştiyse migration'lar başlangıçta otomatik uygulanır.
