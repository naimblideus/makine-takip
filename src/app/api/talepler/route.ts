// /api/talepler — AUTHED (kiralamacı): açık talepler (GET) + teklif ver (POST)
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSms } from '@/lib/messaging'

export async function GET() {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const [rfqs, myBids] = await Promise.all([
        prisma.rfq.findMany({
            where: { status: { in: ['ACIK', 'TEKLIF_ALDI'] } },
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: { _count: { select: { bids: true } } },
        }),
        prisma.rfqBid.findMany({ where: { tenantId }, select: { rfqId: true, unitPrice: true, status: true } }),
    ])
    const bidMap = Object.fromEntries(myBids.map(b => [b.rfqId, b]))

    return NextResponse.json({
        rfqs: rfqs.map(r => ({ ...r, bidCount: r._count.bids, myBid: bidMap[r.id] || null })),
    })
}

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId
    const b = await req.json()

    if (!b.rfqId || !b.unitPrice || Number(b.unitPrice) <= 0) {
        return NextResponse.json({ error: 'Talep ve geçerli birim fiyat gerekli' }, { status: 400 })
    }

    const rfq = await prisma.rfq.findFirst({ where: { id: b.rfqId, status: { in: ['ACIK', 'TEKLIF_ALDI'] } } })
    if (!rfq) return NextResponse.json({ error: 'Talep bulunamadı veya kapanmış' }, { status: 404 })

    // Aynı firma tekrar teklif vermesin (güncelle)
    const existing = await prisma.rfqBid.findFirst({ where: { rfqId: rfq.id, tenantId } })

    let machineLabel = b.machineLabel || null
    if (!machineLabel && b.machineId) {
        const m = await prisma.machine.findFirst({ where: { id: b.machineId, tenantId }, select: { brand: true, model: true, plate: true } })
        if (m) machineLabel = `${m.brand} ${m.model}${m.plate ? ` (${m.plate})` : ''}`
    }

    const data = {
        machineId: b.machineId || null, machineLabel,
        unitPrice: Number(b.unitPrice), periodType: (b.periodType || rfq.periodType),
        operatorIncluded: !!b.operatorIncluded, note: b.note ? String(b.note).slice(0, 400) : null,
        status: 'GONDERILDI',
    }

    if (existing) {
        await prisma.rfqBid.update({ where: { id: existing.id }, data })
    } else {
        await prisma.rfqBid.create({ data: { rfqId: rfq.id, tenantId, ...data } })
    }
    if (rfq.status === 'ACIK') await prisma.rfq.update({ where: { id: rfq.id }, data: { status: 'TEKLIF_ALDI' } })

    // Talep sahibine "yeni teklif" SMS'i (token linkiyle)
    if (rfq.requesterPhone) {
        const base = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin
        sendSms(rfq.requesterPhone, `Talebinize yeni teklif geldi: ${Number(b.unitPrice)} TL. Karsilastir/onayla: ${base}/talep/${rfq.token}`).catch(() => { })
    }

    return NextResponse.json({ success: true })
}
