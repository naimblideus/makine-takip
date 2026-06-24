// /api/teklif-portal/[token] — Public: müşteri teklifi görür ve kabul/ret eder
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimited } from '@/lib/api-guard'
import { TeklifPortalSchema, parseBody } from '@/lib/schemas'

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    const { token } = await params
    const quote = await prisma.quote.findFirst({
        where: { token },
        include: { tenant: { select: { name: true, phone: true, email: true } } },
    })
    if (!quote) return NextResponse.json({ error: 'Geçersiz veya süresi dolmuş teklif' }, { status: 404 })

    // Süre kontrolü
    if (quote.validUntil && new Date(quote.validUntil) < new Date() && quote.status !== 'KABUL') {
        if (quote.status !== 'SURESI_DOLDU') {
            await prisma.quote.update({ where: { id: quote.id }, data: { status: 'SURESI_DOLDU' } })
        }
    }
    // İlk görüntülemede işaretle
    if (!quote.viewedAt && ['GONDERILDI'].includes(quote.status)) {
        await prisma.quote.update({ where: { id: quote.id }, data: { viewedAt: new Date(), status: 'GORUNTULENDI' } })
    }

    return NextResponse.json({ quote })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    const { token } = await params
    const limited = rateLimited(req, 'teklif-portal', 10, 60_000)
    if (limited) return limited
    const parsed = parseBody(TeklifPortalSchema, await req.json())
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })
    const { action } = parsed.data

    const quote = await prisma.quote.findFirst({ where: { token } })
    if (!quote) return NextResponse.json({ error: 'Geçersiz teklif' }, { status: 404 })
    if (!['GONDERILDI', 'GORUNTULENDI'].includes(quote.status)) {
        return NextResponse.json({ error: 'Bu teklif zaten yanıtlanmış' }, { status: 400 })
    }
    if (quote.validUntil && new Date(quote.validUntil) < new Date()) {
        return NextResponse.json({ error: 'Teklifin süresi dolmuş' }, { status: 400 })
    }

    await prisma.quote.update({
        where: { id: quote.id },
        data: { status: action, respondedAt: new Date() },
    })
    return NextResponse.json({ success: true, status: action })
}
