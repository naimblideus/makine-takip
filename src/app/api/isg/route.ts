// GET /api/isg — İSG / periyodik kontrol "ceza kalkanı"
// Makine muayene (periyodik kontrol), sigorta ve operatör belgesi son kullanma
// tarihlerini TR idari para cezası tahminiyle birlikte döner.
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// TR ceza referansları (2025 — yaklaşık, gösterge)
const PENALTY = {
    PERIYODIK_KONTROL: 55356,   // is ekipmanı periyodik kontrol yaptırmama (ekipman başına üst)
    SIGORTA: 25000,             // sigortasız çalıştırma riski (tahmini)
    OPERATOR_BELGE: 18000,      // belgesiz/ehliyetsiz operatör (tahmini)
}

function daysLeft(d: Date | null): number | null {
    if (!d) return null
    return Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}
function severity(dl: number | null): 'EXPIRED' | 'SOON' | 'OK' | 'NONE' {
    if (dl === null) return 'NONE'
    if (dl < 0) return 'EXPIRED'
    if (dl <= 30) return 'SOON'
    return 'OK'
}

export async function GET() {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const [machines, operators] = await Promise.all([
        prisma.machine.findMany({ where: { tenantId }, select: { id: true, brand: true, model: true, plate: true, inspectionExpiry: true, insuranceExpiry: true } }),
        prisma.operator.findMany({ where: { tenantId, isActive: true }, select: { id: true, name: true, licenseClass: true, licenseExpiry: true } }),
    ])

    const items: any[] = []

    for (const m of machines) {
        const name = `${m.brand} ${m.model}${m.plate ? ` (${m.plate})` : ''}`
        const insDl = daysLeft(m.inspectionExpiry)
        items.push({
            kind: 'PERIYODIK_KONTROL', label: 'Periyodik Kontrol / Muayene', entity: name, entityId: m.id,
            expiryDate: m.inspectionExpiry, daysLeft: insDl, severity: severity(insDl), penaltyTL: PENALTY.PERIYODIK_KONTROL,
        })
        const sigDl = daysLeft(m.insuranceExpiry)
        items.push({
            kind: 'SIGORTA', label: 'Sigorta', entity: name, entityId: m.id,
            expiryDate: m.insuranceExpiry, daysLeft: sigDl, severity: severity(sigDl), penaltyTL: PENALTY.SIGORTA,
        })
    }
    for (const o of operators) {
        const lDl = daysLeft(o.licenseExpiry)
        items.push({
            kind: 'OPERATOR_BELGE', label: `Operatör Belgesi${o.licenseClass ? ` (${o.licenseClass})` : ''}`, entity: o.name, entityId: o.id,
            expiryDate: o.licenseExpiry, daysLeft: lDl, severity: severity(lDl), penaltyTL: PENALTY.OPERATOR_BELGE,
        })
    }

    // Sadece risk taşıyanlar (expired/soon) ceza riskine sayılır
    const atRisk = items.filter(i => i.severity === 'EXPIRED' || i.severity === 'SOON')
    const expired = items.filter(i => i.severity === 'EXPIRED')
    const totalRisk = expired.reduce((s, i) => s + i.penaltyTL, 0)

    items.sort((a, b) => {
        const order = { EXPIRED: 0, SOON: 1, OK: 2, NONE: 3 } as any
        if (order[a.severity] !== order[b.severity]) return order[a.severity] - order[b.severity]
        return (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999)
    })

    return NextResponse.json({
        items,
        summary: {
            total: items.length,
            expired: expired.length,
            soon: atRisk.length - expired.length,
            totalPenaltyRisk: totalRisk,   // şu an geçmiş olanların ceza riski
        },
    })
}
