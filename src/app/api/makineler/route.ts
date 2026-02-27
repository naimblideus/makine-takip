import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })
        }

        const tenantId = (session.user as any).tenantId
        const { searchParams } = new URL(req.url)
        const status = searchParams.get('status')
        const search = searchParams.get('search')
        const type = searchParams.get('type')
        const gpsOnly = searchParams.get('gpsOnly')

        const where: any = { tenantId }

        if (status && status !== 'all') {
            where.status = status
        }

        if (type && type !== 'all') {
            where.type = type
        }

        if (gpsOnly === 'true') {
            where.gpsEnabled = true
        }

        if (search) {
            where.OR = [
                { plate: { contains: search, mode: 'insensitive' } },
                { brand: { contains: search, mode: 'insensitive' } },
                { model: { contains: search, mode: 'insensitive' } },
                { serialNumber: { contains: search, mode: 'insensitive' } },
            ]
        }

        const machines = await prisma.machine.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                rentals: {
                    where: { status: 'AKTIF' },
                    take: 1,
                    include: {
                        customer: { select: { companyName: true } },
                    },
                },
            },
        })

        return NextResponse.json(machines)
    } catch (error) {
        console.error('Makine listesi hatası:', error)
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })
        }

        const tenantId = (session.user as any).tenantId
        const body = await req.json()

        const machine = await prisma.machine.create({
            data: {
                tenantId,
                plate: body.plate || null,
                serialNumber: body.serialNumber || null,
                brand: body.brand,
                model: body.model,
                year: body.year ? parseInt(body.year) : null,
                type: body.type,
                status: body.status || 'MUSAIT',
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
                traccarDeviceId: body.traccarDeviceId || null,
                speedLimit: body.speedLimit ? parseInt(body.speedLimit) : null,
                gpsEnabled: body.gpsEnabled || false,
                fuelCapacity: body.fuelCapacity || null,
                fuelSensorEnabled: body.fuelSensorEnabled || false,
                engineHoursSensor: body.engineHoursSensor || false,
                idleThresholdMinutes: body.idleThresholdMinutes ? parseInt(body.idleThresholdMinutes) : 15,
            },
        })

        return NextResponse.json(machine, { status: 201 })
    } catch (error) {
        console.error('Makine ekleme hatası:', error)
        return NextResponse.json({ error: 'Makine eklenirken hata oluştu' }, { status: 500 })
    }
}
