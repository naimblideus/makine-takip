import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { parseBody, FaturaCreateSchema } from '@/lib/schemas'
import { toMoney, taxOf } from '@/lib/calc'

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })
        const tenantId = (session.user as any).tenantId

        const parsed = parseBody(FaturaCreateSchema, await req.json().catch(() => null))
        if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })
        const b = parsed.data

        // Müşteri bu tenant'a ait mı (cross-tenant bütünlük)
        const customer = await prisma.customer.findFirst({ where: { id: b.customerId, tenantId }, select: { id: true } })
        if (!customer) return NextResponse.json({ error: 'Müşteri bulunamadı' }, { status: 404 })

        // Para SUNUCUDA hesaplanır (kuruş-temiz; istemcinin gönderdiği tutara güvenme)
        const subtotal = toMoney(b.subtotal)
        const taxAmount = taxOf(subtotal, b.taxRate)
        const totalAmount = toMoney(subtotal + taxAmount)

        // Fatura numarası
        const lastInvoice = await prisma.invoice.findFirst({ where: { tenantId }, orderBy: { createdAt: 'desc' } })
        const seq = lastInvoice
            ? parseInt(lastInvoice.invoiceNumber.split('-').pop() || '0') + 1
            : 1
        const invoiceNumber = `FTR-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`

        const invoice = await prisma.invoice.create({
            data: {
                tenantId,
                invoiceNumber,
                customerId: b.customerId,
                rentalId: b.rentalId || null,
                issueDate: new Date(b.issueDate),
                dueDate: new Date(b.dueDate),
                subtotal,
                taxRate: b.taxRate,
                taxAmount,
                totalAmount,
                status: 'TASLAK',
                notes: b.notes || null,
            },
        })

        return NextResponse.json(invoice, { status: 201 })
    } catch (error) {
        console.error('Fatura oluşturma hatası:', error)
        return NextResponse.json({ error: 'Fatura oluşturulurken hata oluştu' }, { status: 500 })
    }
}
