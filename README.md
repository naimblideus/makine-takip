# 🏗️ Makine Takip

**İş makinesi kiralama firmaları için GPS-doğrulamalı filo & hakediş yönetim sistemi.**

Çok-kiracılı (multi-tenant) SaaS. Asıl değer (wedge): **puantaj saati ile gerçek motor (ignition) saatini karşılaştırıp tartışmalı saatleri yakalar** → GPS-kanıtlı hakediş → dijital imza → e-fatura → tahsilat. Tek tartışmalı saat sahada 2.000–4.500 TL'dir; sistem kendini ilk ayda öder.

![CI](https://github.com/naimblideus/makine-takip/actions/workflows/ci.yml/badge.svg)

---

## ✨ Modüller

- **Filo & GPS** — canlı harita, motor/çalışma saati, geofence, yakıt hırsızlığı & rölanti tespiti (Traccar)
- **GPS-doğrulamalı Hakediş** — beyan vs. motor saati farkı, müşteri portalı + dijital imza + itirazsız kanıt paketi (PDF)
- **Nakit motoru** — Hakediş → e-Fatura (GİB) → tahsilat; gecikme faizi + otomatik hatırlatma
- **Hızlı Teklif (Quote)** funnel · QR makine kartı · churn erken-uyarı
- **Kiralama Borsası** (iki-taraflı pazar) — talep/RFQ + çoklu teklif, escrow ödeme, iki-taraflı puan, sponsorlu ilan, platform gelir paneli
- **Abonelik & faturalama** — makine-başı 3 paket (Temel/Pro/Platform) + eklenti + yıllık indirim
- **Operatör PWA**, ISG ceza-kalkanı, amortisman & makine-başı kârlılık, çoklu-bayi

## 🧱 Teknoloji

Next.js 16 (App Router, Turbopack, React Compiler) · TypeScript · Prisma 6 + PostgreSQL · NextAuth v5 (JWT) · @react-pdf/renderer · Recharts · Zod · Vitest · Docker (standalone)

## 🚀 Hızlı Başlangıç

```bash
npm ci --legacy-peer-deps
cp .env.example .env          # DATABASE_URL + AUTH_SECRET doldur
npx prisma db push            # şemayı uygula (migration yok)
npm run seed                  # demo veri
npm run dev                   # http://localhost:3000
```

**Demo giriş:** `admin@yildizmakine.com` / `123456` · **Süper admin:** `super@makinetakip.app` / `123456`

## 📜 Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Production build (standalone) |
| `npm test` | Birim testleri (Vitest) |
| `npm run seed` | Demo verisi yükle |

## 🔌 Entegrasyonlar

Tüm dış servisler **mock-fallback** adaptör desenindedir: ilgili `.env` anahtarı yoksa sistem mock modda akar (gönderim yapmaz), anahtar girilince canlıya geçer. Uygulamada **Entegrasyonlar** ekranından her birini tek tıkla test edebilirsiniz.

| Servis | Env | Sağlayıcı |
|---|---|---|
| GPS / Telemetri | `TRACCAR_URL/USERNAME/PASSWORD` | Traccar |
| SMS | `NETGSM_USERCODE/PASSWORD/MSGHEADER` | NetGSM |
| E-posta | `RESEND_API_KEY`, `MAIL_FROM` | Resend |
| WhatsApp | `WHATSAPP_TOKEN/PHONE_ID` | Meta Cloud API |
| e-Fatura | `EFATURA_PROVIDER/API_KEY/USERNAME` | Nilvera / Paraşüt |
| Online tahsilat | `IYZICO_API_KEY/SECRET/URI` | iyzico (Checkout Form) |

## 🔒 Mimari ilkeler

- **Tenant izolasyonu** — her sorgu `tenantId` ile filtrelenir; cron'lar tenant döngüsüyle çalışır.
- **Para güvenliği** — tüm hesaplar `lib/calc.ts` (`toMoney`/`taxOf`) ile kuruş-temiz; tutarlar sunucuda hesaplanır.
- **Girdi doğrulama** — yazma uçları Zod (`lib/schemas.ts`) ile sertleştirilmiştir.
- **Dürüstlük ilkesi** — motor (ignition) saati **gerçek/doğrulanmış**; donanım yokken idle/yakıt **"tahmini"** etiketlenir, asla "saniye-hassas" diye satılmaz. Gerçek GPS donanımıyla "ölçülmüş"e döner.

## ☁️ Deploy

Coolify @ Docker. Ayrıntılı adımlar, ortam değişkenleri ve canlı entegrasyon sırası için **[DEPLOY.md](DEPLOY.md)** ve cron kurulumu için **[CRON_SETUP.md](CRON_SETUP.md)**. Sağlık kontrolü: `GET /api/health`.

---

© Makine Takip — tüm hakları saklıdır.
