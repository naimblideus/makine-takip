// PUT & DELETE /api/geofence/[id]
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })

        const tenantId = (session.user as any).tenantId
        const { id } = await params
        const body = await req.json()

        const geofence = await prisma.geofence.findFirst({ where: { id, tenantId } })
        if (!geofence) return NextResponse.json({ error: 'Geofence bulunamadı' }, { status: 404 })

        const updated = await prisma.geofence.update({
            where: { id },
            data: {
                name: body.name ?? geofence.name,
                siteId: body.siteId !== undefined ? body.siteId : geofence.siteId,
                coordinates: body.coordinates ?? geofence.coordinates,
                actionOnBreach: body.actionOnBreach ?? geofence.actionOnBreach,
                isActive: body.isActive !== undefined ? body.isActive : geofence.isActive,
            },
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error('Geofence güncelleme hatası:', error)
        return NextResponse.json({ error: 'Güncelleme hatası' }, { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })

        const tenantId = (session.user as any).tenantId
        const { id } = await params

        const geofence = await prisma.geofence.findFirst({ where: { id, tenantId } })
        if (!geofence) return NextResponse.json({ error: 'Geofence bulunamadı' }, { status: 404 })

        await prisma.geofence.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Geofence silme hatası:', error)
        return NextResponse.json({ error: 'Silme hatası' }, { status: 500 })
    }
}
