# Makine Takip — Canlıya Çıkış (Coolify @ DigitalOcean)

Bu rehber, makine-takip'i Coolify üzerinde üretime almak için adımları, ortam
değişkenlerini ve canlı entegrasyonları içerir. Uygulama Docker (multi-stage,
Next.js standalone + Prisma) ile paketlenir; **şema senkronu boot'ta otomatik**
yapılır (`start.sh` içinde `prisma db push`).

---

## 1) Önkoşullar
- Coolify kurulu bir sunucu (servis-takip ile aynı DO droplet kullanılabilir).
- Bir PostgreSQL veritabanı (Coolify "Databases" ile oluşturulabilir veya mevcut Postgres).
- Build sırasında **bellek**: Next 16 + reactCompiler build'i RAM yiyebilir. Droplet'te
  **swap** açık olmalı (servis-takip'te yaşanan build OOM ile aynı). 1-2 GB swap yeterli.

## 2) Ortam Değişkenleri (Coolify → Environment Variables)

### Zorunlu
```
DATABASE_URL=postgresql://KULLANICI:SIFRE@HOST:5432/makine_takip
AUTH_SECRET=<openssl rand -hex 32>          # NextAuth v5 imza anahtarı (32+ bayt)
NEXTAUTH_SECRET=<AUTH_SECRET ile aynı>       # geriye uyum
NEXTAUTH_URL=https://ALAN-ADINIZ             # tam https adres
NEXT_PUBLIC_APP_URL=https://ALAN-ADINIZ
AUTH_TRUST_HOST=true
CRON_SECRET=<openssl rand -hex 32>           # cron tetikleyici sırrı (PROD'da 'dev' kapalı)
NODE_ENV=production
```

### Opsiyonel — boşsa MOCK (uygulama çalışır, sadece dış gönderim yapılmaz)
```
# SMS (NetGSM)
NETGSM_USERCODE=...
NETGSM_PASSWORD=...
NETGSM_MSGHEADER=...
# E-posta (Resend — resend.com)
RESEND_API_KEY=...
MAIL_FROM=Makine Takip <bildirim@alan-adiniz>
# WhatsApp (Meta Cloud API)
WHATSAPP_TOKEN=...
WHATSAPP_PHONE_ID=...
# e-Fatura entegratör (Nilvera / Paraşüt / Foriba)
EFATURA_PROVIDER=nilvera
EFATURA_API_KEY=...
EFATURA_USERNAME=...
# GPS (Traccar). Boşsa mock veri kullanılır.
TRACCAR_URL=...
TRACCAR_USERNAME=...
TRACCAR_PASSWORD=...
# Yakıt birim fiyatı (parasal panel) — opsiyonel, varsayılan 43
FUEL_TL_PER_LITER=43
# Pazar (Kiralama Borsası) — opsiyonel, varsayılanlar yeterli
MARKETPLACE_COMMISSION_PCT=5
MARKETPLACE_AD_FEE=500
# Online tahsilat (iyzico) — boşsa MOCK ödeme akışı
IYZICO_API_KEY=...
IYZICO_SECRET=...
IYZICO_URI=https://sandbox-api.iyzipay.com
```

> Sağlık kontrolü `/api/health` (DB ping) hem Dockerfile `HEALTHCHECK` hem Coolify
> "Health Check Path" alanına girilebilir — container hazır olunca trafik alır.

## 3) Deploy adımları (Coolify)
1. **New Resource → Application → Git repo** (veya Dockerfile-based). Branch: `main`.
2. **Build Pack: Dockerfile** (repodaki `Dockerfile` kullanılır).
3. **Port: 3000** (Dockerfile EXPOSE 3000).
4. Yukarıdaki **Environment Variables**'ı gir.
5. **Deploy**. İlk build birkaç dk sürer (Prisma generate + Next build).
6. Container açılışında `start.sh` → `prisma db push` ile şema otomatik senkronlanır.

> Not: `.dockerignore` yereldeki `node_modules`/`.next`/`.env`'i imaja sokmaz; Prisma
> Linux-musl engine'i imaj içinde üretilir (`binaryTargets` schema'da tanımlı).

## 4) İlk kurulum (deploy sonrası, BİR KEZ)
Üretim DB'si boştur (seed çalıştırılmaz — veri güvenliği). Süper admin'i oluştur:
```bash
curl -X POST https://ALAN-ADINIZ/api/setup \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@firmaniz.com","password":"GUCLU_SIFRE","name":"Yönetici"}'
```
Sonra:
- `https://ALAN-ADINIZ/login` → süper admin ile gir → **Süper Admin** panelinden ilk işletmeyi (tenant) + admin kullanıcısını oluştur, VEYA
- Müşteriler `https://ALAN-ADINIZ/signup` ile kendileri 14 günlük deneme açar.

## 5) Cron'ları kur (zorunlu — telemetri/alarm/tahsilat otomasyonu)
`CRON_SETUP.md`'deki crontab satırlarını sunucuya ekle (APP ve KEY'i doldur).
Bunlar olmadan: telemetri toplanmaz, alarmlar/hatırlatmalar gitmez, vade takibi çalışmaz.

## 6) Canlı entegrasyonları aç (sırayla)
| Öncelik | Entegrasyon | Etki |
|---|---|---|
| 1 | **NetGSM SMS + Resend e-posta** | Hakediş/teklif linki + alarm + tahsilat hatırlatma gerçekten gider |
| 2 | **e-Fatura entegratör** (Nilvera/Paraşüt) | Yasal e-belge (2026 zorunlu) |
| 3 | **Traccar + GPS donanım** (Teltonika) | idle/yakıt "tahmini" → "ölçülmüş"; wedge tam güç |
| 4 | **iyzico/sanal POS** | Online tahsilat + abonelik otomatik çekim (en son) |

## 7) Doğrulama (deploy sonrası duman testi)
```bash
curl https://ALAN-ADINIZ/api/health       # {"status":"ok","db":"up",...}  (Coolify health-check da bunu kullanır)
curl https://ALAN-ADINIZ/login            # 200
curl https://ALAN-ADINIZ/api/cron/daily-summary?key=$CRON_SECRET   # {"success":true,...}
# süper admin ile gir → makine/kiralama/hakediş → portal imza → fatura akışını gör
```

## 8) Bilinen tuzaklar
- **Build OOM** → droplet'e swap ekle.
- **AUTH_SECRET eksik** → giriş çalışmaz (servis-takip'teki login bug'ının köküyle benzer).
- **NEXTAUTH_URL yanlış** → oturum/redirect bozulur; tam https domain olmalı.
- **`?key=dev` artık prod'da çalışmaz** → cron'lar mutlaka gerçek CRON_SECRET ile çağrılmalı.
- **db push --accept-data-loss** boot'ta çalışır; şema additive olduğu sürece güvenli, yine de
  ilk prod deploy'dan önce DB yedeği al.
