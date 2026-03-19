import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const doc = await prisma.document.findFirst({ where: { id, tenantId } })
    if (!doc) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

    const body = await req.json()
    const updated = await prisma.document.update({ where: { id }, data: body })
    return NextResponse.json({ document: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const doc = await prisma.document.findFirst({ where: { id, tenantId } })
    if (!doc) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
    await prisma.document.delete({ where: { id } })
    return NextResponse.json({ success: true })
}
