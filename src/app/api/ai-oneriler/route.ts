import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000)

    // Verileri paralel topla
    const [machines, rentals, maintenances, fuelEntries, customers, operatorRentals] = await Promise.all([
        prisma.machine.findMany({
            where: { tenantId },
            include: { maintenanceSchedules: { where: { isActive: true } } },
        }),
        prisma.rental.findMany({
            where: { tenantId },
            include: { invoices: { include: { payments: { where: { status: 'ODENDI' } } } } },
        }),
        prisma.maintenance.findMany({ where: { tenantId } }),
        prisma.fuelEntry.findMany({ where: { tenantId, date: { gte: thirtyDaysAgo } } }),
        prisma.customer.findMany({
            where: { tenantId },
            include: {
                rentals: { include: { invoices: { include: { payments: { where: { status: 'ODENDI' } } } } } },
                rating: true,
            },
        }),
        prisma.rental.groupBy({ by: ['operatorId'], where: { tenantId, status: 'AKTIF' }, _count: true }),
    ])

    const suggestions = []

    // 1. Boştaki makineler (10+ gün)
    const idleMachines = machines.filter(m => {
        if (m.status !== 'MUSAIT') return false
        const lastRental = rentals.filter(r => r.machineId === m.id).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0]
        if (!lastRental) return true
        const daysSince = (now.getTime() - new Date(lastRental.actualEndDate || lastRental.endDate || lastRental.startDate).getTime()) / 86400000
        return daysSince > 10
    })
    if (idleMachines.length > 0) {
        suggestions.push({
            type: 'FILO_OPTIMIZASYON',
            priority: 'ORTA',
            icon: '🚛',
            title: `${idleMachines.length} makine 10+ gündür boşta`,
            description: `${idleMachines.slice(0, 3).map(m => `${m.brand} ${m.model}`).join(', ')} aktif kiralamada değil. Fiyat indirimi veya müşteri teklifi düşünün.`,
            action: { label: 'Makinelere Git', href: '/makineler' },
        })
    }

    // 2. Geciken bakımlar
    const overdueMaint = machines.filter(m =>
        m.maintenanceSchedules.some(s => s.nextDueDate && s.nextDueDate < now)
    )
    if (overdueMaint.length > 0) {
        suggestions.push({
            type: 'BAKIM',
            priority: 'YUKSEK',
            icon: '🔧',
            title: `${overdueMaint.length} makinede bakım gecikmiş`,
            description: `${overdueMaint.slice(0, 2).map(m => `${m.brand} ${m.model}`).join(', ')} — bakım gecikmesi arıza riskini artırır.`,
            action: { label: 'Bakım Takvimi', href: '/bakim-takvimi' },
        })
    }

    // 3. Yüksek riskli müşteriler
    const riskyCustomers = customers.filter(c => {
        const invoices = c.rentals.flatMap((r: any) => r.invoices)
        const totalRevenue = invoices.flatMap((i: any) => i.payments).reduce((s: number, p: any) => s + Number(p.amount), 0)
        return totalRevenue > 0 && c.rating?.riskScore && c.rating.riskScore > 70
    })
    if (riskyCustomers.length > 0) {
        suggestions.push({
            type: 'MUSTERI_RISKI',
            priority: 'YUKSEK',
            icon: '⚠️',
            title: `${riskyCustomers.length} müşteri yüksek risk puanına sahip`,
            description: `${riskyCustomers.slice(0, 2).map((c: any) => c.companyName).join(', ')} — ödeme takibini sıkılaştırın veya depozito talep edin.`,
            action: { label: 'Müşterilere Git', href: '/musteriler' },
        })
    }

    // 4. Yakıt tüketim anomalisi
    const fuelByMachine: Record<string, number> = {}
    fuelEntries.forEach(f => { fuelByMachine[f.machineId] = (fuelByMachine[f.machineId] || 0) + Number(f.liters) })
    const highFuelMachines = Object.entries(fuelByMachine)
        .filter(([, liters]) => liters > 500)
        .map(([machineId]) => machines.find(m => m.id === machineId))
        .filter(Boolean)
    if (highFuelMachines.length > 0) {
        suggestions.push({
            type: 'YAKIT_ANOMALI',
            priority: 'ORTA',
            icon: '⛽',
            title: `${highFuelMachines.length} makinede yüksek yakıt tüketimi`,
            description: `Son 30 günde 500L+ yakıt harcandı. Motor verimliliğini kontrol edin.`,
            action: { label: 'Yakıt Takibine Git', href: '/yakit' },
        })
    }

    // 5. VIP müşteri teklifi
    const vipCustomers = customers.filter((c: any) => {
        const totalRev = c.rentals.flatMap((r: any) => r.invoices).flatMap((i: any) => i.payments).reduce((s: number, p: any) => s + Number(p.amount), 0)
        return totalRev > 100000 && c.rentals.length >= 3
    })
    if (vipCustomers.length > 0) {
        suggestions.push({
            type: 'VIP_FIRSAT',
            priority: 'DUSUK',
            icon: '⭐',
            title: `${vipCustomers.length} VIP müşteri için özel teklif hazırlayın`,
            description: `${vipCustomers.slice(0, 2).map((c: any) => c.companyName).join(', ')} sadık müşterileriniz — sadakat indirimi sunun.`,
            action: { label: 'Müşteri CRM', href: '/musteriler' },
        })
    }

    // Önceliklendirme
    const priorityOrder: Record<string, number> = { YUKSEK: 0, ORTA: 1, DUSUK: 2 }
    suggestions.sort((a, b) => (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0))

    return NextResponse.json({ suggestions, generatedAt: now.toISOString() })
}
