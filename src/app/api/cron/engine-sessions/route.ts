// GET /api/cron/engine-sessions — Motor oturumlarını takip et
// Her 5 dakikada çalışır: motor açma/kapama oturumlarını kaydeder
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAllPositions } from '@/lib/traccar'
import { detectUnauthorizedUse } from '@/lib/gps-analyzer'

export async function GET(req: NextRequest) {
    try {
        // Cron güvenliği
        const key = new URL(req.url).searchParams.get('key')
        if (key !== process.env.CRON_SECRET && key !== 'dev') {
            return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
        }

        const positions = await getAllPositions()
        const tenants = await prisma.tenant.findMany({ select: { id: true } })
        let sessionsCreated = 0, sessionsClosed = 0

        for (const tenant of tenants) {
            const machines = await prisma.machine.findMany({
                where: { tenantId: tenant.id, gpsEnabled: true, traccarDeviceId: { not: null } },
                include: {
                    rentals: { where: { status: 'AKTIF' }, take: 1 },
                },
            })

            for (const machine of machines) {
                const pos = positions.find((p: any) => String(p.deviceId) === machine.traccarDeviceId)
                if (!pos) continue

                const ignition = pos.attributes?.ignition ?? false
                const activeSession = await prisma.engineSession.findFirst({
                    where: { machineId: machine.id, endedAt: null },
                    orderBy: { startedAt: 'desc' },
                })

                if (ignition && !activeSession) {
                    // Motor açıldı → yeni session başlat
                    const startHour = new Date().getHours()
                    const isAuthorized = !detectUnauthorizedUse(startHour)

                    await prisma.engineSession.create({
                        data: {
                            tenantId: tenant.id,
                            machineId: machine.id,
                            rentalId: machine.rentals[0]?.id || null,
                            startedAt: new Date(),
                            startLat: pos.lat,
                            startLng: pos.lng,
                            isAuthorized,
                        },
                    })
                    sessionsCreated++

                    if (!isAuthorized) {
                        await prisma.systemNotification.create({
                            data: {
                                tenantId: tenant.id,
                                type: 'YETKISIZ_KULLANIM',
                                title: `🚨 Yetkisiz Kullanım: ${machine.brand} ${machine.model}`,
                                message: `${machine.plate || ''} mesai dışı çalıştırıldı. Saat: ${startHour}:00`,
                                machineId: machine.id,
                                data: { lat: pos.lat, lng: pos.lng },
                            },
                        })
                        await prisma.gpsLog.create({
                            data: {
                                tenantId: tenant.id,
                                machineId: machine.id,
                                action: 'UNAUTHORIZED_USE',
                                lat: pos.lat,
                                lng: pos.lng,
                                speed: pos.speed,
                                engineOn: true,
                            },
                        })
                    }
                } else if (!ignition && activeSession) {
                    // Motor kapandı → session kapat
                    const duration = Math.round((Date.now() - new Date(activeSession.startedAt).getTime()) / 60000)
                    const idleMinutes = Math.round(duration * 0.2) // Tahmini idle
                    const workMinutes = duration - idleMinutes

                    await prisma.engineSession.update({
                        where: { id: activeSession.id },
                        data: {
                            endedAt: new Date(),
                            durationMinutes: duration,
                            idleMinutes,
                            workMinutes,
                            maxSpeed: pos.speed,
                            avgSpeed: pos.speed * 0.6,
                        },
                    })

                    // Makine totalHours güncelle
                    await prisma.machine.update({
                        where: { id: machine.id },
                        data: {
                            totalHours: { increment: Math.round(duration / 60 * 10) / 10 },
                        },
                    })

                    sessionsClosed++

                    // Idle alarm
                    if (idleMinutes > machine.idleThresholdMinutes) {
                        await prisma.systemNotification.create({
                            data: {
                                tenantId: tenant.id,
                                type: 'BOSTA_CALISIYOR',
                                title: `Boşta Çalışma: ${machine.brand} ${machine.model}`,
                                message: `${idleMinutes} dakika boşta çalıştı (eşik: ${machine.idleThresholdMinutes} dk)`,
                                machineId: machine.id,
                            },
                        })
                    }
                }

                // Hız kontrolü
                if (machine.speedLimit && pos.speed > machine.speedLimit) {
                    const existing = await prisma.gpsLog.findFirst({
                        where: {
                            machineId: machine.id,
                            action: 'SPEED_ALERT',
                            createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
                        },
                    })
                    if (!existing) {
                        await prisma.gpsLog.create({
                            data: {
                                tenantId: tenant.id,
                                machineId: machine.id,
                                action: 'SPEED_ALERT',
                                lat: pos.lat,
                                lng: pos.lng,
                                speed: pos.speed,
                                engineOn: ignition,
                                reason: `Hız sınırı aşıldı: ${pos.speed} km/h (limit: ${machine.speedLimit})`,
                            },
                        })
                        await prisma.systemNotification.create({
                            data: {
                                tenantId: tenant.id,
                                type: 'HIZ_IHLALI',
                                title: `Hız İhlali: ${machine.brand} ${machine.model}`,
                                message: `${pos.speed} km/h (limit: ${machine.speedLimit} km/h)`,
                                machineId: machine.id,
                            },
                        })
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            sessionsCreated,
            sessionsClosed,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        console.error('Engine sessions cron hatası:', error)
        return NextResponse.json({ error: 'Cron hatası' }, { status: 500 })
    }
}
