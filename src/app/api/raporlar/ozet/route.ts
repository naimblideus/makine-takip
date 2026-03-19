import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const url = new URL(req.url)
    const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()))

    const yearStart = new Date(year, 0, 1)
    const yearEnd = new Date(year + 1, 0, 1)

    const [
        payments, rentals, machines, fuelEntries, maintenances,
        newCustomers, incomeExpenses,
    ] = await Promise.all([
        prisma.payment.findMany({
            where: { tenantId, status: 'ODENDI', paidAt: { gte: yearStart, lt: yearEnd } },
            include: { invoice: { include: { rental: { include: { machine: { select: { brand: true, model: true, type: true } } } } } } },
        }),
        prisma.rental.findMany({
            where: { tenantId, startDate: { gte: yearStart, lt: yearEnd } },
            include: {
                machine: { select: { id: true, brand: true, model: true, type: true } },
                customer: { select: { id: true, companyName: true } },
                invoices: { include: { payments: { where: { status: 'ODENDI' } } } },
            },
        }),
        prisma.machine.findMany({ where: { tenantId }, select: { id: true, brand: true, model: true, type: true, status: true } }),
        prisma.fuelEntry.aggregate({ where: { tenantId, date: { gte: yearStart, lt: yearEnd } }, _sum: { totalCost: true } }),
        prisma.maintenance.aggregate({ where: { tenantId, date: { gte: yearStart, lt: yearEnd } }, _sum: { cost: true } }),
        prisma.customer.count({ where: { tenantId, createdAt: { gte: yearStart, lt: yearEnd } } }),
        prisma.incomeExpense.findMany({ where: { tenantId, date: { gte: yearStart, lt: yearEnd } } }),
    ])

    // Aylık gelir
    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
        const month = new Date(year, i, 1)
        const monthEnd = new Date(year, i + 1, 1)
        const rev = payments.filter(p => p.paidAt && new Date(p.paidAt) >= month && new Date(p.paidAt) < monthEnd).reduce((s, p) => s + Number(p.amount), 0)
        const exp = incomeExpenses.filter(ie => ie.type === 'GIDER' && new Date(ie.date) >= month && new Date(ie.date) < monthEnd).reduce((s, ie) => s + Number(ie.amount), 0)
        return { month: `${i + 1}/${year}`, gelir: rev, gider: exp, kar: rev - exp }
    })

    // Makine bazlı kârlılık
    const machineRevMap: Record<string, number> = {}
    rentals.forEach(r => {
        const rev = r.invoices.flatMap(inv => inv.payments).reduce((s, p) => s + Number(p.amount), 0)
        if (r.machine?.id) machineRevMap[r.machine.id] = (machineRevMap[r.machine.id] || 0) + rev
    })
    const machineRanking = machines.map(m => ({ ...m, revenue: machineRevMap[m.id] || 0 })).sort((a, b) => b.revenue - a.revenue).slice(0, 10)

    // Müşteri bazlı gelir
    const customerRevMap: Record<string, { name: string; rev: number; count: number }> = {}
    rentals.forEach(r => {
        const rev = r.invoices.flatMap(inv => inv.payments).reduce((s, p) => s + Number(p.amount), 0)
        if (r.customer?.id) {
            if (!customerRevMap[r.customer.id]) customerRevMap[r.customer.id] = { name: r.customer.companyName, rev: 0, count: 0 }
            customerRevMap[r.customer.id].rev += rev
            customerRevMap[r.customer.id].count += 1
        }
    })
    const topCustomers = Object.values(customerRevMap).sort((a, b) => b.rev - a.rev).slice(0, 10)

    // KPI'lar
    const totalRevenue = payments.reduce((s, p) => s + Number(p.amount), 0)
    const totalFuel = Number(fuelEntries._sum.totalCost || 0)
    const totalMaint = Number(maintenances._sum.cost || 0)
    const totalExpenses = incomeExpenses.filter(ie => ie.type === 'GIDER').reduce((s, ie) => s + Number(ie.amount), 0)
    const netProfit = totalRevenue - totalFuel - totalMaint - totalExpenses
    const occupiedMachineCount = machines.filter(m => m.status === 'KIRADA').length
    const occupancyRate = machines.length > 0 ? Math.round((occupiedMachineCount / machines.length) * 100) : 0

    return NextResponse.json({
        year, monthlyRevenue, machineRanking, topCustomers,
        kpi: { totalRevenue, totalFuel, totalMaint, totalExpenses, netProfit, occupancyRate, newCustomers, totalRentals: rentals.length, machineCount: machines.length },
    })
}
