// /api/odeme/callback — PUBLIC: iyzico Checkout Form sonucu buraya POST'lar.
// Token ile ödeme GERÇEKTEN doğrulanır (retrieve), sonra fatura kapatılır.
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { retrieveCheckout } from '@/lib/payment'

async function markInvoicePaid(payToken: string) {
    const invoice = await prisma.invoice.findFirst({ where: { payToken } })
    if (!invoice || invoice.status === 'ODENDI') return
    const agg = await prisma.payment.aggregate({ where: { invoiceId: invoice.id, status: 'ODENDI' }, _sum: { amount: true } })
    const paid = Number(agg._sum.amount || 0)
    const total = Number(invoice.totalAmount) + Number(invoice.lateFee || 0)
    const remaining = Math.max(0, Math.round((total - paid) * 100) / 100)
    await prisma.$transaction(async (tx) => {
        if (remaining > 0.01) {
            await tx.payment.create({
                data: {
                    tenantId: invoice.tenantId, invoiceId: invoice.id,
                    amount: remaining, method: 'KREDI_KARTI', status: 'ODENDI',
                    paidAt: new Date(), providerRef: `iyzico_${payToken.slice(0, 12)}`,
                    notes: 'iyzico online ödeme',
                },
            })
        }
        await tx.invoice.update({ where: { id: invoice.id }, data: { status: 'ODENDI', providerStatus: 'ODENDI' } })
    })
}

export async function POST(req: NextRequest) {
    const base = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin
    try {
        const form = await req.formData().catch(() => null)
        const token = form?.get('token')?.toString() || new URL(req.url).searchParams.get('token') || ''
        if (!token) return NextResponse.redirect(`${base}/`, 303)
        const result = await retrieveCheckout(token)
        if (result.ok && result.conversationId) {
            await markInvoicePaid(result.conversationId)
        }
        return NextResponse.redirect(`${base}/odeme/${result.conversationId || ''}`, 303)
    } catch {
        return NextResponse.redirect(`${base}/`, 303)
    }
}
