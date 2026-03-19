import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Public API — token ile müşteri portalı erişimi
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    const { token } = await params

    // Hakedis'ten token bul
    const hakedis = await prisma.hakedis.findFirst({
        where: { customerToken: token },
        include: {
            rental: {
                include: {
                    machine: { select: { brand: true, model: true, plate: true, type: true } },
                    customer: { select: { companyName: true, contactPerson: true, phone: true } },
                    site: { select: { name: true, address: true } },
                    operator: { select: { name: true, phone: true } },
                },
            },
        },
    })

    if (!hakedis) return NextResponse.json({ error: 'Geçersiz veya süresi dolmuş link' }, { status: 404 })

    // Müşterinin diğer aktif kiralamaları
    const activeRentals = await prisma.rental.findMany({
        where: { customerId: hakedis.customerId, status: 'AKTIF' },
        include: {
            machine: { select: { brand: true, model: true, plate: true, type: true } },
            site: { select: { name: true } },
        },
        take: 10,
    })

    // Bekleyen faturalar
    const pendingInvoices = await prisma.invoice.findMany({
        where: { customerId: hakedis.customerId, status: { in: ['ONAYLANDI', 'GECIKTI', 'KISMI_ODENDI'] } },
        orderBy: { dueDate: 'asc' },
        take: 5,
    })

    return NextResponse.json({ hakedis, activeRentals, pendingInvoices })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    const { token } = await params
    const body = await req.json()
    const { action, signature } = body // action: ONAYLA | REDDET

    const hakedis = await prisma.hakedis.findFirst({ where: { customerToken: token } })
    if (!hakedis) return NextResponse.json({ error: 'Geçersiz link' }, { status: 404 })
    if (hakedis.status !== 'MUSTERI_ONAY_BEKLIYOR') {
        return NextResponse.json({ error: 'Bu hakediş zaten işlem gördü' }, { status: 400 })
    }

    const newStatus = action === 'ONAYLA' ? 'MUSTERI_ONAYLADI' : 'REDDEDILDI'
    await prisma.hakedis.update({
        where: { id: hakedis.id },
        data: {
            status: newStatus as any,
            customerApprovedAt: action === 'ONAYLA' ? new Date() : null,
            customerSignature: signature || null,
        },
    })

    return NextResponse.json({ success: true, status: newStatus })
}
