import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const hakedis = await prisma.hakedis.findFirst({
        where: { id, tenantId },
        include: {
            rental: {
                include: {
                    machine: true,
                    customer: true,
                    site: true,
                    operator: true,
                },
            },
        },
    })

    if (!hakedis) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
    return NextResponse.json({ hakedis })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const body = await req.json()

    const hakedis = await prisma.hakedis.findFirst({ where: { id, tenantId } })
    if (!hakedis) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

    // Durum değişikliği özel alanlar
    const updateData: any = { ...body }
    if (body.status === 'ONAYLANDI' && !hakedis.approvedAt) {
        updateData.approvedAt = new Date()
        updateData.approvedBy = (session.user as any).name
    }
    if (body.status === 'MUSTERI_ONAY_BEKLIYOR' && !hakedis.sentToCustomerAt) {
        updateData.sentToCustomerAt = new Date()
        // Token oluştur (müşteri portalı için)
        const { v4: uuidv4 } = await import('uuid')
        updateData.customerToken = uuidv4()
    }
    if (body.status === 'MUSTERI_ONAYLADI' && !hakedis.customerApprovedAt) {
        updateData.customerApprovedAt = new Date()
    }

    const updated = await prisma.hakedis.update({ where: { id }, data: updateData })
    return NextResponse.json({ hakedis: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const hakedis = await prisma.hakedis.findFirst({ where: { id, tenantId } })
    if (!hakedis) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
    if (hakedis.status === 'FATURALANDI') return NextResponse.json({ error: 'Faturalanan hakediş silinemez' }, { status: 400 })

    await prisma.hakedis.delete({ where: { id } })
    return NextResponse.json({ success: true })
}
