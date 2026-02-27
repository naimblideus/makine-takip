import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })

        const tenantId = (session.user as any).tenantId

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                id: true,
                name: true,
                logo: true,
                address: true,
                phone: true,
                email: true,
                taxOffice: true,
                taxNumber: true,
            },
        })

        if (!tenant) {
            return NextResponse.json({ error: 'Firma bulunamadı' }, { status: 404 })
        }

        return NextResponse.json(tenant)
    } catch (error) {
        console.error('Ayarlar okuma hatası:', error)
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })

        const tenantId = (session.user as any).tenantId
        const body = await req.json()

        const updated = await prisma.tenant.update({
            where: { id: tenantId },
            data: {
                name: body.companyName || body.name,
                address: body.address || null,
                phone: body.phone || null,
                email: body.email || null,
                taxOffice: body.taxOffice || null,
                taxNumber: body.taxNumber || null,
            },
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error('Ayarlar güncelleme hatası:', error)
        return NextResponse.json({ error: 'Ayarlar güncellenirken hata oluştu' }, { status: 500 })
    }
}
