// /api/emanet/[token] — PUBLIC: emanet (escrow) durumu (GET) + öde/serbest bırak (POST)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { dispatchTenantAlert } from '@/lib/alert-dispatch'
import { PAYMENT_MOCK } from '@/lib/payment'

const tl = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n)

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    const { token } = await params
    const e = await prisma.escrow.findFirst({ where: { payToken: token } })
    if (!e) return NextResponse.json({ error: 'Emanet kaydı bulunamadı' }, { status: 404 })
    const [owner, review] = await Promise.all([
        prisma.tenant.findUnique({ where: { id: e.ownerTenantId }, select: { name: true } }),
        prisma.marketplaceReview.findUnique({ where: { escrowId: e.id }, select: { id: true } }),
    ])
    return NextResponse.json({
        escrow: {
            payToken: e.payToken, amount: Number(e.amount), commissionTL: Number(e.commissionTL), ownerNet: Number(e.ownerNet),
            status: e.status, payerName: e.payerName, ownerName: owner?.name, mock: PAYMENT_MOCK,
            reviewed: !!review,
        },
    })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    const { token } = await params
    const { action } = await req.json()
    const e = await prisma.escrow.findFirst({ where: { payToken: token } })
    if (!e) return NextResponse.json({ error: 'Emanet bulunamadı' }, { status: 404 })

    if (action === 'FUND') {
        if (e.status !== 'BEKLIYOR') return NextResponse.json({ error: 'Bu emanet için ödeme zaten alınmış' }, { status: 400 })
        // Gerçek iyzico'da burada kart tahsil edilip para PLATFORM havuzunda tutulur.
        await prisma.escrow.update({ where: { id: e.id }, data: { status: 'TUTULUYOR', fundedAt: new Date() } })
        await dispatchTenantAlert(e.ownerTenantId, 'Emanet Ödeme Alındı', `${e.payerName} ${tl(Number(e.amount))} tutarını emanete yatırdı. Makineyi teslim edince ${tl(Number(e.ownerNet))} hesabınıza geçecek.`)
        return NextResponse.json({ success: true, status: 'TUTULUYOR' })
    }

    if (action === 'RELEASE') {
        if (e.status !== 'TUTULUYOR') return NextResponse.json({ error: 'Serbest bırakmak için önce ödeme alınmalı' }, { status: 400 })
        await prisma.$transaction(async (tx) => {
            await tx.escrow.update({ where: { id: e.id }, data: { status: 'SERBEST', releasedAt: new Date() } })
            // Kiralamanın faturası varsa ödenmiş işaretle
            if (e.rentalId) {
                const inv = await tx.invoice.findFirst({ where: { rentalId: e.rentalId, status: { in: ['ONAYLANDI', 'GECIKTI', 'KISMI_ODENDI', 'TASLAK'] } } })
                if (inv) {
                    await tx.payment.create({ data: { tenantId: e.ownerTenantId, invoiceId: inv.id, amount: e.ownerNet, method: 'KREDI_KARTI', status: 'ODENDI', paidAt: new Date(), notes: 'Emanet serbest bırakma' } })
                    await tx.invoice.update({ where: { id: inv.id }, data: { status: 'ODENDI' } })
                }
            }
        })
        await dispatchTenantAlert(e.ownerTenantId, 'Emanet Serbest Bırakıldı 💰', `${e.payerName} teslimi onayladı. ${tl(Number(e.ownerNet))} hesabınıza geçti (platform komisyonu ${tl(Number(e.commissionTL))} düşüldü).`)
        return NextResponse.json({ success: true, status: 'SERBEST' })
    }

    return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 })
}
