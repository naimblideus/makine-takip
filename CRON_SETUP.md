# Cron Kurulumu (Prod) — Telemetri & Alarm & Tahsilat Otomasyonu

Cron endpoint'leri auth middleware'inden muaftır (`src/proxy.ts` → `api/cron`) ve
kendilerini `?key=$CRON_SECRET` ile korur. Prod'da bunları **dış bir zamanlayıcı**
tetiklemelidir; aksi halde telemetri toplanmaz, alarmlar gitmez, hakediş doğrulanamaz.

## 0) Önce: güçlü bir CRON_SECRET ayarla (zorunlu)

`.env` (prod):
```
CRON_SECRET="<openssl rand -hex 32 ile üretilmiş güçlü değer>"
NEXT_PUBLIC_APP_URL="https://uygulama-adresiniz"
```
> Not: `?key=dev` fallback'i yalnızca geliştirme içindir; prod'da CRON_SECRET tanımlı olmalı.

## 1) Coolify / DigitalOcean droplet — sistem crontab

Sunucuda `crontab -e` ile ekleyin (APP ve KEY'i kendinize göre düzenleyin):

```cron
APP="https://uygulama-adresiniz"
KEY="BURAYA_CRON_SECRET"

# Motor oturumları (telemetri) — her 5 dk
*/5 * * * *  curl -fsS "$APP/api/cron/engine-sessions?key=$KEY" >/dev/null 2>&1
# Geofence ihlal kontrolü — her 5 dk
*/5 * * * *  curl -fsS "$APP/api/cron/geofence-check?key=$KEY" >/dev/null 2>&1
# Yakıt hırsızlığı — her 30 dk
*/30 * * * * curl -fsS "$APP/api/cron/fuel-check?key=$KEY" >/dev/null 2>&1
# Bakım/sigorta/muayene/belge uyarıları — günde 1 (08:00)
0 8 * * *    curl -fsS "$APP/api/cron/alerts?key=$KEY" >/dev/null 2>&1
# Patron günlük WhatsApp/SMS özeti — her akşam 19:00
0 19 * * *   curl -fsS "$APP/api/cron/daily-summary?key=$KEY" >/dev/null 2>&1
# Vadesi geçen faturalar → GECIKTI + gecikme faizi — günde 1 (07:30)
30 7 * * *   curl -fsS "$APP/api/cron/payment-overdue?key=$KEY" >/dev/null 2>&1
# Müşteriye ödeme hatırlatması (vade-3gün / vade-geçti) — günde 1 (09:00)
0 9 * * *    curl -fsS "$APP/api/cron/payment-reminder?key=$KEY" >/dev/null 2>&1
```

> Coolify "Scheduled Tasks" özelliğini de kullanabilirsiniz: her görev için yukarıdaki
> `curl` komutunu ve cron ifadesini girin.

## 2) Alternatif — Vercel (eğer Vercel'e taşınırsa)

`vercel.json` içindeki `crons` tanımı kullanılır; ancak Vercel cron'ları sorgu parametresi
yerine `Authorization` başlığı gönderir — route'ların bu başlığı da kabul etmesi gerekir
(şu an `?key=` bekleniyor). Coolify/sistem-cron önerilen yoldur.

## 3) Alternatif — ücretsiz dış servis

cron-job.org gibi bir servise yukarıdaki URL'leri ekleyip ilgili aralıklarla çağırtabilirsiniz.

## Doğrulama
```
curl "https://uygulama-adresiniz/api/cron/daily-summary?key=$CRON_SECRET"
# {"success":true,...} dönmeli
```
