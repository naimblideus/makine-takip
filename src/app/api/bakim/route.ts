import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })

        const tenantId = (session.user as any).tenantId

        const records = await prisma.maintenance.findMany({
            where: { tenantId },
            orderBy: { performedAt: 'desc' },
            include: {
                machine: { select: { brand: true, model: true, plate: true } },
            },
        })

        return NextResponse.json(records)
    } catch (error) {
        console.error('Bakım listesi hatası:', error)
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })

        const tenantId = (session.user as any).tenantId
        const body = await req.json()

        const record = await prisma.maintenance.create({
            data: {
                tenantId,
                machineId: body.machineId,
                type: body.type,
                description: [body.description, body.notes].filter(Boolean).join(' — ') || null,
                performedAt: new Date(body.performedAt),
                cost: body.cost ? parseFloat(body.cost) : null,
                parts: body.parts || null,
                serviceName: body.serviceName || null,
                machineHoursAt: body.machineHoursAt ? parseInt(body.machineHoursAt) : null,
                nextMaintenanceDate: body.nextMaintenanceDate ? new Date(body.nextMaintenanceDate) : null,
                nextMaintenanceHours: body.nextMaintenanceHours ? parseInt(body.nextMaintenanceHours) : null,
            },
        })

        return NextResponse.json(record, { status: 201 })
    } catch (error) {
        console.error('Bakım ekleme hatası:', error)
        return NextResponse.json({ error: 'Bakım kaydı eklenirken hata oluştu' }, { status: 500 })
    }
}
