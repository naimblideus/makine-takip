import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const { searchParams } = new URL(req.url)
    const machineId = searchParams.get('machineId')

    const where: any = { tenantId, isActive: true }
    if (machineId) where.machineId = machineId

    const schedules = await prisma.maintenanceSchedule.findMany({
        where,
        include: { machine: { select: { brand: true, model: true, plate: true, type: true, totalHours: true } } },
        orderBy: { nextDueDate: 'asc' },
    })

    const now = new Date()
    const enriched = schedules.map(s => {
        const daysLeft = s.nextDueDate ? Math.ceil((s.nextDueDate.getTime() - now.getTime()) / 86400000) : null
        const status = daysLeft === null ? 'PLANSIZ'
            : daysLeft < 0 ? 'GECIKTI'
            : daysLeft <= 7 ? 'ACIL'
            : daysLeft <= 30 ? 'YAKLASIYOR'
            : 'NORMAL'
        return { ...s, daysLeft, alertStatus: status }
    })

    return NextResponse.json({ schedules: enriched })
}

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const body = await req.json()
    const { machineId, type, description, intervalHours, intervalDays, nextDueDate, nextDueHours, estimatedCost } = body

    const schedule = await prisma.maintenanceSchedule.create({
        data: {
            tenantId, machineId, type, description: description || null,
            intervalHours: intervalHours ? Number(intervalHours) : null,
            intervalDays: intervalDays ? Number(intervalDays) : null,
            nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
            nextDueHours: nextDueHours ? Number(nextDueHours) : null,
            estimatedCost: estimatedCost ? Number(estimatedCost) : null,
        },
    })

    return NextResponse.json({ schedule }, { status: 201 })
}
