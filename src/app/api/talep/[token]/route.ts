// /api/talep/[token] — PUBLIC: talep + teklifleri gör (GET) + teklif kabul (POST)
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { dispatchTenantAlert } from '@/lib/alert-dispatch'
import { getTenantRatings } from '@/lib/reputation'

const COMMISSION_PCT = Number(process.env.MARKETPLACE_COMMISSION_PCT || 5)
const toMoney = (n: number) => Math.round((Number.isFinite(n) ? n : 0) * 100) / 100

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    const { token } = await params
    const rfq = await prisma.rfq.findFirst({ where: { token }, include: { bids: { orderBy: { unitPrice: 'asc' } } } })
    if (!rfq) return NextResponse.json({ error: 'Talep bulunamadı' }, { status: 404 })

    // Teklif veren firmaların adı + (varsa) puanı
    const tenantIds = [...new Set(rfq.bids.map(b => b.tenantId))]
    const [tenants, ratings] = await Promise.all([
        prisma.tenant.findMany({ where: { id: { in: tenantIds } }, select: { id: true, name: true } }),
        getTenantRatings(tenantIds),
    ])
    const tmap = Object.fromEntries(tenants.map(t => [t.id, t.name]))

    return NextResponse.json({
        rfq: {
            ...rfq,
            bids: rfq.bids.map(b => ({ ...b, ownerName: tmap[b.tenantId] || 'Firma', ownerRating: ratings[b.tenantId] || null })),
        },
    })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    const { token } = await params
    const { bidId } = await req.json()

    const rfq = await prisma.rfq.findFirst({ where: { token }, include: { bids: true } })
    if (!rfq) return NextResponse.json({ error: 'Talep bulunamadı' }, { status: 404 })
    if (rfq.status === 'KAPANDI') return NextResponse.json({ error: 'Bu talep zaten sonuçlanmış' }, { status: 400 })

    const bid = rfq.bids.find(b => b.id === bidId)
    if (!bid) return NextResponse.json({ error: 'Teklif bulunamadı' }, { status: 404 })

    const days = rfq.quantity || 1
    const dealValue = toMoney(Number(bid.unitPrice) * days)
    const commissionTL = toMoney(dealValue * COMMISSION_PCT / 100)

    const result = await prisma.$transaction(async (tx) => {
        // Müşteri: kazanan firmada talep sahibinden müşteri oluştur
        const customer = await tx.customer.create({
            data: { tenantId: bid.tenantId, companyName: rfq.requesterName, phone: rfq.requesterPhone || null, email: rfq.requesterEmail || null },
        })

        // Kiralama oluştur (makine seçiliyse onunla)
        let machineId = bid.machineId
        if (!machineId && rfq.machineType) {
            const m = await tx.machine.findFirst({ where: { tenantId: bid.tenantId, type: rfq.machineType, status: 'MUSAIT' }, select: { id: true } })
            machineId = m?.id || null
        }

        let rentalId: string | null = null
        if (machineId) {
            const rental = await tx.rental.create({
                data: {
                    tenantId: bid.tenantId, machineId, customerId: customer.id, status: 'AKTIF',
                    periodType: bid.periodType, unitPrice: bid.unitPrice, operatorIncluded: bid.operatorIncluded,
                    startDate: rfq.neededFrom || new Date(),
                    notes: `Pazardan kazanıldı (talep #${rfq.id.slice(0, 8)}).`,
                },
            })
            await tx.machine.update({ where: { id: machineId }, data: { status: 'KIRADA' } })
            rentalId = rental.id
        }

        // Komisyon kaydı (Quote, source=MARKETPLACE)
        await tx.quote.create({
            data: {
                tenantId: bid.tenantId, customerId: customer.id, customerName: rfq.requesterName, customerPhone: rfq.requesterPhone,
                machineId, machineType: rfq.machineType, machineLabel: bid.machineLabel,
                periodType: bid.periodType, unitPrice: bid.unitPrice, quantity: days, operatorIncluded: bid.operatorIncluded,
                subtotal: dealValue, taxRate: 20, taxAmount: toMoney(dealValue * 0.2), totalAmount: toMoney(dealValue * 1.2),
                status: 'KIRALAMAYA_DONDU', source: 'MARKETPLACE', commissionRate: COMMISSION_PCT, commissionTL, rentalId,
            },
        })

        // Teklif + talep durumları
        await tx.rfqBid.update({ where: { id: bid.id }, data: { status: 'KABUL' } })
        await tx.rfqBid.updateMany({ where: { rfqId: rfq.id, id: { not: bid.id } }, data: { status: 'RED' } })
        await tx.rfq.update({ where: { id: rfq.id }, data: { status: 'KAPANDI', acceptedBidId: bid.id } })

        // Emanet (escrow) kaydı — şantiye güvenli ödeme yapsın
        const escrowToken = randomBytes(18).toString('hex')
        await tx.escrow.create({
            data: {
                payToken: escrowToken, ownerTenantId: bid.tenantId, rfqId: rfq.id, rentalId,
                payerName: rfq.requesterName, payerPhone: rfq.requesterPhone,
                amount: dealValue, commissionTL, ownerNet: toMoney(dealValue - commissionTL), status: 'BEKLIYOR',
            },
        })

        return { rentalId, escrowToken }
    })

    // Kazanan firmaya bildir
    await dispatchTenantAlert(bid.tenantId, `Teklifin Kabul Edildi! ${bid.machineLabel || rfq.machineType || ''}`, `${rfq.requesterName} teklifinizi kabul etti. ${days} ${bid.periodType.toLowerCase()} × ${Number(bid.unitPrice)} TL. ${rfq.requesterPhone || ''}`)

    return NextResponse.json({ success: true, rentalCreated: !!result.rentalId, escrowToken: result.escrowToken })
}
