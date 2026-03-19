import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const rules = await prisma.pricingRule.findMany({
        where: { tenantId, isActive: true },
        orderBy: [{ machineType: 'asc' }, { periodType: 'asc' }],
    })

    return NextResponse.json({ rules })
}

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const body = await req.json()
    const { machineType, periodType, basePrice, seasonMultiplier, longTermDiscount, loyaltyDiscount, operatorIncRate, minRentalDays, notes } = body

    const rule = await prisma.pricingRule.create({
        data: {
            tenantId, machineType, periodType,
            basePrice: Number(basePrice),
            seasonMultiplier: Number(seasonMultiplier || 1),
            longTermDiscount: Number(longTermDiscount || 0),
            loyaltyDiscount: Number(loyaltyDiscount || 0),
            operatorIncRate: Number(operatorIncRate || 0),
            minRentalDays: minRentalDays ? Number(minRentalDays) : null,
            notes: notes || null,
        },
    })

    return NextResponse.json({ rule }, { status: 201 })
}
