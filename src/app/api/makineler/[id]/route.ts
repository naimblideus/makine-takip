import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })
        }

        const { id } = await params
        const tenantId = (session.user as any).tenantId

        const machine = await prisma.machine.findFirst({
            where: { id, tenantId },
            include: {
                rentals: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    include: {
                        customer: { select: { companyName: true } },
                        operator: { select: { name: true } },
                        site: { select: { name: true } },
                    },
                },
                fuelEntries: {
                    orderBy: { date: 'desc' },
                    take: 5,
                },
                maintenances: {
                    orderBy: { performedAt: 'desc' },
                    take: 5,
                },
            },
        })

        if (!machine) {
            return NextResponse.json({ error: 'Makine bulunamadı' }, { status: 404 })
        }

        return NextResponse.json(machine)
    } catch (error) {
        console.error('Makine detay hatası:', error)
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })
        }

        const { id } = await params
        const tenantId = (session.user as any).tenantId
        const body = await req.json()

        const existing = await prisma.machine.findFirst({
            where: { id, tenantId },
        })

        if (!existing) {
            return NextResponse.json({ error: 'Makine bulunamadı' }, { status: 404 })
        }

        const machine = await prisma.machine.update({
            where: { id },
            data: {
                plate: body.plate || null,
                serialNumber: body.serialNumber || null,
                brand: body.brand,
                model: body.model,
                year: body.year ? parseInt(body.year) : null,
                type: body.type,
                status: body.status,
                hourlyRate: body.hourlyRate || null,
                dailyRate: body.dailyRate || null,
                weeklyRate: body.weeklyRate || null,
                monthlyRate: body.monthlyRate || null,
                operatorIncRate: body.operatorIncRate || null,
                insuranceExpiry: body.insuranceExpiry ? new Date(body.insuranceExpiry) : null,
                inspectionExpiry: body.inspectionExpiry ? new Date(body.inspectionExpiry) : null,
                totalHours: body.totalHours || 0,
                notes: body.notes || null,
                // GPS alanları
                traccarDeviceId: body.traccarDeviceId !== undefined ? (body.traccarDeviceId || null) : undefined,
                speedLimit: body.speedLimit !== undefined ? (body.speedLimit ? parseInt(body.speedLimit) : null) : undefined,
                gpsEnabled: body.gpsEnabled !== undefined ? body.gpsEnabled : undefined,
                fuelCapacity: body.fuelCapacity !== undefined ? (body.fuelCapacity || null) : undefined,
                fuelSensorEnabled: body.fuelSensorEnabled !== undefined ? body.fuelSensorEnabled : undefined,
                engineHoursSensor: body.engineHoursSensor !== undefined ? body.engineHoursSensor : undefined,
                idleThresholdMinutes: body.idleThresholdMinutes !== undefined ? parseInt(body.idleThresholdMinutes) : undefined,
            },
        })


        return NextResponse.json(machine)
    } catch (error) {
        console.error('Makine güncelleme hatası:', error)
        return NextResponse.json({ error: 'Güncelleme hatası' }, { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })
        }

        const { id } = await params
        const tenantId = (session.user as any).tenantId

        const existing = await prisma.machine.findFirst({
            where: { id, tenantId },
        })

        if (!existing) {
            return NextResponse.json({ error: 'Makine bulunamadı' }, { status: 404 })
        }

        await prisma.machine.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Makine silme hatası:', error)
        return NextResponse.json({ error: 'Silme hatası' }, { status: 500 })
    }
}
