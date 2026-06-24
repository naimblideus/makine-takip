// /api/pazar/[id] — PUBLIC: ilan detayı (GET) + teklif/talep oluştur (POST)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { dispatchTenantAlert } from '@/lib/alert-dispatch'
import { rateLimited } from '@/lib/api-guard'

const TYPE_LABELS: Record<string, string> = { FORKLIFT: 'Forklift', EKSAVATOR: 'Ekskavatör', VINC: 'Vinç', DOZER: 'Dozer', KEPCE: 'Kepçe', GREYDER: 'Greyder', SILINDIR: 'Silindir', KAMYON: 'Kamyon', BEKO_LODER: 'Beko Loder', DIGER: 'Diğer' }

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const m = await prisma.machine.findFirst({
        where: { id, marketplaceListed: true },
        select: {
            id: true, brand: true, model: true, type: true, year: true, status: true,
            dailyRate: true, weeklyRate: true, monthlyRate: true, operatorIncRate: true,
            marketplaceCity: true, marketplaceNote: true, photo: true,
            tenant: { select: { name: true } },
        },
    })
    if (!m) return NextResponse.json({ error: 'İlan bulunamadı' }, { status: 404 })
    return NextResponse.json({
        listing: {
            ...m, typeLabel: TYPE_LABELS[m.type] || m.type, available: m.status === 'MUSAIT', ownerName: m.tenant?.name,
        },
    })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const limited = rateLimited(req, 'pazar-lead', 8, 60_000)
    if (limited) return limited

    const { requesterName, requesterPhone, requesterCity, message } = await req.json()
    if (!requesterName || String(requesterName).trim().length < 2) {
        return NextResponse.json({ error: 'Lütfen adınızı girin' }, { status: 400 })
    }

    const machine = await prisma.machine.findFirst({
        where: { id, marketplaceListed: true },
        select: { id: true, tenantId: true, brand: true, model: true, plate: true },
    })
    if (!machine) return NextResponse.json({ error: 'İlan bulunamadı' }, { status: 404 })

    await prisma.marketplaceLead.create({
        data: {
            ownerTenantId: machine.tenantId,
            machineId: machine.id,
            machineLabel: `${machine.brand} ${machine.model}${machine.plate ? ` (${machine.plate})` : ''}`,
            requesterName: String(requesterName).slice(0, 120),
            requesterPhone: requesterPhone ? String(requesterPhone).slice(0, 30) : null,
            requesterCity: requesterCity ? String(requesterCity).slice(0, 60) : null,
            message: message ? String(message).slice(0, 500) : null,
        },
    })

    // Makine sahibine anında bildir (borsa talebi = sıcak müşteri adayı)
    await dispatchTenantAlert(
        machine.tenantId,
        `Borsadan Talep: ${machine.brand} ${machine.model}`,
        `${requesterName}${requesterPhone ? ` (${requesterPhone})` : ''} bu makineyi kiralamak istiyor.${message ? ` Not: ${message}` : ''}`,
    )

    return NextResponse.json({ success: true })
}
