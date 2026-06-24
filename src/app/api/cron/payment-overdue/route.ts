// GET /api/cron/payment-overdue — Vadesi geçen faturaları GECIKTI yap + gecikme faizi
// TBK uyarınca tenant-ayarlı aylık ticari faiz. Günlük çalışır.
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { dispatchTenantAlert } from '@/lib/alert-dispatch'
import { cronAuthorized } from '@/lib/api-guard'

const toMoney = (n: number) => Math.round((Number.isFinite(n) ? n : 0) * 100) / 100
const tl = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n)

export async function GET(req: NextRequest) {
    if (!cronAuthorized(req)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const now = new Date()
    const tenants = await prisma.tenant.findMany({ where: { id: { not: 'system-admin' } }, select: { id: true, name: true, lateFeeMonthlyRate: true } })
    let updated = 0
    const results: any[] = []

    for (const t of tenants) {
        const rate = Number(t.lateFeeMonthlyRate || 0)
        const overdue = await prisma.invoice.findMany({
            where: { tenantId: t.id, status: { in: ['ONAYLANDI', 'KISMI_ODENDI'] }, dueDate: { lt: now } },
            include: { customer: { select: { companyName: true } } },
        })

        let tenantOverdueTL = 0
        for (const inv of overdue) {
            const agg = await prisma.payment.aggregate({ where: { invoiceId: inv.id, status: 'ODENDI' }, _sum: { amount: true } })
            const paid = Number(agg._sum.amount || 0)
            const remaining = Number(inv.totalAmount) - paid
            if (remaining <= 0.01) {
                await prisma.invoice.update({ where: { id: inv.id }, data: { status: 'ODENDI' } })
                continue
            }
            const daysOver = Math.floor((now.getTime() - new Date(inv.dueDate!).getTime()) / (1000 * 60 * 60 * 24))
            const months = Math.max(1, Math.ceil(daysOver / 30))
            const lateFee = toMoney(remaining * (rate / 100) * months)

            await prisma.invoice.update({ where: { id: inv.id }, data: { status: 'GECIKTI', lateFee: lateFee || null } })
            updated++
            tenantOverdueTL += remaining + lateFee
        }

        if (overdue.length > 0) {
            await dispatchTenantAlert(t.id, 'Vadesi Geçmiş Tahsilat', `${overdue.length} fatura gecikmiş · toplam ${tl(tenantOverdueTL)}${rate > 0 ? ' (gecikme faizi dahil)' : ''}`)
            results.push({ tenant: t.name, overdueCount: overdue.length, overdueTL: toMoney(tenantOverdueTL) })
        }
    }

    return NextResponse.json({ success: true, updated, results, timestamp: now.toISOString() })
}
