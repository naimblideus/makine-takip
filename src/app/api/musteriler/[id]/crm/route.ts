import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Müşteri CRM Etkileşimleri
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const [customer, interactions, rating] = await Promise.all([
        prisma.customer.findFirst({
            where: { id, tenantId },
            include: {
                rentals: {
                    include: { invoices: { include: { payments: true } } },
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
                rating: true,
            },
        }),
        prisma.customerInteraction.findMany({
            where: { customerId: id, tenantId },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.customerRating.findFirst({ where: { customerId: id, tenantId } }),
    ])

    if (!customer) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

    // CRM özeti hesapla
    const totalRentals = customer.rentals.length
    const totalRevenue = customer.rentals.reduce((s, r) => {
        return s + r.invoices.reduce((s2, inv) => {
            return s2 + inv.payments.filter(p => p.status === 'ODENDI').reduce((s3, p) => s3 + Number(p.amount), 0)
        }, 0)
    }, 0)

    return NextResponse.json({ customer, interactions, rating, crmSummary: { totalRentals, totalRevenue } })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const body = await req.json()
    const { type, title, description, outcome, nextAction, nextActionDate } = body

    const interaction = await prisma.customerInteraction.create({
        data: {
            tenantId,
            customerId: id,
            type, title,
            description: description || null,
            outcome: outcome || null,
            nextAction: nextAction || null,
            nextActionDate: nextActionDate ? new Date(nextActionDate) : null,
            createdBy: (session.user as any).name,
        },
    })

    return NextResponse.json({ interaction }, { status: 201 })
}
