// ─── GPS Veri Analiz Fonksiyonları ─────────────────────────
// Trackunit + Topcon + Trimble yaklaşımıyla makine performans analizi

import type { MachineType } from '@prisma/client'

// ─── Tipler ─────────────────────────────────────────────

interface SessionData {
    durationMinutes: number | null
    idleMinutes: number | null
    workMinutes: number | null
    maxSpeed: number | null
    fuelConsumed: number | null
    isAuthorized: boolean
    startedAt: Date | string
    endedAt: Date | string | null
}

interface MaintenanceData {
    performedAt: Date | string
    nextMaintenanceHours: number | null
    nextMaintenanceDate: Date | string | null
    type: string
}

interface MachineData {
    totalHours: number
    insuranceExpiry: Date | string | null
    inspectionExpiry: Date | string | null
    status: string
    type: MachineType
}

interface FuelReading {
    timestamp: Date | string
    level: number // yüzde (0-100)
    engineOn: boolean
}

// ─── Boşta (Idle) Süre Hesaplama ────────────────────────

/**
 * Toplam boşta süreyi hesaplar (dakika)
 */
export function calculateIdleTime(sessions: SessionData[]): number {
    return sessions.reduce((total, s) => total + (s.idleMinutes || 0), 0)
}

/**
 * Toplam çalışma süresini hesaplar (dakika)
 */
export function calculateWorkTime(sessions: SessionData[]): number {
    return sessions.reduce((total, s) => total + (s.workMinutes || 0), 0)
}

// ─── Kullanım Oranı (Utilization Rate) ─────────────────

/**
 * Belirli bir dönemdeki kullanım oranını hesaplar
 * @returns 0-100 arası yüzde
 */
export function calculateUtilizationRate(sessions: SessionData[], periodDays: number): number {
    if (periodDays <= 0) return 0
    const totalWorkMinutes = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0)
    const totalAvailableMinutes = periodDays * 8 * 60 // 8 saatlik iş günü
    const rate = (totalWorkMinutes / totalAvailableMinutes) * 100
    return Math.min(Math.round(rate * 10) / 10, 100)
}

// ─── Yakıt Hırsızlığı Tespiti ──────────────────────────

interface FuelTheftResult {
    detected: boolean
    fuelBefore: number
    fuelAfter: number
    difference: number
    timestamp: Date | string
}

/**
 * Yakıt okumalarından hırsızlık tespiti yapar
 * Motor kapalıyken %10'dan fazla düşüş varsa alarm verir
 */
export function detectFuelTheft(readings: FuelReading[]): FuelTheftResult | null {
    if (readings.length < 2) return null

    for (let i = 1; i < readings.length; i++) {
        const prev = readings[i - 1]
        const curr = readings[i]

        // Motor kapalıyken yakıt düşüşü
        if (!curr.engineOn && !prev.engineOn) {
            const drop = prev.level - curr.level
            if (drop > 10) { // %10'dan fazla düşüş
                return {
                    detected: true,
                    fuelBefore: prev.level,
                    fuelAfter: curr.level,
                    difference: drop,
                    timestamp: curr.timestamp,
                }
            }
        }
    }
    return null
}

// ─── Yakıt Tüketim Hızı ────────────────────────────────

/**
 * Makine bazında yakıt tüketim hızını hesaplar (litre/saat)
 */
export function calculateFuelConsumptionRate(
    totalFuelLiters: number,
    totalWorkHours: number
): number {
    if (totalWorkHours <= 0) return 0
    return Math.round((totalFuelLiters / totalWorkHours) * 100) / 100
}

// ─── Makine Sağlık Skoru ────────────────────────────────

/**
 * Makine sağlık skorunu hesaplar (0-100)
 * Trackunit + Trimble yaklaşımı
 */
export function getHealthScore(
    machine: MachineData,
    sessions: SessionData[],
    maintenances: MaintenanceData[]
): number {
    let score = 100
    const now = new Date()

    // 1. Bakım durumu (-30 puan max)
    if (maintenances.length === 0) {
        score -= 15 // Hiç bakım yapılmamış
    } else {
        const lastMaintenance = maintenances[0]
        if (lastMaintenance.nextMaintenanceDate) {
            const nextDate = new Date(lastMaintenance.nextMaintenanceDate)
            const daysUntil = (nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            if (daysUntil < 0) score -= 30  // Gecikmiş
            else if (daysUntil < 7) score -= 20  // 1 hafta içinde
            else if (daysUntil < 30) score -= 10 // 1 ay içinde
        }
        if (lastMaintenance.nextMaintenanceHours && machine.totalHours) {
            const hoursLeft = Number(lastMaintenance.nextMaintenanceHours) - Number(machine.totalHours)
            if (hoursLeft < 0) score -= 25
            else if (hoursLeft < 50) score -= 15
            else if (hoursLeft < 100) score -= 5
        }
    }

    // 2. Sigorta/muayene (-20 puan max)
    if (machine.insuranceExpiry) {
        const daysUntil = (new Date(machine.insuranceExpiry).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        if (daysUntil < 0) score -= 10
        else if (daysUntil < 30) score -= 5
    }
    if (machine.inspectionExpiry) {
        const daysUntil = (new Date(machine.inspectionExpiry).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        if (daysUntil < 0) score -= 10
        else if (daysUntil < 30) score -= 5
    }

    // 3. Boşta çalışma oranı (-15 puan max)
    if (sessions.length > 0) {
        const totalWork = sessions.reduce((s, se) => s + (se.durationMinutes || 0), 0)
        const totalIdle = sessions.reduce((s, se) => s + (se.idleMinutes || 0), 0)
        if (totalWork > 0) {
            const idleRatio = totalIdle / totalWork
            if (idleRatio > 0.5) score -= 15
            else if (idleRatio > 0.3) score -= 10
            else if (idleRatio > 0.2) score -= 5
        }
    }

    // 4. Yetkisiz kullanım (-10 puan max)
    const unauthorizedCount = sessions.filter(s => !s.isAuthorized).length
    if (unauthorizedCount > 3) score -= 10
    else if (unauthorizedCount > 0) score -= 5

    // 5. Makine durumu (-10 puan max)
    if (machine.status === 'ARIZALI') score -= 10
    else if (machine.status === 'BAKIMDA') score -= 5

    return Math.max(0, Math.min(100, score))
}

// ─── CO2 Ayak İzi ──────────────────────────────────────

// Makine tipine göre ortalama CO2 emisyon faktörleri (kg CO2 / litre dizel)
const CO2_FACTOR = 2.68 // 1 litre dizel ≈ 2.68 kg CO2

/**
 * Yakıt tüketiminden CO2 ayak izini hesaplar
 * @returns kg CO2
 */
export function calculateCO2Footprint(fuelConsumedLiters: number): number {
    return Math.round(fuelConsumedLiters * CO2_FACTOR * 10) / 10
}

// ─── Yetkisiz Kullanım Tespiti ─────────────────────────

/**
 * Mesai saatleri dışında motor açılmışsa yetkisiz kullanım
 */
export function detectUnauthorizedUse(
    sessionStartHour: number,
    workHours: { start: number; end: number } = { start: 7, end: 20 }
): boolean {
    return sessionStartHour < workHours.start || sessionStartHour >= workHours.end
}

// ─── Geofence İçinde mi Kontrolü (Ray Casting) ────────

/**
 * Bir noktanın polygon içinde olup olmadığını kontrol eder
 * Ray-casting algoritması
 */
export function isPointInPolygon(
    point: { lat: number; lng: number },
    polygon: { lat: number; lng: number }[]
): boolean {
    let inside = false
    const n = polygon.length
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = polygon[i].lat, yi = polygon[i].lng
        const xj = polygon[j].lat, yj = polygon[j].lng
        const intersect = ((yi > point.lng) !== (yj > point.lng)) &&
            (point.lat < (xj - xi) * (point.lng - yi) / (yj - yi) + xi)
        if (intersect) inside = !inside
    }
    return inside
}

/**
 * Bir noktanın daire içinde olup olmadığını kontrol eder
 */
export function isPointInCircle(
    point: { lat: number; lng: number },
    center: { lat: number; lng: number },
    radiusMeters: number
): boolean {
    const R = 6371000 // Dünya yarıçapı (metre)
    const dLat = (point.lat - center.lat) * Math.PI / 180
    const dLng = (point.lng - center.lng) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(center.lat * Math.PI / 180) * Math.cos(point.lat * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2
    const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return distance <= radiusMeters
}

// ─── İki Koordinat Arası Mesafe ────────────────────────

/**
 * İki koordinat arası mesafeyi hesaplar (metre)
 */
export function calculateDistance(
    p1: { lat: number; lng: number },
    p2: { lat: number; lng: number }
): number {
    const R = 6371000
    const dLat = (p2.lat - p1.lat) * Math.PI / 180
    const dLng = (p2.lng - p1.lng) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
