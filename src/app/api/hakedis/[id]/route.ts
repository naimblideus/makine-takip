import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyCustomer } from '@/lib/messaging'
import { createInvoiceFromHakedis } from '@/lib/hakedis-fatura'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const hakedis = await prisma.hakedis.findFirst({
        where: { id, tenantId },
        include: {
            rental: {
                include: {
                    machine: true,
                    customer: true,
                    site: true,
                    operator: true,
                },
            },
        },
    })

    if (!hakedis) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
    return NextResponse.json({ hakedis })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const body = await req.json()

    const hakedis = await prisma.hakedis.findFirst({ where: { id, tenantId } })
    if (!hakedis) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

    // Durum değişikliği özel alanlar
    const updateData: any = { ...body }
    if (body.status === 'ONAYLANDI' && !hakedis.approvedAt) {
        updateData.approvedAt = new Date()
        updateData.approvedBy = (session.user as any).name
    }
    if (body.status === 'MUSTERI_ONAY_BEKLIYOR' && !hakedis.sentToCustomerAt) {
        updateData.sentToCustomerAt = new Date()
        // Token oluştur (müşteri portalı için)
        const { v4: uuidv4 } = await import('uuid')
        updateData.customerToken = uuidv4()
    }
    if (body.status === 'MUSTERI_ONAYLADI' && !hakedis.customerApprovedAt) {
        updateData.customerApprovedAt = new Date()
    }

    const updated = await prisma.hakedis.update({ where: { id }, data: updateData })

    // Müşteriye otomatik gönderim (SMS + e-posta) — ilk kez müşteri onayına çıkınca
    if (body.status === 'MUSTERI_ONAY_BEKLIYOR' && !hakedis.sentToCustomerAt && updated.customerToken) {
        try {
            const customer = await prisma.customer.findUnique({
                where: { id: updated.customerId },
                select: { companyName: true, phone: true, email: true },
            })
            const base = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin
            const portalUrl = `${base}/portal/${updated.customerToken}`
            const smsText = `Sayin ${customer?.companyName || ''}, ${updated.periodLabel} donemi hakedisiniz onayiniza sunuldu. Inceleyip imzalamak icin: ${portalUrl}`
            const emailHtml = `<p>Sayın ${customer?.companyName || ''},</p>
<p><b>${updated.periodLabel}</b> dönemi hakedişiniz onayınıza sunulmuştur. Çalışma saati makinenin GPS/motor verisiyle doğrulanmıştır.</p>
<p><a href="${portalUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold">Hakedişi görüntüle ve imzala →</a></p>
<p style="color:#64748b;font-size:13px">${portalUrl}</p>`
            await notifyCustomer(
                { phone: customer?.phone, email: customer?.email, name: customer?.companyName },
                { subject: `Hakediş Onayı — ${updated.periodLabel}`, smsText, emailHtml },
            )
        } catch (e) {
            console.error('Hakediş bildirim gönderimi hatası:', e)
        }
    }

    // ── Onaylanınca otomatik fatura (nakit motoru) ──
    if (body.status === 'MUSTERI_ONAYLADI' && hakedis.status !== 'FATURALANDI') {
        try { await createInvoiceFromHakedis(id, tenantId) } catch (e) { console.error('Oto fatura hatası:', e) }
    }

    return NextResponse.json({ hakedis: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const hakedis = await prisma.hakedis.findFirst({ where: { id, tenantId } })
    if (!hakedis) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
    if (hakedis.status === 'FATURALANDI') return NextResponse.json({ error: 'Faturalanan hakediş silinemez' }, { status: 400 })

    await prisma.hakedis.delete({ where: { id } })
    return NextResponse.json({ success: true })
}
