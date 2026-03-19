import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const machine = await prisma.machine.findFirst({
        where: { id, tenantId },
        include: {
            rentals: {
                include: {
                    invoices: { include: { payments: true } },
                    hakedisler: true,
                },
            },
            maintenances: true,
            fuelEntries: true,
            amortization: true,
        },
    })

    if (!machine) return NextResponse.json({ error: 'Makine bulunamadı' }, { status: 404 })

    // Gelir: ödenen faturalar
    const totalRevenue = machine.rentals.reduce((sum, r) => {
        return sum + r.invoices.reduce((s2, inv) => {
            return s2 + inv.payments.filter(p => p.status === 'ODENDI').reduce((s3, p) => s3 + Number(p.amount), 0)
        }, 0)
    }, 0)

    // Bakım gideri
    const totalMaintCost = machine.maintenances.reduce((s, m) => s + Number(m.cost || 0), 0)

    // Yakıt gideri
    const totalFuelCost = machine.fuelEntries.reduce((s, f) => s + Number(f.cost), 0)

    // Toplam çalışma günleri (kiralamalardan)
    const totalRentDays = machine.rentals
        .filter(r => r.status !== 'IPTAL')
        .reduce((sum, r) => {
            const start = r.startDate
            const end = r.actualEndDate || r.endDate || new Date()
            return sum + Math.ceil((end.getTime() - start.getTime()) / 86400000)
        }, 0)

    // Amortisman
    const amort = machine.amortization
    const annualAmort = amort
        ? (Number(amort.purchasePrice) - Number(amort.salvageValue)) / amort.usefulLifeYears
        : 0

    const netProfit = totalRevenue - totalMaintCost - totalFuelCost - annualAmort
    const occupancyRate = totalRentDays > 0 ? Math.min(Math.round((totalRentDays / 365) * 100), 100) : 0

    // Aylık gelir (son 6 ay)
    const now = new Date()
    const monthlyRevenue = []
    for (let i = 5; i >= 0; i--) {
        const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
        let mRev = 0
        machine.rentals.forEach(r => {
            r.invoices.forEach(inv => {
                inv.payments
                    .filter(p => p.status === 'ODENDI' && p.paidAt && p.paidAt >= mStart && p.paidAt <= mEnd)
                    .forEach(p => { mRev += Number(p.amount) })
            })
        })
        monthlyRevenue.push({
            month: mStart.toLocaleString('tr-TR', { month: 'short', year: 'numeric' }),
            gelir: mRev,
        })
    }

    return NextResponse.json({
        machine: { id: machine.id, brand: machine.brand, model: machine.model, plate: machine.plate, type: machine.type, totalHours: machine.totalHours },
        karlilık: {
            totalRevenue,
            totalMaintCost,
            totalFuelCost,
            annualAmort,
            netProfit,
            occupancyRate,
            totalRentals: machine.rentals.filter(r => r.status !== 'IPTAL').length,
            totalRentDays,
            avgDailyRevenue: totalRentDays > 0 ? Math.round(totalRevenue / totalRentDays) : 0,
        },
        monthlyRevenue,
        amortization: amort,
    })
}
