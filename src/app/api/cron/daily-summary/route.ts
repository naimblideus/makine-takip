// GET /api/cron/daily-summary — Her akşam patrona günlük WhatsApp/SMS özeti
// "Bugün 6 makine çalıştı, 47 saat, 2 alarm, ₺X fatura, ₺Y tahsil." → yapışkanlık.
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { dispatchTenantAlert } from '@/lib/alert-dispatch'
import { cronAuthorized } from '@/lib/api-guard'

const tl = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n)

export async function GET(req: NextRequest) {
    if (!cronAuthorized(req)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const now = new Date()
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tenants = await prisma.tenant.findMany({ where: { id: { not: 'system-admin' } }, select: { id: true, name: true } })
    const results: any[] = []

    for (const t of tenants) {
        const [sessions, alarms, invoicesToday, paymentsToday, overdue] = await Promise.all([
            prisma.engineSession.findMany({ where: { tenantId: t.id, startedAt: { gte: dayStart } }, select: { durationMinutes: true, machineId: true } }),
            prisma.systemNotification.count({ where: { tenantId: t.id, createdAt: { gte: dayStart }, type: { in: ['YAKIT_HIRSIZLIGI', 'GEOFENCE_IHLALI', 'YETKISIZ_KULLANIM', 'HIZ_IHLALI'] } } }),
            prisma.invoice.aggregate({ where: { tenantId: t.id, issueDate: { gte: dayStart } }, _sum: { totalAmount: true }, _count: true }),
            prisma.payment.aggregate({ where: { tenantId: t.id, paidAt: { gte: dayStart }, status: 'ODENDI' }, _sum: { amount: true } }),
            prisma.invoice.aggregate({ where: { tenantId: t.id, status: 'GECIKTI' }, _sum: { totalAmount: true } }),
        ])

        const workedMachines = new Set(sessions.map(s => s.machineId)).size
        const totalHours = Math.round(sessions.reduce((s, x) => s + (x.durationMinutes || 0), 0) / 60 * 10) / 10
        const issued = Number(invoicesToday._sum.totalAmount || 0)
        const collected = Number(paymentsToday._sum.amount || 0)
        const overdueTL = Number(overdue._sum.totalAmount || 0)

        const lines = [
            `🚜 ${workedMachines} makine çalıştı · ${totalHours} saat (motor doğrulamalı)`,
            alarms > 0 ? `⚠ ${alarms} alarm (yakıt/geofence/yetkisiz/hız)` : `✅ Alarm yok`,
            invoicesToday._count > 0 ? `🧾 ${invoicesToday._count} fatura · ${tl(issued)}` : null,
            collected > 0 ? `💰 ${tl(collected)} tahsil edildi` : null,
            overdueTL > 0 ? `🔴 ${tl(overdueTL)} gecikmiş alacak` : null,
        ].filter(Boolean) as string[]

        await dispatchTenantAlert(t.id, `Günlük Özet · ${now.toLocaleDateString('tr-TR')}`, lines.join('\n'))
        results.push({ tenant: t.name, workedMachines, totalHours, alarms, issued, collected, overdueTL })
    }

    return NextResponse.json({ success: true, count: results.length, results, timestamp: now.toISOString() })
}
