// /api/teklifler — Hızlı Teklif (Quote) funnel
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { QuoteCreateSchema, parseBody } from '@/lib/schemas'

const toMoney = (n: number) => Math.round((Number.isFinite(n) ? n : 0) * 100) / 100

function computeTotals(b: any) {
    const unitPrice = Number(b.unitPrice || 0)
    const qty = Number(b.quantity || 1)
    const transport = Number(b.transportCost || 0)
    const discount = Number(b.discount || 0)
    const taxRate = Number(b.taxRate ?? 20)
    const subtotal = toMoney(unitPrice * qty + transport - discount)
    const taxAmount = toMoney(subtotal * (taxRate / 100))
    const totalAmount = toMoney(subtotal + taxAmount)
    return { subtotal, taxAmount, totalAmount, taxRate }
}

export async function GET() {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const quotes = await prisma.quote.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { companyName: true } } },
    })

    const open = quotes.filter(q => ['TASLAK', 'GONDERILDI', 'GORUNTULENDI'].includes(q.status))
    const stats = {
        toplam: quotes.length,
        acik: open.length,
        kabul: quotes.filter(q => q.status === 'KABUL' || q.status === 'KIRALAMAYA_DONDU').length,
        acikTutar: toMoney(open.reduce((s, q) => s + Number(q.totalAmount), 0)),
        // basit dönüşüm oranı
        donusumOrani: quotes.length ? Math.round(quotes.filter(q => q.status === 'KIRALAMAYA_DONDU').length / quotes.length * 100) : 0,
    }

    return NextResponse.json({ quotes, stats })
}

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId
    const parsed = parseBody(QuoteCreateSchema, await req.json())
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })
    const b = parsed.data

    const { subtotal, taxAmount, totalAmount, taxRate } = computeTotals(b)

    // makine etiketi
    let machineLabel = b.machineLabel || null
    if (!machineLabel && b.machineId) {
        const m = await prisma.machine.findFirst({ where: { id: b.machineId, tenantId }, select: { brand: true, model: true, plate: true } })
        if (m) machineLabel = `${m.brand} ${m.model}${m.plate ? ` (${m.plate})` : ''}`
    }

    const validUntil = b.validUntil ? new Date(b.validUntil) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const quote = await prisma.quote.create({
        data: {
            tenantId,
            customerId: b.customerId || null,
            customerName: b.customerName,
            customerPhone: b.customerPhone || null,
            machineId: b.machineId || null,
            machineType: b.machineType || null,
            machineLabel,
            periodType: b.periodType || 'GUNLUK',
            unitPrice: Number(b.unitPrice),
            quantity: Number(b.quantity || 1),
            operatorIncluded: !!b.operatorIncluded,
            transportCost: b.transportCost ? Number(b.transportCost) : null,
            discount: b.discount ? Number(b.discount) : null,
            taxRate,
            subtotal,
            taxAmount,
            totalAmount,
            validUntil,
            notes: b.notes || null,
        },
    })

    return NextResponse.json({ quote }, { status: 201 })
}
