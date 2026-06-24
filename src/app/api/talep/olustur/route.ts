// POST /api/talep/olustur — PUBLIC: Şantiye talebi (RFQ) oluştur + eşleşen kiralamacılara yayın
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { dispatchTenantAlert } from '@/lib/alert-dispatch'
import { rateLimited } from '@/lib/api-guard'

const TYPE_LABELS: Record<string, string> = { FORKLIFT: 'Forklift', EKSAVATOR: 'Ekskavatör', VINC: 'Vinç', DOZER: 'Dozer', KEPCE: 'Kepçe', GREYDER: 'Greyder', SILINDIR: 'Silindir', KAMYON: 'Kamyon', BEKO_LODER: 'Beko Loder', DIGER: 'Diğer' }
const PERIODS = ['SAATLIK', 'GUNLUK', 'HAFTALIK', 'AYLIK']
const TYPES = Object.keys(TYPE_LABELS)

export async function POST(req: NextRequest) {
    const limited = rateLimited(req, 'talep', 6, 60_000)
    if (limited) return limited

    const b = await req.json()
    if (!b.requesterName || String(b.requesterName).trim().length < 2) {
        return NextResponse.json({ error: 'Lütfen adınızı/firma adını girin' }, { status: 400 })
    }
    if (!b.machineType && !b.description) {
        return NextResponse.json({ error: 'Makine tipi veya açıklama gerekli' }, { status: 400 })
    }

    const token = randomBytes(18).toString('hex')
    const machineType = TYPES.includes(b.machineType) ? b.machineType : null
    const periodType = PERIODS.includes(b.periodType) ? b.periodType : 'GUNLUK'

    const rfq = await prisma.rfq.create({
        data: {
            token,
            requesterName: String(b.requesterName).slice(0, 120),
            requesterPhone: b.requesterPhone ? String(b.requesterPhone).slice(0, 30) : null,
            requesterEmail: b.requesterEmail ? String(b.requesterEmail).slice(0, 160) : null,
            city: b.city ? String(b.city).slice(0, 60) : null,
            machineType: machineType as any,
            periodType: periodType as any,
            quantity: Math.max(1, Number(b.quantity) || 1),
            neededFrom: b.neededFrom ? new Date(b.neededFrom) : null,
            operatorNeeded: !!b.operatorNeeded,
            description: b.description ? String(b.description).slice(0, 800) : null,
            budget: b.budget ? Number(b.budget) : null,
        },
    })

    // Yayın: bu tipte makinesi olan kiralamacılara anında bildir (sıcak iş fırsatı)
    try {
        const machineWhere: any = {}
        if (machineType) machineWhere.type = machineType
        const owners = await prisma.machine.findMany({ where: machineWhere, select: { tenantId: true }, distinct: ['tenantId'], take: 300 })
        const typeLabel = machineType ? TYPE_LABELS[machineType] : 'İş makinesi'
        await Promise.allSettled(owners.map(o => dispatchTenantAlert(
            o.tenantId,
            `Yeni Talep: ${typeLabel}${rfq.city ? ` · ${rfq.city}` : ''}`,
            `${rfq.requesterName} ${rfq.quantity} ${periodType.toLowerCase()} ${typeLabel} arıyor.${rfq.operatorNeeded ? ' Operatörlü.' : ''} "Talepler" ekranından teklif ver.`,
        )))
    } catch (e) { console.error('Talep yayın hatası:', e) }

    return NextResponse.json({ token, success: true })
}
