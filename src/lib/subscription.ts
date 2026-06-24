// ─── Abonelik / Lisans Motoru ──────────────────────────────────────────────
// SaaS gelir modeli: makine-başı plan + trial + makine limiti paywall.
// "Sonsuz bedava" riskini kapatır.

import { prisma } from '@/lib/prisma'
import { volumeDiscount } from '@/lib/pricing'

export type PlanKey = 'TEMEL' | 'PRO' | 'PLATFORM'

export interface PlanDef {
    key: PlanKey
    name: string
    pricePerMachine: number   // TL / makine / ay
    machineLimit: number
    tagline: string
    features: string[]
}

export const PLANS: Record<PlanKey, PlanDef> = {
    TEMEL: {
        key: 'TEMEL',
        name: 'Temel — Takip',
        pricePerMachine: 1000,
        machineLimit: 15,
        tagline: 'Konum + çalışma saati + belge uyarıları',
        features: [
            'GPS konum & canlı harita',
            'Motor / çalışma saati takibi',
            'Bakım, sigorta, muayene uyarıları',
            'Temel raporlar',
        ],
    },
    PRO: {
        key: 'PRO',
        name: 'Pro — Operasyon',
        pricePerMachine: 2000,
        machineLimit: 60,
        tagline: 'GPS-doğrulamalı hakediş + yakıt + portal (en çok satılan)',
        features: [
            'Temel paketin tümü',
            'GPS-doğrulamalı hakediş / puantaj',
            'Yakıt hırsızlığı & boşta (rölanti) tespiti',
            'Müşteri portalı + dijital imza',
            'Operatör skoru & performans',
        ],
    },
    PLATFORM: {
        key: 'PLATFORM',
        name: 'Platform — Tam',
        pricePerMachine: 3000,
        machineLimit: 100000,
        tagline: 'e-Fatura + tahsilat + çoklu şantiye + AI',
        features: [
            'Pro paketin tümü',
            'e-Fatura / GİB entegrasyonu',
            'Hakediş → fatura → tahsilat otomasyonu',
            'Çoklu-şantiye konsolidasyon',
            'Amortisman & makine başı kârlılık',
            'AI öneriler',
        ],
    },
}

export const YEARLY_DISCOUNT = 0.15 // yıllık peşin %15 indirim (nakdi öne çeker + churn sigortası)

export interface SubscriptionInfo {
    plan: PlanKey
    planDef: PlanDef
    status: string            // TRIAL | ACTIVE | PAST_DUE | CANCELED
    trialEndsAt: Date | null
    trialDaysLeft: number | null
    machineLimit: number
    machineCount: number
    canAddMachine: boolean
    isActive: boolean         // erişim açık mı
    monthlyEstimate: number   // makineCount * pricePerMachine
    billingCycle: string      // MONTHLY | YEARLY
    annualEstimate: number    // yıllık peşin (indirimli) tutar
    volumeDiscountPct: number          // hacim indirimi % (0 / 15 / 25)
    effectivePricePerMachine: number   // hacim indirimi sonrası per-makine fiyat
}

export async function getSubscription(tenantId: string): Promise<SubscriptionInfo> {
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { plan: true, subscriptionStatus: true, trialEndsAt: true, machineLimit: true, billingCycle: true },
    })
    const machineCount = await prisma.machine.count({ where: { tenantId } })

    const plan = (tenant?.plan as PlanKey) || 'PRO'
    const planDef = PLANS[plan] || PLANS.PRO
    const status = tenant?.subscriptionStatus || 'ACTIVE'
    const machineLimit = tenant?.machineLimit ?? planDef.machineLimit
    const trialEndsAt = tenant?.trialEndsAt ?? null

    let trialDaysLeft: number | null = null
    if (status === 'TRIAL' && trialEndsAt) {
        trialDaysLeft = Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    }

    const trialExpired = status === 'TRIAL' && trialDaysLeft != null && trialDaysLeft < 0
    const isActive = (status === 'ACTIVE') || (status === 'TRIAL' && !trialExpired)

    // Hacim indirimi — makine adedine göre efektif per-makine fiyat
    const volDisc = volumeDiscount(machineCount)
    const effPerMachine = Math.round(planDef.pricePerMachine * (1 - volDisc))

    return {
        plan,
        planDef,
        status,
        trialEndsAt,
        trialDaysLeft,
        machineLimit,
        machineCount,
        canAddMachine: isActive && machineCount < machineLimit,
        isActive,
        monthlyEstimate: machineCount * effPerMachine,
        billingCycle: tenant?.billingCycle || 'MONTHLY',
        annualEstimate: Math.round(machineCount * effPerMachine * 12 * (1 - YEARLY_DISCOUNT)),
        volumeDiscountPct: Math.round(volDisc * 100),
        effectivePricePerMachine: effPerMachine,
    }
}

/** Makine eklenebilir mi — paywall kontrolü. */
export async function checkMachineQuota(tenantId: string): Promise<{ ok: boolean; reason?: string }> {
    const sub = await getSubscription(tenantId)
    if (!sub.isActive) {
        return { ok: false, reason: 'Deneme süreniz doldu veya aboneliğiniz pasif. Lütfen planınızı yükseltin.' }
    }
    if (sub.machineCount >= sub.machineLimit) {
        return { ok: false, reason: `${sub.planDef.name} planı ${sub.machineLimit} makine ile sınırlı. Daha fazlası için planınızı yükseltin.` }
    }
    return { ok: true }
}
