import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })

        const tenantId = (session.user as any).tenantId

        const payments = await prisma.payment.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            include: {
                invoice: {
                    select: {
                        invoiceNumber: true,
                        customer: { select: { companyName: true } },
                    },
                },
            },
        })

        // Flatten customer info for frontend compatibility
        const result = payments.map(p => ({
            ...p,
            customer: p.invoice?.customer || null,
        }))

        return NextResponse.json(result)
    } catch (error) {
        console.error('Ödeme listesi hatası:', error)
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })

        const tenantId = (session.user as any).tenantId
        const body = await req.json()

        // If no invoiceId provided but customerId, find latest unpaid invoice for customer
        let invoiceId = body.invoiceId
        if (!invoiceId && body.customerId) {
            const latestInvoice = await prisma.invoice.findFirst({
                where: {
                    tenantId,
                    customerId: body.customerId,
                    status: { in: ['ONAYLANDI', 'KISMI_ODENDI', 'GECIKTI'] },
                },
                orderBy: { createdAt: 'desc' },
            })
            invoiceId = latestInvoice?.id
        }

        if (!invoiceId) {
            return NextResponse.json({ error: 'İlgili fatura bulunamadı' }, { status: 400 })
        }

        const payment = await prisma.payment.create({
            data: {
                tenantId,
                invoiceId,
                amount: parseFloat(body.amount),
                method: body.method,
                status: 'ODENDI',
                paidAt: new Date(body.paidAt || Date.now()),
                notes: body.notes || null,
            },
        })

        return NextResponse.json(payment, { status: 201 })
    } catch (error) {
        console.error('Ödeme ekleme hatası:', error)
        return NextResponse.json({ error: 'Ödeme eklenirken hata oluştu' }, { status: 500 })
    }
}
