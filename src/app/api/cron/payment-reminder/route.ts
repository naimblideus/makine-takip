// GET /api/cron/payment-reminder — Müşteriye otomatik ödeme hatırlatması
// Vadeye 3 gün kala (nazik) ve vade geçince (net) SMS/e-posta. Günlük çalışır.
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notifyCustomer } from '@/lib/messaging'
import { cronAuthorized } from '@/lib/api-guard'

const tl = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n)

export async function GET(req: NextRequest) {
    if (!cronAuthorized(req)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const now = new Date()
    const in3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    let sent = 0

    const invoices = await prisma.invoice.findMany({
        where: { status: { in: ['ONAYLANDI', 'KISMI_ODENDI', 'GECIKTI'] }, dueDate: { not: null } },
        include: { customer: { select: { companyName: true, phone: true, email: true } }, tenant: { select: { name: true, phone: true } } },
    })

    for (const inv of invoices) {
        const due = new Date(inv.dueDate!)
        const overdue = due < now
        const soon = !overdue && due <= in3
        if (!overdue && !soon) continue
        if (!inv.customer?.phone && !inv.customer?.email) continue

        const amount = Number(inv.totalAmount) + Number(inv.lateFee || 0)
        const subject = overdue ? `Vadesi Geçmiş Fatura — ${inv.invoiceNumber}` : `Ödeme Hatırlatması — ${inv.invoiceNumber}`
        const smsText = overdue
            ? `Sayin ${inv.customer.companyName}, ${inv.invoiceNumber} no'lu ${tl(amount)} tutarli faturanizin vadesi gecmistir. Odeme icin: ${inv.tenant?.name} ${inv.tenant?.phone || ''}`
            : `Sayin ${inv.customer.companyName}, ${inv.invoiceNumber} no'lu ${tl(amount)} tutarli faturanizin son odeme tarihi ${due.toLocaleDateString('tr-TR')}.`
        const emailHtml = `<p>Sayın ${inv.customer.companyName},</p><p><b>${inv.invoiceNumber}</b> numaralı <b>${tl(amount)}</b> tutarındaki faturanızın ${overdue ? 'vadesi geçmiştir' : `son ödeme tarihi ${due.toLocaleDateString('tr-TR')}`}.</p><p>${inv.tenant?.name}${inv.tenant?.phone ? ' · ' + inv.tenant.phone : ''}</p>`

        await notifyCustomer(
            { phone: inv.customer.phone, email: inv.customer.email, name: inv.customer.companyName },
            { subject, smsText, emailHtml },
        )
        sent++
    }

    return NextResponse.json({ success: true, sent, timestamp: now.toISOString() })
}
