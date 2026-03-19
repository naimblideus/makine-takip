import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const rentalId = searchParams.get('rentalId')
    const customerId = searchParams.get('customerId')

    const where: any = { tenantId }
    if (status) where.status = status
    if (rentalId) where.rentalId = rentalId
    if (customerId) where.customerId = customerId

    const hakedisler = await prisma.hakedis.findMany({
        where,
        include: {
            rental: {
                include: {
                    machine: { select: { brand: true, model: true, plate: true, type: true } },
                    customer: { select: { companyName: true, contactPerson: true, phone: true } },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    })

    // Özet istatistikler
    const stats = {
        taslak: hakedisler.filter(h => h.status === 'TASLAK').length,
        onayBekliyor: hakedisler.filter(h => h.status === 'ONAY_BEKLIYOR' || h.status === 'MUSTERI_ONAY_BEKLIYOR').length,
        onaylandi: hakedisler.filter(h => h.status === 'ONAYLANDI' || h.status === 'MUSTERI_ONAYLADI').length,
        faturalandi: hakedisler.filter(h => h.status === 'FATURALANDI').length,
        toplamTutar: hakedisler.reduce((s, h) => s + Number(h.totalAmount), 0),
    }

    return NextResponse.json({ hakedisler, stats })
}

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const body = await req.json()
    const {
        rentalId, periodStart, periodEnd, periodLabel,
        totalHours, workingDays, idleHours, overtimeHours,
        unitPrice, periodType, fuelCost, operatorCost, transportCost,
        extraCosts, discount, taxRate, notes, photos,
    } = body

    // Kiralama bilgisini al
    const rental = await prisma.rental.findFirst({ where: { id: rentalId, tenantId } })
    if (!rental) return NextResponse.json({ error: 'Kiralama bulunamadı' }, { status: 404 })

    const price = Number(unitPrice || rental.unitPrice)
    const hours = Number(totalHours || 0)
    const days = Number(workingDays || 0)
    const tRate = Number(taxRate || 20)
    const disc = Number(discount || 0)
    const fuel = Number(fuelCost || 0)
    const opCost = Number(operatorCost || 0)
    const transp = Number(transportCost || 0)
    const extra = extraCosts ? (extraCosts as any[]).reduce((s: number, e: any) => s + Number(e.amount || 0), 0) : 0

    let subtotal = 0
    if (periodType === 'SAATLIK') subtotal = price * hours
    else if (periodType === 'GUNLUK') subtotal = price * days
    else if (periodType === 'HAFTALIK') subtotal = price * Math.ceil(days / 7)
    else subtotal = price * Math.ceil(days / 30)

    subtotal += fuel + opCost + transp + extra - disc
    const taxAmount = subtotal * (tRate / 100)
    const totalAmount = subtotal + taxAmount

    const hakedis = await prisma.hakedis.create({
        data: {
            tenantId,
            rentalId,
            machineId: rental.machineId,
            customerId: rental.customerId,
            operatorId: rental.operatorId,
            periodStart: new Date(periodStart),
            periodEnd: new Date(periodEnd),
            periodLabel: periodLabel || `${new Date(periodStart).toLocaleDateString('tr-TR')} - ${new Date(periodEnd).toLocaleDateString('tr-TR')}`,
            totalHours: hours,
            workingDays: days,
            idleHours: idleHours ? Number(idleHours) : null,
            overtimeHours: overtimeHours ? Number(overtimeHours) : null,
            unitPrice: price,
            periodType: (rental as any).periodType,
            subtotal,
            fuelCost: fuel || null,
            operatorCost: opCost || null,
            transportCost: transp || null,
            extraCosts: extraCosts || null,
            discount: disc || null,
            taxRate: tRate,
            taxAmount,
            totalAmount,
            notes: notes || null,
            photos: photos || [],
            preparedBy: (session.user as any).name,
        },
    })

    return NextResponse.json({ hakedis }, { status: 201 })
}
