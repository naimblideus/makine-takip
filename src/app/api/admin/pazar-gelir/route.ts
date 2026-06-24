// GET /api/admin/pazar-gelir — SÜPER ADMIN: platform gelir & pazar metrikleri
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PLANS } from '@/lib/subscription'

const AD_FEE = Number(process.env.MARKETPLACE_AD_FEE || 500) // sponsorlu ilan aylık ücreti

export async function GET() {
    const session = await auth()
    if (!(session?.user as any)?.isSuperAdmin) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

    const [escrowGroups, featuredCount, tenants, rfqGroups, bidCount, reviewAgg] = await Promise.all([
        prisma.escrow.groupBy({ by: ['status'], _sum: { amount: true, commissionTL: true }, _count: true }),
        prisma.machine.count({ where: { marketplaceFeatured: true } }),
        prisma.tenant.findMany({ where: { id: { not: 'system-admin' } }, select: { plan: true, subscriptionStatus: true, _count: { select: { machines: true } } } }),
        prisma.rfq.groupBy({ by: ['status'], _count: true }),
        prisma.rfqBid.count(),
        prisma.marketplaceReview.aggregate({ _avg: { rating: true }, _count: true }),
    ])

    const esum = (st: string, f: 'amount' | 'commissionTL') => Number(escrowGroups.find(g => g.status === st)?._sum[f] || 0)
    const gmv = escrowGroups.reduce((s, g) => s + Number(g._sum.amount || 0), 0)
    const commissionTotal = escrowGroups.reduce((s, g) => s + Number(g._sum.commissionTL || 0), 0)
    const float = esum('TUTULUYOR', 'amount')
    const releasedCommission = esum('SERBEST', 'commissionTL')
    const adRevenue = featuredCount * AD_FEE

    // Abonelik MRR (makine-başı plan): aktif tenant'ların makineCount × birim fiyat
    let mrr = 0, payingTenants = 0
    const planCounts: Record<string, number> = {}
    for (const t of tenants) {
        const plan = (t.plan as keyof typeof PLANS) || 'PRO'
        const price = PLANS[plan]?.pricePerMachine || 0
        const active = !['CANCELED', 'PAST_DUE'].includes(t.subscriptionStatus || 'ACTIVE')
        if (active) { mrr += (t._count?.machines || 0) * price; payingTenants++ }
        planCounts[plan] = (planCounts[plan] || 0) + 1
    }

    const rfqTotal = rfqGroups.reduce((s, g) => s + Number(g._count), 0)
    const rfqClosed = Number(rfqGroups.find(g => g.status === 'KAPANDI')?._count || 0)

    return NextResponse.json({
        // Para
        gmv, commissionTotal, releasedCommission, float, adRevenue, featuredCount, adFee: AD_FEE,
        mrr, payingTenants, planCounts,
        platformMonthly: mrr + adRevenue, // tekrarlayan aylık (abonelik + reklam); komisyon işlem-başı
        // Pazar
        rfq: { total: rfqTotal, open: rfqTotal - rfqClosed, closed: rfqClosed, bids: bidCount, conversion: rfqTotal ? Math.round(rfqClosed / rfqTotal * 100) : 0 },
        reputation: { avg: reviewAgg._avg.rating ? Math.round(reviewAgg._avg.rating * 10) / 10 : null, count: reviewAgg._count },
        escrowBreakdown: escrowGroups.map(g => ({ status: g.status, count: Number(g._count), amount: Number(g._sum.amount || 0), commission: Number(g._sum.commissionTL || 0) })),
    })
}
