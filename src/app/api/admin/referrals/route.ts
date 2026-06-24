// GET /api/admin/referrals — super-admin: tüm fintech yönlendirme talepleri (komisyon fırsatları)
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/auth'

export async function GET() {
    const session = await requireSuperAdmin()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })

    const leads = await prisma.referralLead.findMany({ orderBy: { createdAt: 'desc' }, take: 200 })
    const tenantIds = [...new Set(leads.map(l => l.tenantId))]
    const tenants = await prisma.tenant.findMany({ where: { id: { in: tenantIds } }, select: { id: true, name: true } })
    const tmap = Object.fromEntries(tenants.map(t => [t.id, t.name]))

    const byType = { SIGORTA: 0, LEASING: 0, YAKIT: 0 } as Record<string, number>
    leads.forEach(l => { byType[l.type] = (byType[l.type] || 0) + 1 })

    return NextResponse.json({
        leads: leads.map(l => ({ ...l, tenantName: tmap[l.tenantId] || '—' })),
        summary: { total: leads.length, byType },
    })
}
