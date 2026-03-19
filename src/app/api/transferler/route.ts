import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const transfers = await prisma.machineTransfer.findMany({
        where: { tenantId },
        include: {
            machine: { select: { brand: true, model: true, plate: true, type: true } },
        },
        orderBy: { transferDate: 'desc' },
        take: 100,
    })

    return NextResponse.json({ transfers })
}

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const body = await req.json()
    const { machineId, fromLocation, toLocation, fromLat, fromLng, toLat, toLng, transferDate, driver, vehiclePlate, cost, distance, notes } = body

    const transfer = await prisma.machineTransfer.create({
        data: {
            tenantId, machineId, fromLocation, toLocation,
            fromLat: fromLat ? Number(fromLat) : null,
            fromLng: fromLng ? Number(fromLng) : null,
            toLat: toLat ? Number(toLat) : null,
            toLng: toLng ? Number(toLng) : null,
            transferDate: new Date(transferDate),
            driver: driver || null,
            vehiclePlate: vehiclePlate || null,
            cost: cost ? Number(cost) : null,
            distance: distance ? Number(distance) : null,
            notes: notes || null,
        },
    })

    return NextResponse.json({ transfer }, { status: 201 })
}
