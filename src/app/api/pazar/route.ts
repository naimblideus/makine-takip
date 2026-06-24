// GET /api/pazar — PUBLIC: Kiralama borsası ilanları (tüm firmalardan, ilana açık makineler)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantRatings } from '@/lib/reputation'

const TYPE_LABELS: Record<string, string> = { FORKLIFT: 'Forklift', EKSAVATOR: 'Ekskavatör', VINC: 'Vinç', DOZER: 'Dozer', KEPCE: 'Kepçe', GREYDER: 'Greyder', SILINDIR: 'Silindir', KAMYON: 'Kamyon', BEKO_LODER: 'Beko Loder', DIGER: 'Diğer' }

export async function GET(req: NextRequest) {
    const sp = new URL(req.url).searchParams
    const type = sp.get('type')
    const city = sp.get('city')
    const search = sp.get('search')

    const where: any = { marketplaceListed: true }
    if (type && type !== 'all') where.type = type
    if (city) where.marketplaceCity = { contains: city, mode: 'insensitive' }
    if (search) where.OR = [
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
    ]

    const machines = await prisma.machine.findMany({
        where,
        orderBy: [{ marketplaceFeatured: 'desc' }, { updatedAt: 'desc' }],
        select: {
            id: true, brand: true, model: true, type: true, year: true, status: true,
            dailyRate: true, weeklyRate: true, monthlyRate: true,
            marketplaceCity: true, marketplaceNote: true, marketplaceFeatured: true, photo: true,
            tenantId: true,
            tenant: { select: { name: true } },
        },
        take: 200,
    })

    const ratings = await getTenantRatings(machines.map(m => m.tenantId))
    const listings = machines.map(m => ({
        id: m.id, brand: m.brand, model: m.model, type: m.type, typeLabel: TYPE_LABELS[m.type] || m.type,
        year: m.year, status: m.status, available: m.status === 'MUSAIT',
        dailyRate: m.dailyRate, weeklyRate: m.weeklyRate, monthlyRate: m.monthlyRate,
        city: m.marketplaceCity, note: m.marketplaceNote, featured: m.marketplaceFeatured, photo: m.photo,
        ownerName: m.tenant?.name, rating: ratings[m.tenantId] || null,
    }))

    // Filtre seçenekleri için şehir listesi
    const cities = [...new Set(machines.map(m => m.marketplaceCity).filter(Boolean))]

    return NextResponse.json({ listings, total: listings.length, cities })
}
