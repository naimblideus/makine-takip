// GET /api/yakit-kayip — Yakıt hırsızlığı parasal özeti ("bu ay X TL kayıp yakalandı")
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const FUEL_TL_PER_LITER = Number(process.env.FUEL_TL_PER_LITER || 43) // motorin ~ güncel

export async function GET() {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [monthAlerts, allAlerts] = await Promise.all([
        prisma.fuelTheftAlert.findMany({ where: { tenantId, detectedAt: { gte: monthStart } }, select: { difference: true } }),
        prisma.fuelTheftAlert.findMany({ where: { tenantId }, select: { difference: true } }),
    ])

    const litersThisMonth = monthAlerts.reduce((s, a) => s + Number(a.difference || 0), 0)
    const litersTotal = allAlerts.reduce((s, a) => s + Number(a.difference || 0), 0)

    return NextResponse.json({
        fuelPrice: FUEL_TL_PER_LITER,
        alertCountThisMonth: monthAlerts.length,
        litersThisMonth,
        tlThisMonth: Math.round(litersThisMonth * FUEL_TL_PER_LITER),
        alertCountTotal: allAlerts.length,
        litersTotal,
        tlTotal: Math.round(litersTotal * FUEL_TL_PER_LITER),
    })
}
