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
        const blacklisted = searchParams.get('blacklisted')

        const where: any = { tenantId }
        if (blacklisted === 'true') where.isBlacklisted = true
        if (blacklisted === 'false') where.isBlacklisted = false
        if (search) {
            where.OR = [
                { companyName: { contains: search, mode: 'insensitive' } },
                { contactPerson: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
            ]
        }

        const customers = await prisma.customer.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { rentals: true, sites: true } },
            },
        })

        return NextResponse.json(customers)
    } catch (error) {
        console.error('Müşteri listesi hatası:', error)
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })

        const tenantId = (session.user as any).tenantId
        const body = await req.json()

        const customer = await prisma.customer.create({
            data: {
                tenantId,
                companyName: body.companyName,
                contactPerson: body.contactPerson || null,
                phone: body.phone || null,
                email: body.email || null,
                address: body.address || null,
                taxOffice: body.taxOffice || null,
                taxNumber: body.taxNumber || null,
                notes: body.notes || null,
            },
        })

        return NextResponse.json(customer, { status: 201 })
    } catch (error) {
        console.error('Müşteri ekleme hatası:', error)
        return NextResponse.json({ error: 'Müşteri eklenirken hata oluştu' }, { status: 500 })
    }
}
