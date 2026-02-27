// GET /api/cron/geofence-check — Geofence ihlal kontrolü
// Her 1 dakikada çalışır
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAllPositions } from '@/lib/traccar'
import { isPointInPolygon, isPointInCircle } from '@/lib/gps-analyzer'
import { sendCommand } from '@/lib/traccar'

export async function GET(req: NextRequest) {
    try {
        const key = new URL(req.url).searchParams.get('key')
        if (key !== process.env.CRON_SECRET && key !== 'dev') {
            return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
        }

        const positions = await getAllPositions()
        let breachesDetected = 0

        // Tüm aktif geofence'leri getir
        const geofences = await prisma.geofence.findMany({
            where: { isActive: true },
            include: {
                assignedMachines: {
                    include: {
                        machine: {
                            select: {
                                id: true, brand: true, model: true, plate: true,
                                traccarDeviceId: true, tenantId: true,
                            },
                        },
                    },
                },
            },
        })

        for (const geofence of geofences) {
            const coords = geofence.coordinates as any

            for (const gm of geofence.assignedMachines) {
                const machine = gm.machine
                if (!machine.traccarDeviceId) continue

                const pos = positions.find((p: any) => String(p.deviceId) === machine.traccarDeviceId)
                if (!pos || !pos.valid) continue

                const point = { lat: pos.lat, lng: pos.lng }
                let isInside = false

                if (geofence.type === 'CIRCLE' && coords.lat && coords.lng && coords.radius) {
                    isInside = isPointInCircle(point, { lat: coords.lat, lng: coords.lng }, coords.radius)
                } else if (Array.isArray(coords)) {
                    isInside = isPointInPolygon(point, coords)
                }

                // Dışarıdaysa ihlal
                if (!isInside) {
                    // Son 5 dakikada aynı geofence için ihlal var mı?
                    const recentBreach = await prisma.geofenceBreach.findFirst({
                        where: {
                            geofenceId: geofence.id,
                            machineId: machine.id,
                            createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
                        },
                    })

                    if (!recentBreach) {
                        await prisma.geofenceBreach.create({
                            data: {
                                tenantId: machine.tenantId,
                                geofenceId: geofence.id,
                                machineId: machine.id,
                                lat: pos.lat,
                                lng: pos.lng,
                                speed: pos.speed,
                                breachType: 'EXIT',
                                actionTaken: geofence.actionOnBreach,
                            },
                        })

                        await prisma.gpsLog.create({
                            data: {
                                tenantId: machine.tenantId,
                                machineId: machine.id,
                                action: 'GEOFENCE_BREACH',
                                lat: pos.lat,
                                lng: pos.lng,
                                speed: pos.speed,
                                reason: `${geofence.name} bölgesinden çıkış`,
                            },
                        })

                        await prisma.systemNotification.create({
                            data: {
                                tenantId: machine.tenantId,
                                type: 'GEOFENCE_IHLALI',
                                title: `📐 Geofence İhlali: ${machine.brand} ${machine.model}`,
                                message: `${machine.plate || ''} — "${geofence.name}" bölgesinden çıktı`,
                                machineId: machine.id,
                                data: { lat: pos.lat, lng: pos.lng, geofenceName: geofence.name },
                            },
                        })

                        // Motor durdurma eylemi
                        if (geofence.actionOnBreach === 'STOP' && machine.traccarDeviceId) {
                            await sendCommand(machine.traccarDeviceId, 'engineStop')
                            await prisma.gpsLog.create({
                                data: {
                                    tenantId: machine.tenantId,
                                    machineId: machine.id,
                                    action: 'ENGINE_STOP',
                                    lat: pos.lat,
                                    lng: pos.lng,
                                    reason: `Geofence ihlali nedeniyle otomatik motor durdurma`,
                                },
                            })
                        }

                        breachesDetected++
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            breachesDetected,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        console.error('Geofence check cron hatası:', error)
        return NextResponse.json({ error: 'Cron hatası' }, { status: 500 })
    }
}
