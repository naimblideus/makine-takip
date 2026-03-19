import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const depots = await prisma.depot.findMany({
        where: { tenantId, isActive: true },
        orderBy: { name: 'asc' },
    })

    return NextResponse.json({ depots })
}

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const body = await req.json()
    const { name, address, lat, lng, capacity, contactName, contactPhone, notes } = body

    const depot = await prisma.depot.create({
        data: {
            tenantId, name,
            address: address || null,
            lat: lat ? Number(lat) : null,
            lng: lng ? Number(lng) : null,
            capacity: capacity ? Number(capacity) : null,
            contactName: contactName || null,
            contactPhone: contactPhone || null,
            notes: notes || null,
        },
    })

    return NextResponse.json({ depot }, { status: 201 })
}
