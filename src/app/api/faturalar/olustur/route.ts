import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })

        const tenantId = (session.user as any).tenantId
        const body = await req.json()

        // Fatura numarası oluştur
        const lastInvoice = await prisma.invoice.findFirst({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
        })
        const seq = lastInvoice
            ? parseInt(lastInvoice.invoiceNumber.split('-').pop() || '0') + 1
            : 1
        const invoiceNumber = `FTR-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`

        const invoice = await prisma.invoice.create({
            data: {
                tenantId,
                invoiceNumber,
                customerId: body.customerId,
                rentalId: body.rentalId || null,
                issueDate: new Date(body.issueDate),
                dueDate: new Date(body.dueDate),
                subtotal: parseFloat(body.subtotal),
                taxRate: body.taxRate ? parseFloat(body.taxRate) : 20,
                taxAmount: parseFloat(body.taxAmount),
                totalAmount: parseFloat(body.totalAmount),
                status: 'TASLAK',
                notes: body.notes || null,
            },
        })

        return NextResponse.json(invoice, { status: 201 })
    } catch (error) {
        console.error('Fatura oluşturma hatası:', error)
        return NextResponse.json({ error: 'Fatura oluşturulurken hata oluştu' }, { status: 500 })
    }
}
