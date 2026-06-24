// POST /api/teklifler/[id]/convert — Teklifi Kiralamaya dönüştür (funnel kapanışı)
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId
    const body = await req.json().catch(() => ({}))

    const quote = await prisma.quote.findFirst({ where: { id, tenantId } })
    if (!quote) return NextResponse.json({ error: 'Teklif bulunamadı' }, { status: 404 })
    if (quote.rentalId) return NextResponse.json({ error: 'Bu teklif zaten kiralamaya dönüştürülmüş' }, { status: 400 })

    // Müşteri: teklifte customerId yoksa serbest isimden müşteri oluştur
    let customerId = quote.customerId
    if (!customerId) {
        const customer = await prisma.customer.create({
            data: { tenantId, companyName: quote.customerName, phone: quote.customerPhone || null },
        })
        customerId = customer.id
    }

    // Makine: teklifte makine seçiliyse onu, yoksa body'den / tipe uygun müsait makine
    let machineId = quote.machineId || body.machineId
    if (!machineId && quote.machineType) {
        const m = await prisma.machine.findFirst({ where: { tenantId, type: quote.machineType, status: 'MUSAIT' }, select: { id: true } })
        machineId = m?.id
    }
    if (!machineId) return NextResponse.json({ error: 'Kiralama için bir makine seçin (uygun müsait makine bulunamadı)' }, { status: 400 })

    const startDate = body.startDate ? new Date(body.startDate) : new Date()

    const result = await prisma.$transaction(async (tx) => {
        const rental = await tx.rental.create({
            data: {
                tenantId,
                machineId,
                customerId: customerId!,
                status: 'AKTIF',
                periodType: quote.periodType,
                unitPrice: quote.unitPrice,
                operatorIncluded: quote.operatorIncluded,
                startDate,
                deposit: null,
                notes: `Teklif #${quote.id.slice(0, 8)}'den oluşturuldu.${quote.notes ? ' ' + quote.notes : ''}`,
            },
        })
        await tx.machine.update({ where: { id: machineId! }, data: { status: 'KIRADA' } })
        await tx.quote.update({ where: { id }, data: { status: 'KIRALAMAYA_DONDU', rentalId: rental.id, customerId } })
        return rental
    })

    return NextResponse.json({ success: true, rentalId: result.id })
}
