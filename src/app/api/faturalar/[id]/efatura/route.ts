// POST /api/faturalar/[id]/efatura — Faturayı e-Fatura/e-Arşiv olarak GİB'e gönder
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEInvoice } from '@/lib/efatura'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const invoice = await prisma.invoice.findFirst({ where: { id, tenantId }, include: { customer: true } })
    if (!invoice) return NextResponse.json({ error: 'Fatura bulunamadı' }, { status: 404 })
    if (invoice.efaturaStatus && invoice.efaturaStatus !== 'HATA') {
        return NextResponse.json({ error: 'Bu fatura zaten gönderilmiş', efaturaStatus: invoice.efaturaStatus }, { status: 400 })
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    const result = await sendEInvoice({ invoice, customer: invoice.customer, tenant })

    if (result.ok) {
        await prisma.invoice.update({
            where: { id },
            data: {
                efaturaUuid: result.uuid || null,
                efaturaEttn: result.ettn || null,
                efaturaStatus: result.status,
                efaturaSentAt: new Date(),
            },
        })
    }

    return NextResponse.json({ success: result.ok, result })
}
