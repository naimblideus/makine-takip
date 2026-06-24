// GET /api/teklifler/[id]/pdf — Fiyat teklifi PDF
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { renderTeklifPdf } from '@/lib/pdf/render'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const quote = await prisma.quote.findFirst({ where: { id, tenantId } })
    if (!quote) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    const buffer = await renderTeklifPdf({ tenant, quote })

    return new NextResponse(new Uint8Array(buffer), {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="teklif-${id.slice(0, 8)}.pdf"`,
            'Cache-Control': 'no-store',
        },
    })
}
