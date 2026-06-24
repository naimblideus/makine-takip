// GET /api/hakedis/telemetri — Hakediş öncesi telemetri önizleme (doğrulama paneli)
// Kiralama + dönem + (opsiyonel) beyan saati ile motor çalışma saatini ve farkı döner.
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTelemetryHours, buildGpsReport } from '@/lib/hakedis-telemetry'

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const sp = new URL(req.url).searchParams
    const rentalId = sp.get('rentalId')
    const periodStart = sp.get('periodStart')
    const periodEnd = sp.get('periodEnd')
    const manualHours = Number(sp.get('manualHours') || 0)

    if (!rentalId || !periodStart || !periodEnd) {
        return NextResponse.json({ error: 'rentalId, periodStart ve periodEnd gerekli' }, { status: 400 })
    }

    const rental = await prisma.rental.findFirst({
        where: { id: rentalId, tenantId },
        include: { machine: { select: { brand: true, model: true, plate: true, gpsEnabled: true, traccarDeviceId: true } } },
    })
    if (!rental) return NextResponse.json({ error: 'Kiralama bulunamadı' }, { status: 404 })

    const unitPrice = Number(rental.unitPrice)
    const summary = await getTelemetryHours(
        rental.machineId,
        new Date(periodStart),
        new Date(periodEnd),
        tenantId,
        rentalId,
    )
    const report = buildGpsReport(summary, manualHours, unitPrice)

    return NextResponse.json({ summary, report, unitPrice, machine: rental.machine })
}
