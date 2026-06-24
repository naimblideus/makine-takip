// GET /api/portal/[token]/pdf — Müşteri portalı: imzalı hakediş PDF (public, token korumalı)
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { renderHakedisPdf } from '@/lib/pdf/render'

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    const { token } = await params

    const hakedis = await prisma.hakedis.findFirst({
        where: { customerToken: token },
        include: {
            rental: { include: { machine: true, customer: true, site: true, operator: true } },
        },
    })
    if (!hakedis) return NextResponse.json({ error: 'Geçersiz link' }, { status: 404 })

    const tenant = await prisma.tenant.findUnique({ where: { id: hakedis.tenantId } })

    const data = {
        tenant,
        hakedis,
        machine: hakedis.rental?.machine,
        customer: hakedis.rental?.customer,
        site: hakedis.rental?.site,
        operator: hakedis.rental?.operator,
    }

    const buffer = await renderHakedisPdf(data)

    return new NextResponse(new Uint8Array(buffer), {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="hakedis-${token.slice(0, 8)}.pdf"`,
            'Cache-Control': 'no-store',
        },
    })
}
