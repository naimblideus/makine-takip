// POST /api/geofence/[id]/assign — Makine ata/kaldır
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(
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

        if (body.action === 'add' && body.machineId) {
            // Zaten atanmış mı kontrol et
            const existing = await prisma.geofenceMachine.findFirst({
                where: { geofenceId: id, machineId: body.machineId },
            })
            if (!existing) {
                await prisma.geofenceMachine.create({
                    data: { geofenceId: id, machineId: body.machineId },
                })
            }
        } else if (body.action === 'remove' && body.machineId) {
            await prisma.geofenceMachine.deleteMany({
                where: { geofenceId: id, machineId: body.machineId },
            })
        } else if (body.action === 'set' && Array.isArray(body.machineIds)) {
            // Mevcut atamaları sil, yenilerini ekle
            await prisma.geofenceMachine.deleteMany({ where: { geofenceId: id } })
            if (body.machineIds.length > 0) {
                await prisma.geofenceMachine.createMany({
                    data: body.machineIds.map((machineId: string) => ({
                        geofenceId: id,
                        machineId,
                    })),
                })
            }
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Geofence atama hatası:', error)
        return NextResponse.json({ error: 'Atama hatası' }, { status: 500 })
    }
}
