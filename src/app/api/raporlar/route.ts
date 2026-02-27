import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })

        const tenantId = (session.user as any).tenantId
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

        const [
            totalMachines,
            totalCustomers,
            activeRentals,
            machineByStatus,
            monthlyPayments,
            totalInvoiced,
            totalPaid,
            totalPending,
            totalOverdue,
            totalFuelCost,
            totalMaintenanceCost,
        ] = await Promise.all([
            prisma.machine.count({ where: { tenantId } }),
            prisma.customer.count({ where: { tenantId } }),
            prisma.rental.count({ where: { tenantId, status: 'AKTIF' } }),
            prisma.machine.groupBy({ by: ['status'], where: { tenantId }, _count: true }),
            prisma.payment.aggregate({
                where: { tenantId, status: 'ODENDI', paidAt: { gte: monthStart } },
                _sum: { amount: true },
            }),
            prisma.invoice.aggregate({ where: { tenantId }, _sum: { totalAmount: true } }),
            prisma.payment.aggregate({ where: { tenantId, status: 'ODENDI' }, _sum: { amount: true } }),
            prisma.payment.aggregate({ where: { tenantId, status: 'BEKLIYOR' }, _sum: { amount: true } }),
            prisma.payment.aggregate({ where: { tenantId, status: 'GECIKTI' }, _sum: { amount: true } }),
            prisma.fuelEntry.aggregate({ where: { tenantId }, _sum: { cost: true } }),
            prisma.maintenance.aggregate({ where: { tenantId }, _sum: { cost: true } }),
        ])

        // Son 12 aylık gelir/gider grafiği
        const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
        const chartData = []
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
            const dEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)

            const [monthRevenue, monthFuel, monthMaint] = await Promise.all([
                prisma.payment.aggregate({
                    where: { tenantId, status: 'ODENDI', paidAt: { gte: d, lte: dEnd } },
                    _sum: { amount: true },
                }),
                prisma.fuelEntry.aggregate({
                    where: { tenantId, date: { gte: d, lte: dEnd } },
                    _sum: { cost: true },
                }),
                prisma.maintenance.aggregate({
                    where: { tenantId, performedAt: { gte: d, lte: dEnd } },
                    _sum: { cost: true },
                }),
            ])

            chartData.push({
                month: monthNames[d.getMonth()],
                gelir: Number(monthRevenue._sum.amount || 0),
                yakit: Number(monthFuel._sum.cost || 0),
                bakim: Number(monthMaint._sum.cost || 0),
            })
        }

        // Makine tipi dağılımı
        const machineTypes = await prisma.machine.groupBy({
            by: ['type'],
            where: { tenantId },
            _count: true,
        })

        // Müşteri bazlı gelir (top 5) — through invoices
        const topCustomerInvoices = await prisma.invoice.groupBy({
            by: ['customerId'],
            where: { tenantId },
            _sum: { totalAmount: true },
            orderBy: { _sum: { totalAmount: 'desc' } },
            take: 5,
        })

        const customerIds = topCustomerInvoices.map(c => c.customerId)
        const customerNames = await prisma.customer.findMany({
            where: { id: { in: customerIds } },
            select: { id: true, companyName: true },
        })

        const topCustomerData = topCustomerInvoices.map(c => ({
            name: customerNames.find(cn => cn.id === c.customerId)?.companyName || 'Bilinmiyor',
            value: Number(c._sum.totalAmount || 0),
        }))

        return NextResponse.json({
            totalMachines,
            totalCustomers,
            activeRentals,
            machineByStatus,
            monthlyRevenue: Number(monthlyPayments._sum.amount || 0),
            totalInvoiced: Number(totalInvoiced._sum.totalAmount || 0),
            totalPaid: Number(totalPaid._sum.amount || 0),
            totalPending: Number(totalPending._sum.amount || 0),
            totalOverdue: Number(totalOverdue._sum.amount || 0),
            totalFuelCost: Number(totalFuelCost._sum.cost || 0),
            totalMaintenanceCost: Number(totalMaintenanceCost._sum.cost || 0),
            chartData,
            machineTypes: machineTypes.map(t => ({ type: t.type, count: t._count })),
            topCustomers: topCustomerData,
        })
    } catch (error) {
        console.error('Rapor hatası:', error)
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    }
}
