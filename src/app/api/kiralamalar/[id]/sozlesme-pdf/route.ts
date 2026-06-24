// GET /api/kiralamalar/[id]/sozlesme-pdf — Kira sözleşmesi PDF üretir
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { renderSozlesmePdf } from '@/lib/pdf/render'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const rental = await prisma.rental.findFirst({
        where: { id, tenantId },
        include: { machine: true, customer: true, site: true, operator: true },
    })
    if (!rental) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })

    const data = {
        tenant,
        rental,
        machine: rental.machine,
        customer: rental.customer,
        site: rental.site,
        operator: rental.operator,
    }

    const buffer = await renderSozlesmePdf(data)
    const fileName = `sozlesme-${id.slice(0, 8)}.pdf`

    return new NextResponse(new Uint8Array(buffer), {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${fileName}"`,
            'Cache-Control': 'no-store',
        },
    })
}
