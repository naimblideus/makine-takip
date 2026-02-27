// GET /api/gps/positions — Tüm makinelerin anlık GPS konumları
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getAllPositions, type TraccarPosition } from '@/lib/traccar'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })
        }

        const tenantId = (session.user as any).tenantId

        // GPS aktif makineleri getir
        const machines = await prisma.machine.findMany({
            where: { tenantId, gpsEnabled: true },
            select: {
                id: true,
                plate: true,
                brand: true,
                model: true,
                type: true,
                status: true,
                traccarDeviceId: true,
                speedLimit: true,
                fuelCapacity: true,
                fuelSensorEnabled: true,
                idleThresholdMinutes: true,
                rentals: {
                    where: { status: 'AKTIF' },
                    take: 1,
                    include: {
                        customer: { select: { companyName: true } },
                        operator: { select: { name: true } },
                        site: { select: { name: true } },
                    },
                },
            },
        })

        // Traccar'dan pozisyonlar al
        const positions = await getAllPositions()

        // Makine + pozisyon eşleştir
        const result = machines.map(machine => {
            const pos = machine.traccarDeviceId
                ? positions.find((p: TraccarPosition) => String(p.deviceId) === machine.traccarDeviceId)
                : null

            const activeRental = machine.rentals[0]

            return {
                machineId: machine.id,
                plate: machine.plate,
                brand: machine.brand,
                model: machine.model,
                type: machine.type,
                status: machine.status,
                speedLimit: machine.speedLimit,
                fuelCapacity: machine.fuelCapacity ? Number(machine.fuelCapacity) : null,
                fuelSensorEnabled: machine.fuelSensorEnabled,
                idleThresholdMinutes: machine.idleThresholdMinutes,
                activeRental: activeRental ? {
                    customer: activeRental.customer.companyName,
                    operator: activeRental.operator?.name || null,
                    site: activeRental.site?.name || null,
                } : null,
                position: pos ? {
                    lat: pos.lat,
                    lng: pos.lng,
                    speed: pos.speed,
                    course: pos.course,
                    ignition: pos.attributes?.ignition ?? false,
                    fuel: pos.attributes?.fuel ?? null,
                    hours: pos.attributes?.hours ?? null,
                    motion: pos.attributes?.motion ?? false,
                    satellites: pos.attributes?.sat ?? 0,
                    signalStrength: pos.attributes?.rssi ?? null,
                    fixTime: pos.fixTime,
                    valid: pos.valid,
                } : null,
                online: pos ? (Date.now() - new Date(pos.serverTime).getTime() < 5 * 60 * 1000) : false,
            }
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error('GPS pozisyon hatası:', error)
        return NextResponse.json({ error: 'GPS verileri alınamadı' }, { status: 500 })
    }
}
