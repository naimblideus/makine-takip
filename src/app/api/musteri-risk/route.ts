// GET /api/musteri-risk — Müşteri churn/risk erken uyarı
// Patrona "hangi müşteri riskli, ara" der: gecikmiş ödeme + azalan kiralama + atalet.
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const tl = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n)

export async function GET() {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId
    const now = new Date()

    const customers = await prisma.customer.findMany({
        where: { tenantId },
        include: {
            rentals: { select: { status: true, startDate: true } },
            invoices: { select: { status: true, totalAmount: true, dueDate: true } },
            rating: { select: { riskScore: true, tier: true } },
        },
    })

    const rows = customers.map((c) => {
        const reasons: string[] = []
        let risk = 0
        let overdueTL = 0

        const overdue = c.invoices.filter(i => i.status === 'GECIKTI' || (i.dueDate && new Date(i.dueDate) < now && ['ONAYLANDI', 'KISMI_ODENDI'].includes(i.status)))
        if (overdue.length > 0) {
            overdueTL = overdue.reduce((s, i) => s + Number(i.totalAmount), 0)
            risk += Math.min(55, 20 + overdue.length * 14) // tek gecikme bile en az ORTA
            reasons.push(`${overdue.length} gecikmiş fatura (${tl(overdueTL)})`)
        }

        const totalRentals = c.rentals.length
        const activeRentals = c.rentals.filter(r => r.status === 'AKTIF').length
        const lastRental = c.rentals.reduce<Date | null>((max, r) => (!max || new Date(r.startDate) > max ? new Date(r.startDate) : max), null)
        const daysSince = lastRental ? Math.floor((now.getTime() - lastRental.getTime()) / 86400000) : null

        if (c.isBlacklisted) { risk = 100; reasons.unshift('Kara listede') }
        else {
            if (totalRentals > 0 && activeRentals === 0 && daysSince != null && daysSince > 45) {
                risk += 30
                reasons.push(`${daysSince} gündür yeni kiralama yok`)
            } else if (totalRentals > 0 && activeRentals === 0) {
                risk += 12
                reasons.push('Aktif kiralaması yok')
            }
            if (c.rating?.riskScore != null && c.rating.riskScore < 40) {
                risk += 15
                reasons.push('Düşük güven skoru')
            }
        }

        risk = Math.min(100, risk)
        const level = risk >= 60 ? 'YUKSEK' : risk >= 30 ? 'ORTA' : 'DUSUK'
        return {
            id: c.id, companyName: c.companyName, phone: c.phone,
            risk, level, reasons, overdueTL,
            totalRentals, activeRentals, daysSinceRental: daysSince,
            blacklisted: c.isBlacklisted,
        }
    })

    rows.sort((a, b) => b.risk - a.risk)
    const atRisk = rows.filter(r => r.level !== 'DUSUK')

    return NextResponse.json({
        rows: atRisk,
        summary: {
            total: customers.length,
            yuksek: rows.filter(r => r.level === 'YUKSEK').length,
            orta: rows.filter(r => r.level === 'ORTA').length,
            riskliAlacak: rows.reduce((s, r) => s + r.overdueTL, 0),
        },
    })
}
