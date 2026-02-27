// GET /api/gps/history/[machineId] — Rota geçmişi
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getRouteHistory } from '@/lib/traccar'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ machineId: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })
        }

        const tenantId = (session.user as any).tenantId
        const { machineId } = await params
        const { searchParams } = new URL(req.url)
        const from = searchParams.get('from')
        const to = searchParams.get('to')

        // Makineyi kontrol et
        const machine = await prisma.machine.findFirst({
            where: { id: machineId, tenantId },
        })

        if (!machine) {
            return NextResponse.json({ error: 'Makine bulunamadı' }, { status: 404 })
        }

        // Varsayılan: bugün
        const fromDate = from ? new Date(from) : new Date(new Date().setHours(0, 0, 0, 0))
        const toDate = to ? new Date(to) : new Date()

        const history = await getRouteHistory(
            machine.traccarDeviceId || '0',
            fromDate,
            toDate
        )

        // Özet hesapla
        let totalDistance = 0
        let maxSpeed = 0
        let totalSpeed = 0
        let speedCount = 0

        for (let i = 1; i < history.length; i++) {
            const prev = history[i - 1]
            const curr = history[i]
            // Mesafe hesapla (Haversine)
            const R = 6371000
            const dLat = (curr.lat - prev.lat) * Math.PI / 180
            const dLng = (curr.lng - prev.lng) * Math.PI / 180
            const a = Math.sin(dLat / 2) ** 2 +
                Math.cos(prev.lat * Math.PI / 180) * Math.cos(curr.lat * Math.PI / 180) *
                Math.sin(dLng / 2) ** 2
            totalDistance += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

            if (curr.speed > maxSpeed) maxSpeed = curr.speed
            if (curr.speed > 0) {
                totalSpeed += curr.speed
                speedCount++
            }
        }

        // Motor kapalı noktaları bul (durak noktaları)
        const stops = history.filter(p => !p.attributes?.ignition).map(p => ({
            lat: p.lat,
            lng: p.lng,
            time: p.fixTime,
        }))

        return NextResponse.json({
            route: history.map(p => ({
                lat: p.lat,
                lng: p.lng,
                speed: p.speed,
                ignition: p.attributes?.ignition ?? false,
                time: p.fixTime,
            })),
            stops,
            summary: {
                totalDistance: Math.round(totalDistance), // metre
                maxSpeed: Math.round(maxSpeed),
                avgSpeed: speedCount > 0 ? Math.round(totalSpeed / speedCount) : 0,
                duration: history.length > 1
                    ? Math.round((new Date(history[history.length - 1].fixTime).getTime() - new Date(history[0].fixTime).getTime()) / 60000)
                    : 0, // dakika
                pointCount: history.length,
            },
        })
    } catch (error) {
        console.error('GPS rota geçmişi hatası:', error)
        return NextResponse.json({ error: 'Rota geçmişi alınamadı' }, { status: 500 })
    }
}
