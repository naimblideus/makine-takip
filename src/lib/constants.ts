import { MachineStatus, MachineType, type Role } from '@prisma/client'

// ─── Makine Tipleri ──────────────────────────────────────
export const MACHINE_TYPE_LABELS: Record<MachineType, string> = {
    FORKLIFT: 'Forklift',
    EKSAVATOR: 'Ekskavatör',
    VINC: 'Vinç',
    DOZER: 'Dozer',
    KEPCE: 'Kepçe',
    GREYDER: 'Greyder',
    SILINDIR: 'Silindir',
    KAMYON: 'Kamyon',
    BEKO_LODER: 'Beko Loder',
    DIGER: 'Diğer',
}

// ─── Makine Durumları ────────────────────────────────────
export const MACHINE_STATUS_LABELS: Record<MachineStatus, string> = {
    MUSAIT: 'Müsait',
    KIRADA: 'Kirada',
    BAKIMDA: 'Bakımda',
    ARIZALI: 'Arızalı',
}

export const MACHINE_STATUS_COLORS: Record<MachineStatus, { bg: string; text: string; dot: string }> = {
    MUSAIT: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    KIRADA: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
    BAKIMDA: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    ARIZALI: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
}

// ─── Roller ──────────────────────────────────────────────
export const ROLE_LABELS: Record<Role, string> = {
    ADMIN: 'Yönetici',
    PERSONEL: 'Personel',
    MUHASEBE: 'Muhasebe',
}

// ─── Kiralama Durumları ──────────────────────────────────
export const RENTAL_STATUS_LABELS = {
    AKTIF: 'Aktif',
    TAMAMLANDI: 'Tamamlandı',
    IPTAL: 'İptal',
}

export const RENTAL_STATUS_COLORS = {
    AKTIF: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
    TAMAMLANDI: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    IPTAL: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
}

export const RENTAL_PERIOD_LABELS = {
    SAATLIK: 'Saatlik',
    GUNLUK: 'Günlük',
    HAFTALIK: 'Haftalık',
    AYLIK: 'Aylık',
}

// ─── Ödeme Yöntemleri ────────────────────────────────────
export const PAYMENT_METHOD_LABELS = {
    NAKIT: 'Nakit',
    KREDI_KARTI: 'Kredi Kartı',
    HAVALE_EFT: 'Havale / EFT',
    CEK: 'Çek',
    SENET: 'Senet',
}

// ─── Bakım Tipleri ───────────────────────────────────────
export const MAINTENANCE_TYPE_LABELS = {
    YAG_DEGISIMI: 'Yağ Değişimi',
    FILTRE: 'Filtre Değişimi',
    GENEL_BAKIM: 'Genel Bakım',
    REVIZYON: 'Revizyon',
    LASTIK: 'Lastik',
    DIGER: 'Diğer',
}

// Bakım tiplerine göre önerilen saat aralıkları
export const MAINTENANCE_INTERVALS: Record<string, number> = {
    YAG_DEGISIMI: 250,
    FILTRE: 500,
    GENEL_BAKIM: 500,
    REVIZYON: 2000,
    LASTIK: 1500,
    DIGER: 500,
}

// ─── Fatura Durumları ────────────────────────────────────
export const INVOICE_STATUS_LABELS = {
    TASLAK: 'Taslak',
    ONAYLANDI: 'Onaylandı',
    ODENDI: 'Ödendi',
    KISMI_ODENDI: 'Kısmi Ödendi',
    GECIKTI: 'Gecikti',
    IPTAL: 'İptal',
}

export const INVOICE_STATUS_COLORS = {
    TASLAK: { bg: 'bg-slate-50', text: 'text-slate-600' },
    ONAYLANDI: { bg: 'bg-blue-50', text: 'text-blue-700' },
    ODENDI: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    KISMI_ODENDI: { bg: 'bg-amber-50', text: 'text-amber-700' },
    GECIKTI: { bg: 'bg-red-50', text: 'text-red-700' },
    IPTAL: { bg: 'bg-red-50', text: 'text-red-400' },
}

// ─── Yakıt Seviyeleri ────────────────────────────────────
export const FUEL_LEVEL_LABELS = {
    TAM: 'Tam',
    YARI: 'Yarı',
    CEYREK: 'Çeyrek',
    BOS: 'Boş',
}

// ─── Puantaj Tipleri ─────────────────────────────────────
export const TIMESHEET_TYPE_LABELS = {
    NORMAL: 'Normal Mesai',
    FAZLA_MESAI: 'Fazla Mesai',
    RESMI_TATIL: 'Resmi Tatil',
}

// ─── GPS Eylem Etiketleri ────────────────────────────────
export const GPS_ACTION_LABELS: Record<string, string> = {
    ENGINE_STOP: 'Motor Durdurma',
    ENGINE_START: 'Motor Başlatma',
    SPEED_ALERT: 'Hız İhlali',
    GEOFENCE_BREACH: 'Geofence İhlali',
    FUEL_THEFT_ALERT: 'Yakıt Hırsızlığı',
    UNAUTHORIZED_USE: 'Yetkisiz Kullanım',
    IDLE_ALERT: 'Boşta Çalışma',
}

// ─── Bildirim Tipi Etiketleri ────────────────────────────
export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
    BAKIM_YAKLASIYOR: 'Bakım Yaklaşıyor',
    BAKIM_GECIKTI: 'Bakım Gecikti',
    SIGORTA_DOLACAK: 'Sigorta Dolacak',
    MUAYENE_DOLACAK: 'Muayene Dolacak',
    YAKIT_HIRSIZLIGI: 'Yakıt Hırsızlığı',
    GEOFENCE_IHLALI: 'Geofence İhlali',
    YETKISIZ_KULLANIM: 'Yetkisiz Kullanım',
    HIZ_IHLALI: 'Hız İhlali',
    BOSTA_CALISIYOR: 'Boşta Çalışıyor',
    MOTOR_DURDU: 'Motor Durduruldu',
    OPERATOR_BELGESI_DOLACAK: 'Operatör Belgesi',
}

export const NOTIFICATION_TYPE_ICONS: Record<string, string> = {
    BAKIM_YAKLASIYOR: '🔧',
    BAKIM_GECIKTI: '⚠️',
    SIGORTA_DOLACAK: '📋',
    MUAYENE_DOLACAK: '📋',
    YAKIT_HIRSIZLIGI: '⛽',
    GEOFENCE_IHLALI: '📐',
    YETKISIZ_KULLANIM: '🚨',
    HIZ_IHLALI: '⚡',
    BOSTA_CALISIYOR: '💤',
    MOTOR_DURDU: '🛑',
    OPERATOR_BELGESI_DOLACAK: '👷',
}

// ─── Sidebar Navigasyon ──────────────────────────────────
export const NAV_ITEMS = [
    { href: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
    { href: '/takip', label: 'Canlı Takip', icon: 'MapPin' },
    { href: '/makineler', label: 'Makineler', icon: 'Truck' },
    { href: '/operatorler', label: 'Operatörler', icon: 'HardHat' },
    { href: '/musteriler', label: 'Müşteriler', icon: 'Users' },
    { href: '/santiyeler', label: 'Şantiyeler', icon: 'Building2' },
    { href: '/kiralamalar', label: 'Kiralamalar', icon: 'CalendarRange' },
    { href: '/geofence', label: 'Geofence', icon: 'Hexagon' },
    { href: '/yakit', label: 'Yakıt Takibi', icon: 'Fuel' },
    { href: '/bakim', label: 'Bakım Takibi', icon: 'Wrench' },
    { href: '/puantaj', label: 'Puantaj', icon: 'ClipboardList' },
    { href: '/faturalar', label: 'Faturalar', icon: 'Receipt' },
    { href: '/odemeler', label: 'Ödemeler', icon: 'CreditCard' },
    { href: '/raporlar', label: 'Raporlar', icon: 'BarChart3' },
    { href: '/ayarlar', label: 'Ayarlar', icon: 'Settings' },
]
