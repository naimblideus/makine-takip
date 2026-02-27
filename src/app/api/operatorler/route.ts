import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })

        const tenantId = (session.user as any).tenantId
        const { searchParams } = new URL(req.url)
        const search = searchParams.get('search')

        const where: any = { tenantId }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { tcNumber: { contains: search, mode: 'insensitive' } },
            ]
        }

        const operators = await prisma.operator.findMany({
            where,
            orderBy: { name: 'asc' },
            include: {
                rentals: {
                    where: { status: 'AKTIF' },
                    take: 1,
                    include: {
                        machine: { select: { brand: true, model: true } },
                        customer: { select: { companyName: true } },
                    },
                },
                _count: { select: { timesheets: true } },
            },
        })

        return NextResponse.json(operators)
    } catch (error) {
        console.error('Operatör listesi hatası:', error)
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })

        const tenantId = (session.user as any).tenantId
        const body = await req.json()

        const operator = await prisma.operator.create({
            data: {
                tenantId,
                name: body.name,
                tcNumber: body.tcNumber || null,
                phone: body.phone || null,
                address: body.address || body.notes || null,
                licenseClass: body.licenseClass || null,
                licenseExpiry: body.licenseExpiry ? new Date(body.licenseExpiry) : null,
                machineTypes: body.machineTypes || [],
                dailyWage: body.dailyWage || null,
            },
        })

        return NextResponse.json(operator, { status: 201 })
    } catch (error) {
        console.error('Operatör ekleme hatası:', error)
        return NextResponse.json({ error: 'Operatör eklenirken hata oluştu' }, { status: 500 })
    }
}
