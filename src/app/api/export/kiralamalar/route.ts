import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// CSV export for rentals
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })

        const tenantId = (session.user as any).tenantId

        const rentals = await prisma.rental.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            include: {
                machine: { select: { brand: true, model: true, plate: true, type: true } },
                customer: { select: { companyName: true } },
                operator: { select: { name: true } },
                site: { select: { name: true } },
            },
        })

        // CSV header
        const headers = [
            'Durum',
            'Makine',
            'Plaka',
            'Makine Tipi',
            'Müşteri',
            'Operatör',
            'Şantiye',
            'Başlangıç',
            'Bitiş',
            'Dönem',
            'Birim Fiyat',
            'Operatör Dahil',
            'Depozito',
        ]

        const rows = rentals.map((r) => [
            r.status,
            `${r.machine.brand} ${r.machine.model}`,
            r.machine.plate || '',
            r.machine.type,
            r.customer.companyName,
            r.operator?.name || '',
            r.site?.name || '',
            r.startDate.toISOString().split('T')[0],
            r.endDate ? r.endDate.toISOString().split('T')[0] : '',
            r.periodType,
            Number(r.unitPrice),
            r.operatorIncluded ? 'Evet' : 'Hayır',
            r.deposit ? Number(r.deposit) : '',
        ])

        // BOM for Excel Turkish char support
        const BOM = '\uFEFF'
        const csvContent = BOM + [
            headers.join(';'),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(';')),
        ].join('\n')

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="kiralamalar_${new Date().toISOString().split('T')[0]}.csv"`,
            },
        })
    } catch (error) {
        console.error('CSV export hatası:', error)
        return NextResponse.json({ error: 'Dışa aktarma hatası' }, { status: 500 })
    }
}
