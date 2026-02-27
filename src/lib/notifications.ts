// ─── Bildirim & Uyarı Sistemi ──────────────────────────────
// Bakım, sigorta, muayene, operatör belgesi kontrolü + WhatsApp alert

import { prisma } from '@/lib/prisma'

/**
 * Tüm makine ve operatör uyarılarını kontrol et, SystemNotification oluştur
 */
export async function checkMachineAlerts(tenantId: string): Promise<{
    created: number; details: string[]
}> {
    const details: string[] = []
    let created = 0
    const now = new Date()
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const in45Days = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000)

    // ─── 1. Bakım saati yaklaşan makineler ─────────────
    const machines = await prisma.machine.findMany({
        where: { tenantId },
        include: {
            maintenances: {
                orderBy: { performedAt: 'desc' },
                take: 1,
            },
        },
    })

    for (const machine of machines) {
        const lastMaint = machine.maintenances[0]
        if (lastMaint?.nextMaintenanceHours) {
            const hoursLeft = Number(lastMaint.nextMaintenanceHours) - Number(machine.totalHours)
            if (hoursLeft <= 50 && hoursLeft > 0) {
                // Aynı uyarı bugün zaten oluşturulmuş mu?
                const existing = await prisma.systemNotification.findFirst({
                    where: {
                        tenantId, machineId: machine.id,
                        type: 'BAKIM_YAKLASIYOR',
                        createdAt: { gte: new Date(now.toDateString()) },
                    },
                })
                if (!existing) {
                    await prisma.systemNotification.create({
                        data: {
                            tenantId, type: 'BAKIM_YAKLASIYOR',
                            title: `Bakım Yaklaşıyor: ${machine.brand} ${machine.model}`,
                            message: `${machine.plate || machine.serialNumber || ''} — Sonraki bakıma ${Math.round(hoursLeft)} saat kaldı`,
                            machineId: machine.id,
                        },
                    })
                    created++
                    details.push(`Bakım yaklaşıyor: ${machine.brand} ${machine.model} (${Math.round(hoursLeft)} saat)`)
                }
            } else if (hoursLeft <= 0) {
                const existing = await prisma.systemNotification.findFirst({
                    where: {
                        tenantId, machineId: machine.id,
                        type: 'BAKIM_GECIKTI',
                        createdAt: { gte: new Date(now.toDateString()) },
                    },
                })
                if (!existing) {
                    await prisma.systemNotification.create({
                        data: {
                            tenantId, type: 'BAKIM_GECIKTI',
                            title: `⚠️ Bakım Gecikti: ${machine.brand} ${machine.model}`,
                            message: `${machine.plate || machine.serialNumber || ''} — Bakım ${Math.abs(Math.round(hoursLeft))} saat gecikmiş!`,
                            machineId: machine.id,
                        },
                    })
                    created++
                    details.push(`Bakım gecikti: ${machine.brand} ${machine.model}`)
                }
            }
        }

        // ─── 2. Sigorta dolacak ────────────────────────────
        if (machine.insuranceExpiry) {
            const expiry = new Date(machine.insuranceExpiry)
            if (expiry <= in45Days && expiry > now) {
                const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                const existing = await prisma.systemNotification.findFirst({
                    where: {
                        tenantId, machineId: machine.id,
                        type: 'SIGORTA_DOLACAK',
                        createdAt: { gte: new Date(now.toDateString()) },
                    },
                })
                if (!existing) {
                    await prisma.systemNotification.create({
                        data: {
                            tenantId, type: 'SIGORTA_DOLACAK',
                            title: `Sigorta Dolacak: ${machine.brand} ${machine.model}`,
                            message: `Sigortanın son günü ${daysLeft} gün sonra`,
                            machineId: machine.id,
                        },
                    })
                    created++
                    details.push(`Sigorta dolacak: ${machine.brand} ${machine.model} (${daysLeft} gün)`)
                }
            }
        }

        // ─── 3. Muayene dolacak ────────────────────────────
        if (machine.inspectionExpiry) {
            const expiry = new Date(machine.inspectionExpiry)
            if (expiry <= in45Days && expiry > now) {
                const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                const existing = await prisma.systemNotification.findFirst({
                    where: {
                        tenantId, machineId: machine.id,
                        type: 'MUAYENE_DOLACAK',
                        createdAt: { gte: new Date(now.toDateString()) },
                    },
                })
                if (!existing) {
                    await prisma.systemNotification.create({
                        data: {
                            tenantId, type: 'MUAYENE_DOLACAK',
                            title: `Muayene Dolacak: ${machine.brand} ${machine.model}`,
                            message: `Muayene tarihi ${daysLeft} gün sonra`,
                            machineId: machine.id,
                        },
                    })
                    created++
                    details.push(`Muayene dolacak: ${machine.brand} ${machine.model} (${daysLeft} gün)`)
                }
            }
        }
    }

    // ─── 4. Operatör belgesi dolacak ───────────────────────
    const operators = await prisma.operator.findMany({
        where: { tenantId, isActive: true },
    })

    for (const op of operators) {
        if (op.licenseExpiry) {
            const expiry = new Date(op.licenseExpiry)
            if (expiry <= in30Days && expiry > now) {
                const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                const existing = await prisma.systemNotification.findFirst({
                    where: {
                        tenantId,
                        type: 'OPERATOR_BELGESI_DOLACAK',
                        message: { contains: op.name },
                        createdAt: { gte: new Date(now.toDateString()) },
                    },
                })
                if (!existing) {
                    await prisma.systemNotification.create({
                        data: {
                            tenantId, type: 'OPERATOR_BELGESI_DOLACAK',
                            title: `Operatör Belgesi Dolacak`,
                            message: `${op.name} — Belge süresi ${daysLeft} gün sonra doluyor`,
                        },
                    })
                    created++
                    details.push(`Operatör belgesi: ${op.name} (${daysLeft} gün)`)
                }
            }
        }
    }

    return { created, details }
}

/**
 * WhatsApp mesaj linki oluştur
 */
export function sendWhatsAppAlert(phone: string, message: string): string {
    const cleaned = phone.replace(/\D/g, '')
    const intlPhone = cleaned.startsWith('0') ? `90${cleaned.slice(1)}` : cleaned
    return `https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`
}

/**
 * Google Maps linki oluştur
 */
export function getGoogleMapsLink(lat: number, lng: number): string {
    return `https://www.google.com/maps?q=${lat},${lng}`
}
