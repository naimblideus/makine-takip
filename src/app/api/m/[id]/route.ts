// /api/m/[id] — Public makine QR kartı: durum görüntüle + arıza bildir
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { dispatchTenantAlert } from '@/lib/alert-dispatch'
import { rateLimited } from '@/lib/api-guard'
import { ArizaSchema, parseBody } from '@/lib/schemas'

const STATUS_LABELS: Record<string, string> = { MUSAIT: 'Müsait', KIRADA: 'Kirada', BAKIMDA: 'Bakımda', ARIZALI: 'Arızalı' }

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const machine = await prisma.machine.findUnique({
        where: { id },
        select: {
            id: true, brand: true, model: true, plate: true, serialNumber: true, type: true, status: true, year: true,
            inspectionExpiry: true,
            tenant: { select: { name: true, phone: true } },
        },
    })
    if (!machine) return NextResponse.json({ error: 'Makine bulunamadı' }, { status: 404 })
    return NextResponse.json({
        machine: {
            id: machine.id, brand: machine.brand, model: machine.model, plate: machine.plate,
            serialNumber: machine.serialNumber, type: machine.type, year: machine.year,
            status: machine.status, statusLabel: STATUS_LABELS[machine.status] || machine.status,
            inspectionExpiry: machine.inspectionExpiry,
            tenantName: machine.tenant?.name, tenantPhone: machine.tenant?.phone,
        },
    })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const limited = rateLimited(req, 'ariza', 8, 60_000)
    if (limited) return limited
    const parsed = parseBody(ArizaSchema, await req.json())
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })
    const { description, reporterName, reporterPhone } = parsed.data

    const machine = await prisma.machine.findUnique({ where: { id }, select: { id: true, tenantId: true, brand: true, model: true, plate: true } })
    if (!machine) return NextResponse.json({ error: 'Makine bulunamadı' }, { status: 404 })

    const who = [reporterName, reporterPhone].filter(Boolean).join(' · ') || 'Anonim'
    await prisma.systemNotification.create({
        data: {
            tenantId: machine.tenantId,
            type: 'ARIZA_BILDIRIMI',
            title: `🔧 Arıza Bildirimi: ${machine.brand} ${machine.model}`,
            message: `${machine.plate || ''} — ${String(description).slice(0, 300)} (Bildiren: ${who})`,
            machineId: machine.id,
            data: { reporterName, reporterPhone, source: 'qr' },
        },
    })

    // Patron alarm kanalına anında bildir
    await dispatchTenantAlert(machine.tenantId, `Arıza Bildirimi: ${machine.brand} ${machine.model}`, `${machine.plate || ''} — ${String(description).slice(0, 200)}\nBildiren: ${who}`)

    return NextResponse.json({ success: true })
}
