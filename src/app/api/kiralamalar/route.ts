import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })

        const tenantId = (session.user as any).tenantId
        const { searchParams } = new URL(req.url)
        const status = searchParams.get('status')
        const search = searchParams.get('search')

        const where: any = { tenantId }
        if (status && status !== 'all') where.status = status
        if (search) {
            where.OR = [
                { machine: { brand: { contains: search, mode: 'insensitive' } } },
                { machine: { model: { contains: search, mode: 'insensitive' } } },
                { machine: { plate: { contains: search, mode: 'insensitive' } } },
                { customer: { companyName: { contains: search, mode: 'insensitive' } } },
            ]
        }

        const rentals = await prisma.rental.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                machine: { select: { brand: true, model: true, plate: true, type: true } },
                customer: { select: { companyName: true, contactPerson: true, phone: true } },
                operator: { select: { name: true, phone: true } },
                site: { select: { name: true, address: true } },
            },
        })

        return NextResponse.json(rentals)
    } catch (error) {
        console.error('Kiralama listesi hatası:', error)
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })

        const tenantId = (session.user as any).tenantId
        const body = await req.json()

        // Makine müsait mi kontrol et
        const machine = await prisma.machine.findFirst({
            where: { id: body.machineId, tenantId },
        })
        if (!machine) return NextResponse.json({ error: 'Makine bulunamadı' }, { status: 404 })
        if (machine.status === 'KIRADA') return NextResponse.json({ error: 'Bu makine zaten kirada' }, { status: 400 })

        // Kiralama oluştur + makine durumunu güncelle
        const [rental] = await prisma.$transaction([
            prisma.rental.create({
                data: {
                    tenantId,
                    machineId: body.machineId,
                    customerId: body.customerId,
                    siteId: body.siteId || null,
                    operatorId: body.operatorId || null,
                    status: 'AKTIF',
                    periodType: body.periodType,
                    unitPrice: parseFloat(body.unitPrice),
                    operatorIncluded: body.operatorIncluded || false,
                    startDate: new Date(body.startDate),
                    deliveryHours: body.deliveryHours ? parseInt(body.deliveryHours) : null,
                    deliveryFuel: body.deliveryFuel || null,
                    deposit: body.deposit ? parseFloat(body.deposit) : null,
                    notes: body.notes || null,
                },
            }),
            prisma.machine.update({
                where: { id: body.machineId },
                data: { status: 'KIRADA' },
            }),
        ])

        return NextResponse.json(rental, { status: 201 })
    } catch (error) {
        console.error('Kiralama oluşturma hatası:', error)
        return NextResponse.json({ error: 'Kiralama oluşturulurken hata oluştu' }, { status: 500 })
    }
}
