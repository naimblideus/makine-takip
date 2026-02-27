// GET /api/cron/alerts — Günlük uyarı kontrolü
// Bakım, sigorta, muayene, operatör belgesi kontrolleri
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkMachineAlerts } from '@/lib/notifications'

export async function GET(req: NextRequest) {
    try {
        const key = new URL(req.url).searchParams.get('key')
        if (key !== process.env.CRON_SECRET && key !== 'dev') {
            return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
        }

        const tenants = await prisma.tenant.findMany({ select: { id: true, name: true } })
        const results: any[] = []

        for (const tenant of tenants) {
            const result = await checkMachineAlerts(tenant.id)
            results.push({
                tenantName: tenant.name,
                ...result,
            })
        }

        return NextResponse.json({
            success: true,
            results,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        console.error('Alerts cron hatası:', error)
        return NextResponse.json({ error: 'Cron hatası' }, { status: 500 })
    }
}
