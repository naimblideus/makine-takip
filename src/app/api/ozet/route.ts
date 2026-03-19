import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Günlük özet + WhatsApp formatı
export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayEnd = new Date(todayStart.getTime() + 86400000)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    const [
        machineStats,
        todayRentals,
        overduePayments,
        pendingHakedis,
        expiringDocs,
        upcomingMaintenance,
        monthRevenue,
    ] = await Promise.all([
        prisma.machine.groupBy({ by: ['status'], where: { tenantId }, _count: true }),
        prisma.rental.findMany({
            where: { tenantId, OR: [{ startDate: { gte: todayStart, lt: todayEnd } }, { endDate: { gte: todayStart, lt: todayEnd } }] },
            include: { machine: { select: { brand: true, model: true } }, customer: { select: { companyName: true } } },
        }),
        prisma.invoice.count({ where: { tenantId, status: 'GECIKTI' } }),
        prisma.hakedis.count({ where: { tenantId, status: { in: ['ONAY_BEKLIYOR', 'MUSTERI_ONAY_BEKLIYOR'] } } }),
        prisma.document.count({ where: { tenantId, expiryDate: { gte: today, lte: new Date(today.getTime() + 7 * 86400000) } } }),
        prisma.maintenanceSchedule.count({ where: { tenantId, nextDueDate: { gte: today, lte: new Date(today.getTime() + 7 * 86400000) } } }),
        prisma.payment.aggregate({ where: { tenantId, status: 'ODENDI', paidAt: { gte: monthStart } }, _sum: { amount: true } }),
    ])

    const stats: Record<string, number> = {}
    machineStats.forEach((s: any) => { stats[s.status] = s._count })

    const monthRev = Number(monthRevenue._sum.amount || 0)

    // WhatsApp formatı
    const wa = [
        `🏗 *Günaydın! Filo Durumu (${today.toLocaleDateString('tr-TR')})*`,
        ``,
        `📊 *Makine Durumu:*`,
        `✅ ${stats.KIRADA || 0} kirada  |  🟢 ${stats.MUSAIT || 0} müsait`,
        `🔧 ${stats.BAKIMDA || 0} bakımda  |  🔴 ${stats.ARIZALI || 0} arızalı`,
        ``,
        `💰 *Bu Ay Gelir:* ₺${monthRev.toLocaleString('tr-TR')}`,
        overduePayments > 0 ? `⚠️ *Gecikmiş Fatura:* ${overduePayments} adet` : '',
        pendingHakedis > 0 ? `📋 *Onay Bekleyen Hakediş:* ${pendingHakedis} adet` : '',
        expiringDocs > 0 ? `📄 *Süresi Dolacak Belge (7 gün):* ${expiringDocs} adet` : '',
        upcomingMaintenance > 0 ? `🔧 *Yaklaşan Bakım (7 gün):* ${upcomingMaintenance} adet` : '',
        ``,
        todayRentals.length > 0 ? `📅 *Bugün:*\n${todayRentals.map((r: any) => `• ${r.machine?.brand} ${r.machine?.model} — ${r.customer?.companyName}`).join('\n')}` : '',
    ].filter(Boolean).join('\n')

    return NextResponse.json({
        stats: { ...stats, overduePayments, pendingHakedis, expiringDocs, upcomingMaintenance, monthRevenue: monthRev },
        todayRentals,
        whatsappText: wa,
    })
}
