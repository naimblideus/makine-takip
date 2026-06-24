// /api/admin/dealers/[id] — bayi güncelle / sil
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await requireSuperAdmin()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
    const { id } = await params
    const b = await req.json()

    const data: any = {}
    for (const k of ['name', 'contactName', 'phone', 'email', 'city', 'notes']) {
        if (b[k] !== undefined) data[k] = b[k]
    }
    if (b.commissionFirstYear !== undefined) data.commissionFirstYear = Number(b.commissionFirstYear)
    if (b.commissionRenewal !== undefined) data.commissionRenewal = Number(b.commissionRenewal)
    if (b.isActive !== undefined) data.isActive = !!b.isActive

    const dealer = await prisma.dealer.update({ where: { id }, data })
    return NextResponse.json({ dealer })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await requireSuperAdmin()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
    const { id } = await params

    // Bağlı tenant'ların bayi bağını kopar, sonra sil
    await prisma.tenant.updateMany({ where: { dealerId: id }, data: { dealerId: null } })
    await prisma.dealer.delete({ where: { id } })
    return NextResponse.json({ success: true })
}
