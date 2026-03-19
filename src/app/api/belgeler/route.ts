import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const { searchParams } = new URL(req.url)
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')
    const daysAhead = Number(searchParams.get('daysAhead') || 30)

    const where: any = { tenantId }
    if (entityType) where.entityType = entityType
    if (entityId) where.entityId = entityId

    const docs = await prisma.document.findMany({ where, orderBy: { expiryDate: 'asc' } })

    // Yakın süreli / süresi dolmuş belgeleri işaretle
    const now = new Date()
    const alertThreshold = new Date()
    alertThreshold.setDate(alertThreshold.getDate() + daysAhead)

    const enriched = docs.map(d => ({
        ...d,
        daysLeft: d.expiryDate ? Math.ceil((d.expiryDate.getTime() - now.getTime()) / 86400000) : null,
        isExpiringSoon: d.expiryDate ? d.expiryDate <= alertThreshold && d.expiryDate > now : false,
        isExpired: d.expiryDate ? d.expiryDate <= now : false,
    }))

    const expiringSoon = enriched.filter(d => d.isExpiringSoon).length
    const expired = enriched.filter(d => d.isExpired).length

    return NextResponse.json({ documents: enriched, stats: { total: docs.length, expiringSoon, expired } })
}

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const body = await req.json()
    const { entityType, entityId, type, title, filePath, expiryDate, alertDays, notes } = body

    const doc = await prisma.document.create({
        data: {
            tenantId,
            entityType,
            entityId,
            type,
            title,
            filePath: filePath || null,
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            alertDays: alertDays || 30,
            notes: notes || null,
            uploadedBy: (session.user as any).name,
        },
    })

    return NextResponse.json({ document: doc }, { status: 201 })
}
