// /api/admin/dealers — Bayi (dealer) yönetimi (super-admin)
// GET: bayiler + her bayinin tenant/makine/aylık tekrarlayan gelir + komisyon
// POST: yeni bayi
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/auth'
import { PLANS, type PlanKey } from '@/lib/subscription'

function pricePerMachine(plan: string): number {
    return PLANS[(plan as PlanKey)]?.pricePerMachine ?? PLANS.PRO.pricePerMachine
}

export async function GET() {
    const session = await requireSuperAdmin()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

    const dealers = await prisma.dealer.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            tenants: {
                select: { id: true, name: true, plan: true, _count: { select: { machines: true } } },
            },
        },
    })

    const enriched = dealers.map((d) => {
        let machines = 0
        let mrr = 0
        for (const t of d.tenants) {
            const m = t._count.machines
            machines += m
            mrr += m * pricePerMachine(t.plan)
        }
        const commission = Math.round(mrr * Number(d.commissionFirstYear) / 100)
        return {
            ...d,
            tenantCount: d.tenants.length,
            machineCount: machines,
            mrr,                       // bayinin getirdiği aylık tekrarlayan gelir
            commissionMonthly: commission,
        }
    })

    const totals = {
        dealerCount: enriched.length,
        tenantCount: enriched.reduce((s, d) => s + d.tenantCount, 0),
        mrr: enriched.reduce((s, d) => s + d.mrr, 0),
        commissionMonthly: enriched.reduce((s, d) => s + d.commissionMonthly, 0),
    }

    return NextResponse.json({ dealers: enriched, totals })
}

export async function POST(req: NextRequest) {
    const session = await requireSuperAdmin()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

    const b = await req.json()
    if (!b.name) return NextResponse.json({ error: 'Bayi adı zorunlu' }, { status: 400 })

    const dealer = await prisma.dealer.create({
        data: {
            name: b.name,
            contactName: b.contactName || null,
            phone: b.phone || null,
            email: b.email || null,
            city: b.city || null,
            commissionFirstYear: b.commissionFirstYear != null ? Number(b.commissionFirstYear) : 25,
            commissionRenewal: b.commissionRenewal != null ? Number(b.commissionRenewal) : 10,
            notes: b.notes || null,
        },
    })
    return NextResponse.json({ dealer }, { status: 201 })
}
