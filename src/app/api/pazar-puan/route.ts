// POST /api/pazar-puan — PUBLIC: tamamlanan işlem sonrası firmayı puanla
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimited } from '@/lib/api-guard'

export async function POST(req: NextRequest) {
    const limited = rateLimited(req, 'puan', 10, 60_000)
    if (limited) return limited

    const { escrowToken, rating, comment, reviewerName } = await req.json()
    const r = Math.round(Number(rating))
    if (!escrowToken || !(r >= 1 && r <= 5)) {
        return NextResponse.json({ error: 'Geçerli puan (1-5) gerekli' }, { status: 400 })
    }

    const escrow = await prisma.escrow.findFirst({ where: { payToken: escrowToken } })
    if (!escrow) return NextResponse.json({ error: 'İşlem bulunamadı' }, { status: 404 })
    if (escrow.status !== 'SERBEST') return NextResponse.json({ error: 'Yalnızca tamamlanmış işlemler puanlanabilir' }, { status: 400 })

    const existing = await prisma.marketplaceReview.findUnique({ where: { escrowId: escrow.id } })
    if (existing) return NextResponse.json({ error: 'Bu işlem zaten puanlanmış' }, { status: 400 })

    await prisma.marketplaceReview.create({
        data: {
            tenantId: escrow.ownerTenantId, escrowId: escrow.id, rentalId: escrow.rentalId,
            rating: r, comment: comment ? String(comment).slice(0, 400) : null,
            reviewerName: reviewerName ? String(reviewerName).slice(0, 120) : escrow.payerName,
        },
    })
    return NextResponse.json({ success: true })
}
