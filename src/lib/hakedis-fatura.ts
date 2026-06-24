// ─── Hakediş → Fatura Otomasyonu (nakit motoru) ────────────────────────────
// Müşteri hakedişi onaylayınca otomatik fatura düşer. Manuel darboğaz kalkar.
import { prisma } from '@/lib/prisma'

const toMoney = (n: number) => Math.round((Number.isFinite(n) ? n : 0) * 100) / 100

/** Onaylı hakedişten fatura oluşturur (yoksa). Hakedişi FATURALANDI yapar. */
export async function createInvoiceFromHakedis(hakedisId: string, tenantId: string) {
    const hakedis = await prisma.hakedis.findFirst({ where: { id: hakedisId, tenantId } })
    if (!hakedis) return null

    // Bu hakediş için zaten fatura var mı?
    const existing = await prisma.invoice.findFirst({ where: { tenantId, hakedisId: hakedis.id } })
    if (existing) return existing

    const year = new Date().getFullYear()
    const count = await prisma.invoice.count({ where: { tenantId } })
    const invoiceNumber = `FTR-${year}-${String(count + 1).padStart(4, '0')}`

    const items = [{
        description: `${hakedis.periodLabel} dönemi hakediş (GPS-doğrulamalı)`,
        quantity: Number(hakedis.totalHours) || 1,
        unitPrice: Number(hakedis.unitPrice),
        total: toMoney(Number(hakedis.subtotal)),
    }]

    const invoice = await prisma.$transaction(async (tx) => {
        const inv = await tx.invoice.create({
            data: {
                tenantId,
                customerId: hakedis.customerId,
                rentalId: hakedis.rentalId,
                hakedisId: hakedis.id,
                invoiceNumber,
                status: 'ONAYLANDI',
                subtotal: hakedis.subtotal,
                taxRate: hakedis.taxRate,
                taxAmount: hakedis.taxAmount,
                totalAmount: hakedis.totalAmount,
                items: items as any,
                issueDate: new Date(),
                dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
                notes: `Hakediş "${hakedis.periodLabel}" onayından otomatik oluşturuldu.`,
            },
        })
        await tx.hakedis.update({ where: { id: hakedis.id }, data: { status: 'FATURALANDI' } })
        return inv
    })

    return invoice
}
