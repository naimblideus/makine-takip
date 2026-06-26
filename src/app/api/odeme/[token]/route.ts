// /api/odeme/[token] — PUBLIC: ödeme sayfası verisi (GET) + ödeme onayı/callback (POST)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PAYMENT_MOCK } from '@/lib/payment'

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    const { token } = await params
    const invoice = await prisma.invoice.findFirst({
        where: { payToken: token },
        include: { customer: { select: { companyName: true } }, tenant: { select: { name: true } } },
    })
    if (!invoice) return NextResponse.json({ error: 'Ödeme linki geçersiz' }, { status: 404 })

    const agg = await prisma.payment.aggregate({ where: { invoiceId: invoice.id, status: 'ODENDI' }, _sum: { amount: true } })
    const paid = Number(agg._sum.amount || 0)
    const total = Number(invoice.totalAmount) + Number(invoice.lateFee || 0)
    const remaining = Math.max(0, Math.round((total - paid) * 100) / 100)

    return NextResponse.json({
        invoiceNumber: invoice.invoiceNumber,
        total, remaining,
        status: invoice.status,
        paid: invoice.status === 'ODENDI' || remaining <= 0.01,
        customerName: invoice.customer?.companyName,
        tenantName: invoice.tenant?.name,
        mock: PAYMENT_MOCK,
    })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    const { token } = await params
    const invoice = await prisma.invoice.findFirst({ where: { payToken: token } })
    if (!invoice) return NextResponse.json({ error: 'Geçersiz link' }, { status: 404 })
    if (invoice.status === 'ODENDI') return NextResponse.json({ success: true, already: true })

    // NOT: Gerçek iyzico'da burada token ile iyzipay.checkoutForm.retrieve(token) çağrılıp
    // ödemenin GERÇEKTEN başarılı olduğu doğrulanır. MOCK modda doğrudan onaylanır.

    const agg = await prisma.payment.aggregate({ where: { invoiceId: invoice.id, status: 'ODENDI' }, _sum: { amount: true } })
    const paid = Number(agg._sum.amount || 0)
    const total = Number(invoice.totalAmount) + Number(invoice.lateFee || 0)
    const remaining = Math.max(0, Math.round((total - paid) * 100) / 100)
    if (remaining <= 0.01) {
        await prisma.invoice.update({ where: { id: invoice.id }, data: { status: 'ODENDI', providerStatus: 'ODENDI' } })
        return NextResponse.json({ success: true })
    }

    await prisma.$transaction(async (tx) => {
        // Atomik compare-and-set — eşzamanlı/tekrarlı onayda çift Payment'i önler
        const flipped = await tx.invoice.updateMany({
            where: { id: invoice.id, status: { not: 'ODENDI' } },
            data: { status: 'ODENDI', providerStatus: 'ODENDI' },
        })
        if (flipped.count === 0) return // zaten ödendi → idempotent
        await tx.payment.create({
            data: {
                tenantId: invoice.tenantId, invoiceId: invoice.id,
                amount: remaining, method: 'KREDI_KARTI', status: 'ODENDI',
                paidAt: new Date(), providerRef: invoice.providerRef || `pay_${token.slice(0, 10)}`,
                notes: 'Online ödeme (kredi kartı)',
            },
        })
    })

    return NextResponse.json({ success: true })
}
