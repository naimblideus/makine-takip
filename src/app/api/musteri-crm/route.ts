import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    // Tüm müşteriler + rating + son etkileşim + kiralama sayısı
    const customers = await prisma.customer.findMany({
        where: { tenantId },
        include: {
            rating: true,
            interactions: {
                orderBy: { createdAt: 'desc' },
                take: 1,
            },
            rentals: {
                select: { id: true, unitPrice: true, status: true },
            },
            invoices: {
                select: {
                    totalAmount: true,
                    status: true,
                    payments: { select: { amount: true, status: true } },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    })

    // CRM verisi hazırla
    const crmData = customers.map(c => {
        const totalRentals = c.rentals.length
        const activeRentals = c.rentals.filter(r => r.status === 'AKTIF').length
        const totalRevenue = c.invoices.reduce((sum, inv) => {
            return sum + inv.payments
                .filter(p => p.status === 'ODENDI')
                .reduce((s, p) => s + Number(p.amount), 0)
        }, 0)
        const overdueInvoices = c.invoices.filter(i => i.status === 'GECIKTI').length

        return {
            id: c.id,
            companyName: c.companyName,
            contactPerson: c.contactPerson,
            phone: c.phone,
            email: c.email,
            isBlacklisted: c.isBlacklisted,
            totalRentals,
            activeRentals,
            totalRevenue,
            overdueInvoices,
            tier: c.rating?.tier || 'STANDART',
            paymentScore: c.rating?.paymentScore || 50,
            loyaltyScore: c.rating?.loyaltyScore || 50,
            riskScore: c.rating?.riskScore || 50,
            lastInteraction: c.interactions[0] || null,
            ratingId: c.rating?.id || null,
        }
    })

    // Tier dağılımı
    const tierCounts = { VIP: 0, PREMIUM: 0, STANDART: 0, RISKLI: 0 }
    crmData.forEach(c => {
        const tier = c.tier as keyof typeof tierCounts
        if (tier in tierCounts) tierCounts[tier]++
    })

    // Top 10 ciro bazlı
    const topCustomers = [...crmData]
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10)

    return NextResponse.json({
        customers: crmData,
        tierCounts,
        topCustomers,
        totalCustomers: crmData.length,
    })
}

// Tier güncelle
export async function PUT(req: Request) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId
    const body = await req.json()
    const { customerId, tier, paymentScore, loyaltyScore, riskScore, notes } = body

    const existing = await prisma.customerRating.findFirst({
        where: { customerId, tenantId },
    })

    if (existing) {
        const updated = await prisma.customerRating.update({
            where: { id: existing.id },
            data: {
                tier: tier || undefined,
                paymentScore: paymentScore !== undefined ? Number(paymentScore) : undefined,
                loyaltyScore: loyaltyScore !== undefined ? Number(loyaltyScore) : undefined,
                riskScore: riskScore !== undefined ? Number(riskScore) : undefined,
                notes: notes !== undefined ? notes : undefined,
            },
        })
        return NextResponse.json({ rating: updated })
    } else {
        const created = await prisma.customerRating.create({
            data: {
                tenantId,
                customerId,
                tier: tier || 'STANDART',
                paymentScore: Number(paymentScore || 50),
                loyaltyScore: Number(loyaltyScore || 50),
                riskScore: Number(riskScore || 50),
                notes: notes || null,
            },
        })
        return NextResponse.json({ rating: created }, { status: 201 })
    }
}
