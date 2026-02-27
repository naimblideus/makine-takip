// ─── Traccar GPS API İstemcisi ─────────────────────────────
// Traccar sunucusu ile iletişim kurar. Traccar yoksa mock veri döndürür.

const TRACCAR_URL = process.env.TRACCAR_URL || ''
const TRACCAR_USERNAME = process.env.TRACCAR_USERNAME || ''
const TRACCAR_PASSWORD = process.env.TRACCAR_PASSWORD || ''

const IS_MOCK = !TRACCAR_URL || !TRACCAR_USERNAME

// ─── Tipler ─────────────────────────────────────────────

export interface TraccarPosition {
    deviceId: number
    lat: number
    lng: number
    speed: number          // km/h
    course: number         // yön (derece)
    attributes: {
        ignition: boolean  // motor açık mı
        fuel?: number      // yakıt seviyesi %
        hours?: number     // motor saati
        motion: boolean    // hareket var mı
        sat: number        // uydu sayısı
        rssi?: number      // sinyal gücü
    }
    fixTime: string
    serverTime: string
    valid: boolean
}

// ─── Yardımcı: Traccar API çağrısı ────────────────────────

async function traccarFetch(path: string, options: RequestInit = {}): Promise<any> {
    const auth = Buffer.from(`${TRACCAR_USERNAME}:${TRACCAR_PASSWORD}`).toString('base64')
    const res = await fetch(`${TRACCAR_URL}/api${path}`, {
        ...options,
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    })
    if (!res.ok) throw new Error(`Traccar API hatası: ${res.status} ${res.statusText}`)
    return res.json()
}

// ─── Mock Veri ──────────────────────────────────────────

function generateMockPositions(count: number): TraccarPosition[] {
    // İstanbul merkezli rastgele pozisyonlar
    const baseLat = 40.98 + Math.random() * 0.1
    const baseLng = 29.02 + Math.random() * 0.1
    return Array.from({ length: count }, (_, i) => ({
        deviceId: i + 1,
        lat: baseLat + (Math.random() - 0.5) * 0.2,
        lng: baseLng + (Math.random() - 0.5) * 0.2,
        speed: Math.random() > 0.4 ? Math.floor(Math.random() * 60) : 0,
        course: Math.floor(Math.random() * 360),
        attributes: {
            ignition: Math.random() > 0.3,
            fuel: Math.floor(Math.random() * 100),
            hours: Math.floor(Math.random() * 5000),
            motion: Math.random() > 0.5,
            sat: Math.floor(Math.random() * 12) + 3,
            rssi: Math.floor(Math.random() * 30) + 10,
        },
        fixTime: new Date(Date.now() - Math.floor(Math.random() * 300000)).toISOString(),
        serverTime: new Date().toISOString(),
        valid: Math.random() > 0.05,
    }))
}

// ─── API Fonksiyonları ──────────────────────────────────

/**
 * Tüm cihazların anlık konumlarını getirir
 */
export async function getAllPositions(): Promise<TraccarPosition[]> {
    if (IS_MOCK) return generateMockPositions(8)
    try {
        return await traccarFetch('/positions')
    } catch (e) {
        console.error('Traccar pozisyon hatası:', e)
        return generateMockPositions(8) // Fallback
    }
}

/**
 * Tek bir cihazın konumunu getirir
 */
export async function getDevicePosition(deviceId: string): Promise<TraccarPosition | null> {
    if (IS_MOCK) {
        const mock = generateMockPositions(1)[0]
        mock.deviceId = parseInt(deviceId) || 1
        return mock
    }
    try {
        const positions = await traccarFetch(`/positions?deviceId=${deviceId}`)
        return positions?.[0] || null
    } catch (e) {
        console.error('Traccar tekil pozisyon hatası:', e)
        return null
    }
}

/**
 * Cihaza komut gönderir (motor durdur/başlat)
 */
export async function sendCommand(
    deviceId: string,
    type: 'engineStop' | 'engineResume' | 'custom',
    attributes?: Record<string, any>
): Promise<boolean> {
    if (IS_MOCK) {
        console.log(`[MOCK] Komut gönderildi: ${type} → cihaz ${deviceId}`)
        return true
    }
    try {
        await traccarFetch('/commands/send', {
            method: 'POST',
            body: JSON.stringify({
                deviceId: parseInt(deviceId),
                type,
                attributes: attributes || {},
            }),
        })
        return true
    } catch (e) {
        console.error('Traccar komut hatası:', e)
        return false
    }
}

/**
 * Rota geçmişini getirir (belirli tarih aralığı)
 */
export async function getRouteHistory(
    deviceId: string, from: Date, to: Date
): Promise<TraccarPosition[]> {
    if (IS_MOCK) {
        // Mock: saatlik rastgele pozisyonlar oluştur
        const hours = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60))
        const baseLat = 40.98, baseLng = 29.02
        return Array.from({ length: Math.min(hours, 48) }, (_, i) => ({
            deviceId: parseInt(deviceId) || 1,
            lat: baseLat + (Math.sin(i * 0.3) * 0.01),
            lng: baseLng + (i * 0.002),
            speed: Math.floor(Math.random() * 50),
            course: Math.floor(Math.random() * 360),
            attributes: {
                ignition: i % 3 !== 0,
                motion: i % 3 !== 0,
                sat: 8,
            },
            fixTime: new Date(from.getTime() + i * 3600000).toISOString(),
            serverTime: new Date(from.getTime() + i * 3600000).toISOString(),
            valid: true,
        }))
    }
    try {
        const fromStr = from.toISOString()
        const toStr = to.toISOString()
        return await traccarFetch(`/positions?deviceId=${deviceId}&from=${fromStr}&to=${toStr}`)
    } catch (e) {
        console.error('Traccar rota geçmişi hatası:', e)
        return []
    }
}

/**
 * Traccar'da geofence oluşturur
 */
export async function createGeofence(
    name: string, coordinates: { lat: number; lng: number }[]
): Promise<number | null> {
    if (IS_MOCK) {
        console.log(`[MOCK] Geofence oluşturuldu: ${name}`)
        return Math.floor(Math.random() * 10000)
    }
    try {
        // WKT POLYGON formatına çevir
        const wktCoords = coordinates.map(c => `${c.lng} ${c.lat}`).join(', ')
        const area = `POLYGON ((${wktCoords}, ${coordinates[0].lng} ${coordinates[0].lat}))`
        const result = await traccarFetch('/geofences', {
            method: 'POST',
            body: JSON.stringify({ name, area }),
        })
        return result?.id || null
    } catch (e) {
        console.error('Traccar geofence oluşturma hatası:', e)
        return null
    }
}

/**
 * Traccar'dan geofence siler
 */
export async function deleteGeofence(traccarGeofenceId: number): Promise<boolean> {
    if (IS_MOCK) return true
    try {
        await traccarFetch(`/geofences/${traccarGeofenceId}`, { method: 'DELETE' })
        return true
    } catch (e) {
        console.error('Traccar geofence silme hatası:', e)
        return false
    }
}

/**
 * Cihaza geofence ata
 */
export async function assignGeofenceToDevice(deviceId: string, geofenceId: number): Promise<boolean> {
    if (IS_MOCK) return true
    try {
        await traccarFetch('/permissions', {
            method: 'POST',
            body: JSON.stringify({ deviceId: parseInt(deviceId), geofenceId }),
        })
        return true
    } catch (e) {
        console.error('Traccar geofence atama hatası:', e)
        return false
    }
}

/**
 * Traccar mock durumunu kontrol et
 */
export function isTraccarMock(): boolean {
    return IS_MOCK
}
