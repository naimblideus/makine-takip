import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || new Date().toISOString().slice(0, 7) // "2026-03"

    const scores = await prisma.operatorScore.findMany({
        where: { tenantId, period },
        include: { operator: { select: { name: true, phone: true, licenseClass: true, isActive: true } } },
        orderBy: { totalScore: 'desc' },
    })

    // Eğer bu dönem için skor yoksa operatörleri getir
    const operators = await prisma.operator.findMany({
        where: { tenantId, isActive: true },
        include: {
            timesheets: { where: { date: { gte: new Date(period + '-01') } } },
            scores: { where: { period } },
        },
    })

    return NextResponse.json({ scores, operators, period })
}

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const body = await req.json()
    const { operatorId, period, attendanceScore, safetyScore, efficiencyScore, maintenanceScore, notes } = body

    const total = Math.round((
        (attendanceScore || 0) * 0.3 +
        (safetyScore || 0) * 0.3 +
        (efficiencyScore || 0) * 0.25 +
        (maintenanceScore || 0) * 0.15
    ))

    const badge = total >= 85 ? 'ALTIN' : total >= 70 ? 'GUMUS' : total >= 50 ? 'BRONZ' : null

    const score = await prisma.operatorScore.upsert({
        where: { tenantId_operatorId_period: { tenantId, operatorId, period } },
        create: {
            tenantId, operatorId, period,
            attendanceScore: attendanceScore || 0,
            safetyScore: safetyScore || 0,
            efficiencyScore: efficiencyScore || 0,
            maintenanceScore: maintenanceScore || 0,
            totalScore: total,
            badge,
            notes,
        },
        update: {
            attendanceScore: attendanceScore || 0,
            safetyScore: safetyScore || 0,
            efficiencyScore: efficiencyScore || 0,
            maintenanceScore: maintenanceScore || 0,
            totalScore: total,
            badge,
            notes,
        },
    })

    return NextResponse.json({ score }, { status: 201 })
}
