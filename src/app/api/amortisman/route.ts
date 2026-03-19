import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const amortizations = await prisma.machineAmortization.findMany({
        where: { tenantId },
        include: { machine: { select: { brand: true, model: true, plate: true, type: true } } },
        orderBy: { purchaseDate: 'desc' },
    })

    const enriched = amortizations.map((a: any) => {
        const yearsSince = (Date.now() - new Date(a.purchaseDate).getTime()) / (365.25 * 86400000)
        const annualDepreciation = Number(a.purchasePrice) / Number(a.usefulLifeYears)
        const totalDepreciation = Math.min(annualDepreciation * yearsSince, Number(a.purchasePrice))
        const currentValue = Math.max(Number(a.purchasePrice) - totalDepreciation, 0)
        const depreciationPct = Math.min((totalDepreciation / Number(a.purchasePrice)) * 100, 100)
        return { ...a, annualDepreciation, currentValue, depreciationPct: Math.round(depreciationPct) }
    })

    const totalFleetValue = enriched.reduce((s: number, a: any) => s + a.currentValue, 0)
    const totalPurchaseValue = enriched.reduce((s: number, a: any) => s + Number(a.purchasePrice), 0)

    return NextResponse.json({ amortizations: enriched, totalFleetValue, totalPurchaseValue })
}

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const body = await req.json()
    const { machineId, purchasePrice, purchaseDate, usefulLifeYears, notes } = body

    const amort = await prisma.machineAmortization.upsert({
        where: { machineId },
        create: {
            tenantId, machineId,
            purchasePrice: Number(purchasePrice),
            purchaseDate: new Date(purchaseDate),
            usefulLifeYears: Number(usefulLifeYears),
            notes: notes || null,
        },
        update: {
            purchasePrice: Number(purchasePrice),
            purchaseDate: new Date(purchaseDate),
            usefulLifeYears: Number(usefulLifeYears),
            notes: notes || null,
        },
    })

    return NextResponse.json({ amortization: amort }, { status: 201 })
}
