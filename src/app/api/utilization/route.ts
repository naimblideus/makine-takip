// GET /api/utilization — Atıl makine / kullanım oranı raporu (son 30 gün)
// Sağlıklı kiralama filosu hedefi %65-75. Düşük doluluk = sessiz amortisman kaybı.
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateUtilizationRate } from '@/lib/gps-analyzer'

export async function GET() {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const periodDays = 30
    const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)

    const machines = await prisma.machine.findMany({
        where: { tenantId },
        select: {
            id: true, brand: true, model: true, plate: true, type: true, status: true, dailyRate: true,
            engineSessions: { where: { startedAt: { gte: since } }, select: { durationMinutes: true, idleMinutes: true, workMinutes: true, maxSpeed: true, isAuthorized: true, startedAt: true, endedAt: true } },
            rentals: { where: { status: 'AKTIF' }, select: { id: true } },
        },
    })

    const rows = machines.map((m) => {
        const sessions = m.engineSessions as any[]
        const util = calculateUtilizationRate(sessions, periodDays)
        const activeRental = m.rentals.length > 0
        // Atıl: kirada değil ve düşük kullanım
        const idle = !activeRental && util < 30
        // Boşa amortisman/finansman maliyeti tahmini (kirada değilse): dailyRate'in ~%12'si/gün gizli maliyet
        const dailyCarry = m.dailyRate ? Math.round(Number(m.dailyRate) * 0.12) : 0
        return {
            id: m.id, name: `${m.brand} ${m.model}`, plate: m.plate, type: m.type, status: m.status,
            utilization: util, activeRental, idle,
            sessionCount: sessions.length,
            estIdleCostMonthly: idle ? dailyCarry * periodDays : 0,
        }
    }).sort((a, b) => a.utilization - b.utilization)

    const idleCount = rows.filter(r => r.idle).length
    const avgUtil = rows.length ? Math.round(rows.reduce((s, r) => s + r.utilization, 0) / rows.length * 10) / 10 : 0
    const idleCostMonthly = rows.reduce((s, r) => s + r.estIdleCostMonthly, 0)

    return NextResponse.json({
        rows,
        summary: { totalMachines: rows.length, idleCount, avgUtilization: avgUtil, idleCostMonthly, targetUtilization: 70 },
    })
}
