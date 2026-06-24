// GET /api/komuta-ozet — Komuta merkezi "para kanıtı" metrikleri
// Patronun her sabah ilk bakacağı: GPS-doğrulanmış saat, yakalanan tartışmalı
// hakediş TL, korunan yakıt TL, tahsilat/vade, sahada çalışan makine, bugünkü alarm.
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const FUEL_TL_PER_LITER = Number(process.env.FUEL_TL_PER_LITER || 43)

export async function GET() {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [
        sessionsThisMonth,
        hakedislerThisMonth,
        fuelAlertsThisMonth,
        openInvoices,
        workingNow,
        criticalAlertsToday,
        machineCount,
        tenant,
    ] = await Promise.all([
        prisma.engineSession.findMany({
            where: { tenantId, startedAt: { gte: monthStart }, durationMinutes: { not: null } },
            select: { durationMinutes: true },
        }),
        prisma.hakedis.findMany({
            where: { tenantId, createdAt: { gte: monthStart } },
            select: { gpsReport: true },
        }),
        prisma.fuelTheftAlert.findMany({
            where: { tenantId, detectedAt: { gte: monthStart } },
            select: { difference: true },
        }),
        prisma.invoice.findMany({
            where: { tenantId, status: { in: ['ONAYLANDI', 'GECIKTI', 'KISMI_ODENDI'] } },
            select: { totalAmount: true, dueDate: true, status: true },
        }),
        prisma.engineSession.count({ where: { tenantId, endedAt: null } }),
        prisma.systemNotification.count({
            where: {
                tenantId, createdAt: { gte: dayStart },
                type: { in: ['YAKIT_HIRSIZLIGI', 'GEOFENCE_IHLALI', 'YETKISIZ_KULLANIM', 'HIZ_IHLALI'] },
            },
        }),
        prisma.machine.count({ where: { tenantId } }),
        prisma.tenant.findUnique({ where: { id: tenantId }, select: { plan: true, machineLimit: true } }),
    ])

    const gpsVerifiedHours = Math.round(sessionsThisMonth.reduce((s, x) => s + (x.durationMinutes || 0), 0) / 60 * 10) / 10

    // Yakalanan tartışmalı saat farkı (beyan > motor): pozitif deltaTL toplamı
    let disputedTL = 0, disputedHours = 0
    for (const h of hakedislerThisMonth) {
        const g = h.gpsReport as any
        if (g && g.hasTelemetry && Number(g.deltaTL) > 0) {
            disputedTL += Number(g.deltaTL)
            disputedHours += Number(g.deltaHours) || 0
        }
    }

    const fuelLiters = fuelAlertsThisMonth.reduce((s, a) => s + Number(a.difference || 0), 0)
    const fuelProtectedTL = Math.round(fuelLiters * FUEL_TL_PER_LITER)

    let pendingTL = 0, overdueTL = 0
    for (const inv of openInvoices) {
        const amt = Number(inv.totalAmount)
        const isOverdue = inv.status === 'GECIKTI' || (inv.dueDate && new Date(inv.dueDate) < now)
        if (isOverdue) overdueTL += amt
        else pendingTL += amt
    }

    return NextResponse.json({
        gpsVerifiedHours,
        disputedTL: Math.round(disputedTL),
        disputedHours: Math.round(disputedHours * 10) / 10,
        fuelProtectedTL,
        fuelLiters: Math.round(fuelLiters),
        pendingTL: Math.round(pendingTL),
        overdueTL: Math.round(overdueTL),
        workingNow,
        machineCount,
        criticalAlertsToday,
        plan: tenant?.plan || 'PRO',
        machineLimit: tenant?.machineLimit ?? 50,
        month: now.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
    })
}
