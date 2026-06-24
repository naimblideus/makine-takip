// /api/borsa — Kiralama borsası yönetimi (tenant): ilanlar + gelen talepler
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const PLATFORM_COMMISSION = Number(process.env.MARKETPLACE_COMMISSION_PCT || 4) // %

export async function GET() {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const [machines, leads] = await Promise.all([
        prisma.machine.findMany({
            where: { tenantId },
            orderBy: [{ marketplaceListed: 'desc' }, { status: 'asc' }],
            select: { id: true, brand: true, model: true, plate: true, type: true, status: true, dailyRate: true, marketplaceListed: true, marketplaceCity: true, marketplaceNote: true, marketplaceFeatured: true },
        }),
        prisma.marketplaceLead.findMany({ where: { ownerTenantId: tenantId }, orderBy: { createdAt: 'desc' }, take: 50 }),
    ])

    const listedCount = machines.filter(m => m.marketplaceListed).length
    const openLeads = leads.filter(l => l.status === 'YENI').length

    return NextResponse.json({
        machines, leads,
        summary: { listedCount, totalMachines: machines.length, openLeads, totalLeads: leads.length, commissionPct: PLATFORM_COMMISSION },
    })
}

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId
    const { machineId, listed, city, note, featured } = await req.json()

    const machine = await prisma.machine.findFirst({ where: { id: machineId, tenantId }, select: { id: true } })
    if (!machine) return NextResponse.json({ error: 'Makine bulunamadı' }, { status: 404 })

    const data: any = {}
    if (listed !== undefined) data.marketplaceListed = !!listed
    if (city !== undefined) data.marketplaceCity = city || null
    if (note !== undefined) data.marketplaceNote = note || null
    if (featured !== undefined) data.marketplaceFeatured = !!featured
    // İlandan çıkarılırsa öne çıkarmayı da kaldır
    if (listed === false) data.marketplaceFeatured = false

    await prisma.machine.update({ where: { id: machineId }, data })
    return NextResponse.json({ success: true })
}

export async function PUT(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId
    const { leadId, status } = await req.json()

    const lead = await prisma.marketplaceLead.findFirst({ where: { id: leadId, ownerTenantId: tenantId }, select: { id: true } })
    if (!lead) return NextResponse.json({ error: 'Talep bulunamadı' }, { status: 404 })

    await prisma.marketplaceLead.update({ where: { id: leadId }, data: { status } })
    return NextResponse.json({ success: true })
}
