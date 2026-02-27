import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })
        }

        const tenantId = (session.user as any).tenantId

        // Makine durumları
        const machines = await prisma.machine.groupBy({
            by: ['status'],
            where: { tenantId },
            _count: true,
        })

        const machineStats = {
            MUSAIT: 0,
            KIRADA: 0,
            BAKIMDA: 0,
            ARIZALI: 0,
            total: 0,
        }

        machines.forEach((m) => {
            machineStats[m.status] = m._count
            machineStats.total += m._count
        })

        // Bu haftanın geliri
        const now = new Date()
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay() + 1) // Pazartesi
        weekStart.setHours(0, 0, 0, 0)

        const lastWeekStart = new Date(weekStart)
        lastWeekStart.setDate(lastWeekStart.getDate() - 7)

        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

        // Bu ay ödemeler
        const paidThisMonth = await prisma.payment.aggregate({
            where: {
                tenantId,
                status: 'ODENDI',
                paidAt: { gte: monthStart },
            },
            _sum: { amount: true },
        })

        const pendingPayments = await prisma.payment.aggregate({
            where: {
                tenantId,
                status: { in: ['BEKLIYOR', 'GECIKTI'] },
            },
            _sum: { amount: true },
        })

        // Gecikmiş ödemeler
        const overduePayments = await prisma.payment.count({
            where: {
                tenantId,
                status: 'GECIKTI',
            },
        })

        // Gecikmiş ödeme toplam
        const overdueAmount = await prisma.payment.aggregate({
            where: {
                tenantId,
                status: 'GECIKTI',
            },
            _sum: { amount: true },
        })

        // Sigorta/muayene süresi dolan makineler (30 gün içinde)
        const thirtyDaysLater = new Date(now)
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)

        const expiringInsurance = await prisma.machine.count({
            where: {
                tenantId,
                insuranceExpiry: { lte: thirtyDaysLater, gte: now },
            },
        })

        const expiredInsurance = await prisma.machine.count({
            where: {
                tenantId,
                insuranceExpiry: { lt: now },
            },
        })

        const expiringInspection = await prisma.machine.count({
            where: {
                tenantId,
                inspectionExpiry: { lte: thirtyDaysLater, gte: now },
            },
        })

        const expiredInspection = await prisma.machine.count({
            where: {
                tenantId,
                inspectionExpiry: { lt: now },
            },
        })

        // Bakımı yaklaşan makineler
        const maintenanceDue = await prisma.maintenance.count({
            where: {
                tenantId,
                nextMaintenanceDate: { lte: thirtyDaysLater, gte: now },
            },
        })

        // Son 5 kiralama
        const recentRentals = await prisma.rental.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
                machine: { select: { brand: true, model: true, plate: true } },
                customer: { select: { companyName: true } },
            },
        })

        // Uyarılar
        const alerts: { type: 'critical' | 'warning'; message: string }[] = []

        if (overduePayments > 0) {
            alerts.push({ type: 'critical', message: `${overduePayments} gecikmiş ödeme var` })
        }
        if (expiredInsurance > 0) {
            alerts.push({ type: 'critical', message: `${expiredInsurance} makinenin sigortası sona erdi` })
        }
        if (expiredInspection > 0) {
            alerts.push({ type: 'critical', message: `${expiredInspection} makinenin muayenesi sona erdi` })
        }
        if (machineStats.ARIZALI > 0) {
            alerts.push({ type: 'critical', message: `${machineStats.ARIZALI} arızalı makine var` })
        }
        if (expiringInsurance > 0) {
            alerts.push({ type: 'warning', message: `${expiringInsurance} makinenin sigortası 30 gün içinde doluyor` })
        }
        if (expiringInspection > 0) {
            alerts.push({ type: 'warning', message: `${expiringInspection} makinenin muayenesi 30 gün içinde doluyor` })
        }
        if (maintenanceDue > 0) {
            alerts.push({ type: 'warning', message: `${maintenanceDue} makine için bakım zamanı yaklaşıyor` })
        }

        // Son 6 aylık gelir grafiği
        const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
        const chartData = []
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
            const dEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
            const monthPayments = await prisma.payment.aggregate({
                where: {
                    tenantId,
                    status: 'ODENDI',
                    paidAt: { gte: d, lte: dEnd },
                },
                _sum: { amount: true },
            })
            chartData.push({
                month: monthNames[d.getMonth()],
                gelir: Number(monthPayments._sum.amount || 0),
            })
        }

        // Makine tipi dağılımı
        const machineTypes = await prisma.machine.groupBy({
            by: ['type'],
            where: { tenantId },
            _count: true,
        })

        return NextResponse.json({
            machineStats,
            revenue: {
                paidThisMonth: Number(paidThisMonth._sum.amount || 0),
                pending: Number(pendingPayments._sum.amount || 0),
                overdue: Number(overdueAmount._sum.amount || 0),
            },
            alerts,
            recentRentals: recentRentals.map((r) => ({
                id: r.id,
                machineName: `${r.machine.brand} ${r.machine.model}`,
                machinePlate: r.machine.plate,
                customerName: r.customer.companyName,
                status: r.status,
                unitPrice: Number(r.unitPrice),
                periodType: r.periodType,
                startDate: r.startDate,
            })),
            chartData,
            machineTypes: machineTypes.map((t) => ({
                type: t.type,
                count: t._count,
            })),
        })
    } catch (error) {
        console.error('Dashboard API hatası:', error)
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    }
}
