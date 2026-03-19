import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantId } from '@/lib/auth'

export async function GET(req: NextRequest) {
    const tenantId = await getTenantId()
    if (!tenantId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim()
    if (!q || q.length < 2) return NextResponse.json({ results: [] })

    const results: any[] = []

    const [machines, customers, rentals, operators] = await Promise.all([
        prisma.machine.findMany({
            where: {
                tenantId,
                OR: [
                    { brand: { contains: q, mode: 'insensitive' } },
                    { model: { contains: q, mode: 'insensitive' } },
                    { plate: { contains: q, mode: 'insensitive' } },
                    { serialNumber: { contains: q, mode: 'insensitive' } },
                ],
            },
            take: 5,
            select: { id: true, brand: true, model: true, plate: true, type: true },
        }),
        prisma.customer.findMany({
            where: {
                tenantId,
                OR: [
                    { companyName: { contains: q, mode: 'insensitive' } },
                    { contactPerson: { contains: q, mode: 'insensitive' } },
                    { phone: { contains: q, mode: 'insensitive' } },
                ],
            },
            take: 5,
            select: { id: true, companyName: true, contactPerson: true, phone: true },
        }),
        prisma.rental.findMany({
            where: {
                tenantId,
                OR: [
                    { machine: { brand: { contains: q, mode: 'insensitive' } } },
                    { machine: { model: { contains: q, mode: 'insensitive' } } },
                    { customer: { companyName: { contains: q, mode: 'insensitive' } } },
                ],
            },
            take: 5,
            select: {
                id: true,
                machine: { select: { brand: true, model: true } },
                customer: { select: { companyName: true } },
                status: true,
            },
        }),
        prisma.operator.findMany({
            where: {
                tenantId,
                isActive: true,
                OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { phone: { contains: q, mode: 'insensitive' } },
                    { tcNumber: { contains: q, mode: 'insensitive' } },
                ],
            },
            take: 5,
            select: { id: true, name: true, phone: true },
        }),
    ])

    for (const m of machines) {
        results.push({
            id: m.id, type: 'makine',
            label: `${m.brand} ${m.model}`,
            sublabel: m.plate || m.type,
            href: `/makineler/${m.id}`,
        })
    }
    for (const c of customers) {
        results.push({
            id: c.id, type: 'musteri',
            label: c.companyName,
            sublabel: c.contactPerson || c.phone || undefined,
            href: `/musteriler/${c.id}`,
        })
    }
    for (const r of rentals) {
        results.push({
            id: r.id, type: 'kiralama',
            label: `${r.machine.brand} ${r.machine.model}`,
            sublabel: r.customer.companyName,
            href: `/kiralamalar/${r.id}`,
        })
    }
    for (const o of operators) {
        results.push({
            id: o.id, type: 'operator',
            label: o.name,
            sublabel: o.phone || undefined,
            href: `/operatorler/${o.id}`,
        })
    }

    return NextResponse.json({ results })
}
