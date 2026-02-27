// GET & POST /api/geofence — Geofence CRUD
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })

        const tenantId = (session.user as any).tenantId

        const geofences = await prisma.geofence.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            include: {
                site: { select: { name: true } },
                assignedMachines: {
                    include: { machine: { select: { id: true, brand: true, model: true, plate: true } } },
                },
                _count: { select: { breaches: true } },
            },
        })

        return NextResponse.json(geofences)
    } catch (error) {
        console.error('Geofence listeleme hatası:', error)
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })

        const tenantId = (session.user as any).tenantId
        const body = await req.json()

        const geofence = await prisma.geofence.create({
            data: {
                tenantId,
                name: body.name,
                siteId: body.siteId || null,
                type: body.type || 'POLYGON',
                coordinates: body.coordinates,
                actionOnBreach: body.actionOnBreach || 'ALERT',
            },
        })

        // Makineleri ata
        if (body.machineIds?.length) {
            await prisma.geofenceMachine.createMany({
                data: body.machineIds.map((machineId: string) => ({
                    geofenceId: geofence.id,
                    machineId,
                })),
            })
        }

        return NextResponse.json(geofence, { status: 201 })
    } catch (error) {
        console.error('Geofence oluşturma hatası:', error)
        return NextResponse.json({ error: 'Geofence oluşturulamadı' }, { status: 500 })
    }
}
