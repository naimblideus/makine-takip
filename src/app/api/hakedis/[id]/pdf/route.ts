// GET /api/hakedis/[id]/pdf — Hakediş PDF üretir (telemetri doğrulama tablosu dahil)
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { renderHakedisPdf } from '@/lib/pdf/render'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const hakedis = await prisma.hakedis.findFirst({
        where: { id, tenantId },
        include: {
            rental: { include: { machine: true, customer: true, site: true, operator: true } },
        },
    })
    if (!hakedis) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })

    const data = {
        tenant,
        hakedis,
        machine: hakedis.rental?.machine,
        customer: hakedis.rental?.customer,
        site: hakedis.rental?.site,
        operator: hakedis.rental?.operator,
    }

    const buffer = await renderHakedisPdf(data)
    const fileName = `hakedis-${hakedis.periodLabel?.replace(/[^\w]/g, '_') || id.slice(0, 8)}.pdf`

    return new NextResponse(new Uint8Array(buffer), {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${fileName}"`,
            'Cache-Control': 'no-store',
        },
    })
}
