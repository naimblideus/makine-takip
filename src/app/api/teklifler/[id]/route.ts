// /api/teklifler/[id] — teklif detay / durum / sil
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const quote = await prisma.quote.findFirst({
        where: { id, tenantId },
        include: { customer: { select: { companyName: true, phone: true } } },
    })
    if (!quote) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
    return NextResponse.json({ quote })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId
    const body = await req.json()

    const quote = await prisma.quote.findFirst({ where: { id, tenantId } })
    if (!quote) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

    const data: any = {}
    if (body.status) data.status = body.status
    // Müşteriye gönderilince kriptografik token üret
    if (body.status === 'GONDERILDI' && !quote.token) {
        data.token = randomBytes(24).toString('hex')
    }
    if (body.notes !== undefined) data.notes = body.notes
    if (body.validUntil) data.validUntil = new Date(body.validUntil)

    const updated = await prisma.quote.update({ where: { id }, data })
    return NextResponse.json({ quote: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const quote = await prisma.quote.findFirst({ where: { id, tenantId } })
    if (!quote) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
    if (quote.status === 'KIRALAMAYA_DONDU') return NextResponse.json({ error: 'Kiralamaya dönmüş teklif silinemez' }, { status: 400 })

    await prisma.quote.delete({ where: { id } })
    return NextResponse.json({ success: true })
}
