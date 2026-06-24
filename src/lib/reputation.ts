// ─── Pazar İtibar Yardımcısı ───────────────────────────────────────────────
import { prisma } from '@/lib/prisma'

export interface Rating { avg: number; count: number }

/** Verilen tenant'lar için ortalama puan + adet. */
export async function getTenantRatings(tenantIds: string[]): Promise<Record<string, Rating>> {
    const ids = [...new Set(tenantIds)].filter(Boolean)
    if (!ids.length) return {}
    const groups = await prisma.marketplaceReview.groupBy({
        by: ['tenantId'],
        where: { tenantId: { in: ids } },
        _avg: { rating: true },
        _count: { rating: true },
    })
    const out: Record<string, Rating> = {}
    for (const g of groups) {
        out[g.tenantId] = { avg: Math.round((g._avg.rating || 0) * 10) / 10, count: g._count.rating }
    }
    return out
}
