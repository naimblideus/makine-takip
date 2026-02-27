// GET /api/gps/alerts/[machineId] — Makine GPS alarmları
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

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
        const limit = parseInt(searchParams.get('limit') || '50')

        const [gpsLogs, fuelAlerts, breaches] = await Promise.all([
            prisma.gpsLog.findMany({
                where: { tenantId, machineId },
                orderBy: { createdAt: 'desc' },
                take: limit,
            }),
            prisma.fuelTheftAlert.findMany({
                where: { tenantId, machineId },
                orderBy: { createdAt: 'desc' },
                take: 20,
            }),
            prisma.geofenceBreach.findMany({
                where: { tenantId, machineId },
                orderBy: { createdAt: 'desc' },
                take: 20,
                include: { geofence: { select: { name: true } } },
            }),
        ])

        return NextResponse.json({ gpsLogs, fuelAlerts, breaches })
    } catch (error) {
        console.error('GPS alarm hatası:', error)
        return NextResponse.json({ error: 'Alarmlar alınamadı' }, { status: 500 })
    }
}
