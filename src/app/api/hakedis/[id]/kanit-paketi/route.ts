// GET /api/hakedis/[id]/kanit-paketi — İtirazsız delil paketi PDF
// Hakediş + dönem içi motor oturumları + GPS olayları + imzalar.
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { renderKanitPaketiPdf } from '@/lib/pdf/render'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const hakedis = await prisma.hakedis.findFirst({
        where: { id, tenantId },
        include: { rental: { include: { machine: true, customer: true, site: true, operator: true } } },
    })
    if (!hakedis) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

    const [tenant, sessions, gpsLogs] = await Promise.all([
        prisma.tenant.findUnique({ where: { id: tenantId } }),
        prisma.engineSession.findMany({
            where: { tenantId, machineId: hakedis.machineId, startedAt: { gte: hakedis.periodStart, lte: hakedis.periodEnd } },
            orderBy: { startedAt: 'asc' },
        }),
        prisma.gpsLog.findMany({
            where: { tenantId, machineId: hakedis.machineId, createdAt: { gte: hakedis.periodStart, lte: hakedis.periodEnd } },
            orderBy: { createdAt: 'desc' },
            take: 25,
        }),
    ])

    const data = {
        tenant, hakedis, sessions, gpsLogs,
        machine: hakedis.rental?.machine,
        customer: hakedis.rental?.customer,
        site: hakedis.rental?.site,
        operator: hakedis.rental?.operator,
    }

    const buffer = await renderKanitPaketiPdf(data)
    return new NextResponse(new Uint8Array(buffer), {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="delil-paketi-${id.slice(0, 8)}.pdf"`,
            'Cache-Control': 'no-store',
        },
    })
}
