// ─── Paketleme & GTM tek kaynağı (pure data — client-safe, prisma YOK) ───────
// Satış/pazarlama yüzeyleri (public /fiyatlar + /abonelik eklenti bölümü) buradan beslenir.
// NOT: per-makine fiyatlar billing kaynağı subscription.ts PLANS ile SENKRON tutulmalı.

export const YEARLY_DISCOUNT = 0.15 // yıllık peşinde %15

export interface Package {
    key: 'TEMEL' | 'PRO' | 'PLATFORM'
    name: string
    pricePerMachine: number     // ₺ / makine / ay
    machineLimit: number
    tagline: string
    recommended?: boolean
    features: string[]
}

// OMURGA — 3 paket (à la carte değil; iyi-daha iyi-en iyi)
export const PACKAGES: Package[] = [
    {
        key: 'TEMEL',
        name: 'Temel — Takip',
        pricePerMachine: 1000,
        machineLimit: 15,
        tagline: 'Nerede, ne kadar çalıştı, ne zaman bakım — temel görünürlük.',
        features: [
            'GPS konum & canlı harita',
            'Motor / çalışma saati takibi',
            'Bakım, sigorta, muayene uyarıları',
            'Temel raporlar & mobil erişim',
        ],
    },
    {
        key: 'PRO',
        name: 'Pro — Operasyon',
        pricePerMachine: 2000,
        machineLimit: 60,
        tagline: 'GPS-doğrulamalı hakediş: tartışmalı her saati paraya çevir.',
        recommended: true,
        features: [
            'Temel paketin tümü',
            '★ GPS-doğrulamalı hakediş / puantaj',
            'Yakıt hırsızlığı & rölanti tespiti',
            'Müşteri portalı + dijital imza + kanıt paketi',
            'Hızlı teklif (Quote) → kiralama funnel',
            'Operatör skoru & performans',
        ],
    },
    {
        key: 'PLATFORM',
        name: 'Platform — Tam',
        pricePerMachine: 3000,
        machineLimit: 100000,
        tagline: 'Hakediş → e-Fatura → tahsilat tam otomasyon + AI.',
        features: [
            'Pro paketin tümü',
            'e-Fatura / GİB entegrasyonu',
            'Hakediş → fatura → tahsilat otomasyonu',
            'Çoklu-şantiye konsolidasyon',
            'Amortisman & makine başı kârlılık',
            'AI öneriler + öncelikli destek',
        ],
    },
]

// EKLENTİLER — her pakete opsiyonel eklenebilir (omurga + katman)
export interface AddOn { key: string; name: string; price: string; unit: string; desc: string; icon: string }
export const ADD_ONS: AddOn[] = [
    { key: 'HARDWARE', name: 'GPS / Telemetri Donanımı', price: '₺350', unit: '/ makine / ay', desc: 'Cihaz + kurulum + bakım dahil (HaaS). Tek sefer satın alma: ₺7.500/cihaz.', icon: '📡' },
    { key: 'SETUP', name: 'Kurulum & Saha Eğitimi', price: '₺6.000', unit: 'tek sefer', desc: 'Veri yükleme, ekip eğitimi, ilk hakedişe kadar birebir kurulum desteği.', icon: '🛠' },
    { key: 'PRIORITY', name: 'Öncelikli 7/24 Destek', price: '₺3.000', unit: '/ ay', desc: 'WhatsApp hattı, 1 saat içinde yanıt, özel hesap yöneticisi.', icon: '⚡' },
]

// PAZAR — abonelikten BAĞIMSIZ işlem katmanı (komisyon modeli)
export const MARKETPLACE_TERMS = {
    commissionPct: 5,
    sponsoredMonthly: 500,
    headline: 'Kiralama Borsası',
    note: 'İlan vermek ücretsiz. Sadece tamamlanan kiralamadan %5 komisyon alınır. Abone olmasan da kullanırsın.',
    points: [
        'İş makineni binlerce şantiyeye aç',
        'Şantiye talebi ver, firmalar sana teklif getirsin',
        'GPS-doğrulamalı hakediş + emanet ödeme ile güvenli',
        'Sponsorlu ilan ₺500/ay — listede en üstte',
    ],
}

/** Yıllık peşin efektif aylık (indirimli) per-makine fiyatı. */
export function yearlyMonthly(pricePerMachine: number): number {
    return Math.round(pricePerMachine * (1 - YEARLY_DISCOUNT))
}

// ─── HACİM İNDİRİMİ (optimal fiyat) ──────────────────────────────────────────
// Volume pricing: ulaşılan kademenin oranı TÜM makinelere uygulanır (basit, sade).
// Küçük filodan (≤20) tam fiyat → gelir maks; büyük filoyu indirimle kazan/elde tut.
export interface VolumeTier { min: number; max: number; discount: number; label: string }
export const VOLUME_TIERS: VolumeTier[] = [
    { min: 1, max: 20, discount: 0, label: '1–20 makine' },
    { min: 21, max: 50, discount: 0.15, label: '21–50 makine' },
    { min: 51, max: Infinity, discount: 0.25, label: '51+ makine' },
]

/** Makine adedine göre hacim indirimi oranı (0, 0.15, 0.25). */
export function volumeDiscount(machineCount: number): number {
    const t = VOLUME_TIERS.find(t => machineCount >= t.min && machineCount <= t.max)
    return t ? t.discount : 0
}

/** Efektif aylık per-makine fiyat — hacim + (opsiyonel) yıllık indirim uygulanmış. */
export function effectiveMonthlyPerMachine(pricePerMachine: number, machineCount: number, yearly = false): number {
    const afterVolume = pricePerMachine * (1 - volumeDiscount(machineCount))
    return Math.round(yearly ? afterVolume * (1 - YEARLY_DISCOUNT) : afterVolume)
}
