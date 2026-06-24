// GET /api/abonelik — mevcut abonelik durumu + kullanım
// PUT /api/abonelik — plan değiştir (MVP: anında uygula; gerçek tahsilat Faz 1 iyzico)
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSubscription, PLANS, type PlanKey } from '@/lib/subscription'

export async function GET() {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId
    const sub = await getSubscription(tenantId)
    return NextResponse.json({ subscription: sub, plans: Object.values(PLANS) })
}

export async function PUT(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    if ((session.user as any).role !== 'ADMIN') {
        return NextResponse.json({ error: 'Sadece yönetici plan değiştirebilir' }, { status: 403 })
    }
    const tenantId = (session.user as any).tenantId
    const { plan, billingCycle } = await req.json()
    const data: any = {}
    if (plan) {
        if (!(plan in PLANS)) return NextResponse.json({ error: 'Geçersiz plan' }, { status: 400 })
        data.plan = plan
        data.machineLimit = PLANS[plan as PlanKey].machineLimit
        data.subscriptionStatus = 'ACTIVE' // MVP: online tahsilat iyzico ile (en son faz)
    }
    if (billingCycle === 'MONTHLY' || billingCycle === 'YEARLY') data.billingCycle = billingCycle
    if (Object.keys(data).length === 0) return NextResponse.json({ error: 'Değişiklik belirtilmedi' }, { status: 400 })

    await prisma.tenant.update({ where: { id: tenantId }, data })
    const sub = await getSubscription(tenantId)
    return NextResponse.json({ subscription: sub })
}
