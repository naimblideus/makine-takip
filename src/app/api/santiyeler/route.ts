import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })

        const tenantId = (session.user as any).tenantId
        const { searchParams } = new URL(req.url)
        const customerId = searchParams.get('customerId')

        const where: any = { tenantId }
        if (customerId) where.customerId = customerId

        const sites = await prisma.site.findMany({
            where,
            orderBy: { name: 'asc' },
            include: {
                customer: { select: { companyName: true } },
            },
        })

        return NextResponse.json(sites)
    } catch (error) {
        console.error('Şantiye listesi hatası:', error)
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    }
}
