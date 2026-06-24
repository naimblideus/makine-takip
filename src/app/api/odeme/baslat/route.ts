// POST /api/odeme/baslat — PUBLIC: bir fatura için online ödeme başlat (checkout linki üret)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createCheckout, genPayToken } from '@/lib/payment'
import { rateLimited } from '@/lib/api-guard'

export async function POST(req: NextRequest) {
    const limited = rateLimited(req, 'odeme-baslat', 10, 60_000)
    if (limited) return limited

    const { invoiceId } = await req.json()
    if (!invoiceId) return NextResponse.json({ error: 'Fatura belirtilmedi' }, { status: 400 })

    const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { customer: { select: { companyName: true } } },
    })
    if (!invoice) return NextResponse.json({ error: 'Fatura bulunamadı' }, { status: 404 })
    if (invoice.status === 'ODENDI') return NextResponse.json({ error: 'Bu fatura zaten ödenmiş' }, { status: 400 })

    const payToken = invoice.payToken || genPayToken()
    const amount = Number(invoice.totalAmount) + Number(invoice.lateFee || 0)
    const base = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin

    const checkout = await createCheckout({
        invoiceNumber: invoice.invoiceNumber, amount, payToken, baseUrl: base, buyerName: invoice.customer?.companyName,
    })

    await prisma.invoice.update({
        where: { id: invoice.id },
        data: { payToken, providerRef: checkout.ref, providerStatus: 'BEKLIYOR', checkoutUrl: checkout.checkoutUrl },
    })

    return NextResponse.json({ checkoutUrl: checkout.checkoutUrl, mock: checkout.mock })
}
