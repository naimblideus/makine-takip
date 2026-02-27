// GET & PUT /api/bildirimler — SystemNotification CRUD
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })

        const tenantId = (session.user as any).tenantId
        const { searchParams } = new URL(req.url)
        const limit = parseInt(searchParams.get('limit') || '50')
        const unreadOnly = searchParams.get('unread') === 'true'
        const type = searchParams.get('type')

        const where: any = { tenantId }
        if (unreadOnly) where.isRead = false
        if (type) where.type = type

        const [notifications, unreadCount] = await Promise.all([
            prisma.systemNotification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
            }),
            prisma.systemNotification.count({
                where: { tenantId, isRead: false },
            }),
        ])

        return NextResponse.json({ notifications, unreadCount })
    } catch (error) {
        console.error('Bildirim listesi hatası:', error)
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })

        const tenantId = (session.user as any).tenantId
        const body = await req.json()

        if (body.action === 'readAll') {
            await prisma.systemNotification.updateMany({
                where: { tenantId, isRead: false },
                data: { isRead: true },
            })
            return NextResponse.json({ success: true })
        }

        if (body.id) {
            await prisma.systemNotification.update({
                where: { id: body.id },
                data: { isRead: true },
            })
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
    } catch (error) {
        console.error('Bildirim güncelleme hatası:', error)
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    }
}
