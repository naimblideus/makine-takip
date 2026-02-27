import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })

        const { id } = await params
        const tenantId = (session.user as any).tenantId

        const customer = await prisma.customer.findFirst({
            where: { id, tenantId },
            include: {
                rentals: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    include: {
                        machine: { select: { brand: true, model: true, plate: true } },
                    },
                },
                sites: { orderBy: { name: 'asc' } },
                invoices: {
                    orderBy: { issueDate: 'desc' },
                    take: 5,
                },
                _count: { select: { rentals: true, sites: true, invoices: true } },
            },
        })

        if (!customer) return NextResponse.json({ error: 'Müşteri bulunamadı' }, { status: 404 })
        return NextResponse.json(customer)
    } catch (error) {
        console.error('Müşteri detay hatası:', error)
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })

        const { id } = await params
        const tenantId = (session.user as any).tenantId
        const body = await req.json()

        const existing = await prisma.customer.findFirst({ where: { id, tenantId } })
        if (!existing) return NextResponse.json({ error: 'Müşteri bulunamadı' }, { status: 404 })

        const customer = await prisma.customer.update({
            where: { id },
            data: {
                companyName: body.companyName,
                contactPerson: body.contactPerson || null,
                phone: body.phone || null,
                email: body.email || null,
                taxNumber: body.taxNumber || null,
                taxOffice: body.taxOffice || null,
                address: body.address || null,
                isBlacklisted: body.isBlacklisted === 'true' || body.isBlacklisted === true,
                notes: body.notes || null,
            },
        })

        return NextResponse.json(customer)
    } catch (error) {
        console.error('Müşteri güncelleme hatası:', error)
        return NextResponse.json({ error: 'Güncelleme hatası' }, { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })

        const { id } = await params
        const tenantId = (session.user as any).tenantId

        const existing = await prisma.customer.findFirst({ where: { id, tenantId } })
        if (!existing) return NextResponse.json({ error: 'Müşteri bulunamadı' }, { status: 404 })

        await prisma.customer.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Müşteri silme hatası:', error)
        return NextResponse.json({ error: 'Silme hatası' }, { status: 500 })
    }
}
