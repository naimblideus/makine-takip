// GET /api/cron/fuel-check — Yakıt hırsızlığı kontrolü
// Her 30 dakikada çalışır
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAllPositions } from '@/lib/traccar'

export async function GET(req: NextRequest) {
    try {
        const key = new URL(req.url).searchParams.get('key')
        if (key !== process.env.CRON_SECRET && key !== 'dev') {
            return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
        }

        const positions = await getAllPositions()
        const tenants = await prisma.tenant.findMany({ select: { id: true } })
        let alertsCreated = 0

        for (const tenant of tenants) {
            const machines = await prisma.machine.findMany({
                where: {
                    tenantId: tenant.id,
                    gpsEnabled: true,
                    fuelSensorEnabled: true,
                    traccarDeviceId: { not: null },
                },
            })

            for (const machine of machines) {
                const pos = positions.find((p: any) => String(p.deviceId) === machine.traccarDeviceId)
                if (!pos || pos.attributes?.fuel === undefined) continue

                const currentFuel = pos.attributes.fuel
                const motion = pos.attributes?.motion ?? false
                const ignition = pos.attributes?.ignition ?? false

                // Motor kapalı ve hareket yokken yakıt düşüşü kontrol et
                if (!motion && !ignition) {
                    // Son yakıt okumasını al
                    const lastAlert = await prisma.fuelTheftAlert.findFirst({
                        where: { machineId: machine.id },
                        orderBy: { createdAt: 'desc' },
                    })

                    const lastLog = await prisma.gpsLog.findFirst({
                        where: {
                            machineId: machine.id,
                            fuelLevel: { not: null },
                        },
                        orderBy: { createdAt: 'desc' },
                    })

                    const previousFuel = lastLog?.fuelLevel ?? currentFuel
                    const drop = previousFuel - currentFuel

                    // %10'dan fazla düşüş varsa alarm
                    if (drop > 10) {
                        const capacity = machine.fuelCapacity ? Number(machine.fuelCapacity) : 100
                        const litersLost = Math.round(drop * capacity / 100)

                        // Son 1 saatte zaten alarm verilmiş mi?
                        const recentAlert = await prisma.fuelTheftAlert.findFirst({
                            where: {
                                machineId: machine.id,
                                createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
                            },
                        })

                        if (!recentAlert) {
                            await prisma.fuelTheftAlert.create({
                                data: {
                                    tenantId: tenant.id,
                                    machineId: machine.id,
                                    detectedAt: new Date(),
                                    fuelBefore: previousFuel,
                                    fuelAfter: currentFuel,
                                    difference: litersLost,
                                    machineWasOn: ignition,
                                    lat: pos.lat,
                                    lng: pos.lng,
                                },
                            })

                            await prisma.gpsLog.create({
                                data: {
                                    tenantId: tenant.id,
                                    machineId: machine.id,
                                    action: 'FUEL_THEFT_ALERT',
                                    lat: pos.lat,
                                    lng: pos.lng,
                                    fuelLevel: currentFuel,
                                    engineOn: ignition,
                                    reason: `Yakıt seviyesi %${previousFuel} → %${currentFuel} (${litersLost} litre kayıp)`,
                                },
                            })

                            await prisma.systemNotification.create({
                                data: {
                                    tenantId: tenant.id,
                                    type: 'YAKIT_HIRSIZLIGI',
                                    title: `⚠️ Yakıt Hırsızlığı: ${machine.brand} ${machine.model}`,
                                    message: `${machine.plate || ''} — ~${litersLost} litre yakıt kaybı tespit edildi`,
                                    machineId: machine.id,
                                    data: { lat: pos.lat, lng: pos.lng, fuelBefore: previousFuel, fuelAfter: currentFuel },
                                },
                            })

                            alertsCreated++
                        }
                    }
                }

                // Her pozisyonda fuel seviyesini logla (30 dk aralıklarla)
                await prisma.gpsLog.create({
                    data: {
                        tenantId: tenant.id,
                        machineId: machine.id,
                        action: 'IDLE_ALERT', // fuel log olarak kullanılıyor
                        lat: pos.lat,
                        lng: pos.lng,
                        fuelLevel: currentFuel,
                        engineOn: ignition,
                    },
                })
            }
        }

        return NextResponse.json({
            success: true,
            alertsCreated,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        console.error('Fuel check cron hatası:', error)
        return NextResponse.json({ error: 'Cron hatası' }, { status: 500 })
    }
}
