import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { parseBody, SiteCreateSchema } from '@/lib/schemas'

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })

        const tenantId = (session.user as any).tenantId
        const _p = parseBody(SiteCreateSchema, await req.json().catch(() => null)); if (!_p.ok) return NextResponse.json({ error: _p.error }, { status: 400 }); const body = _p.data as any

        const site = await prisma.site.create({
            data: {
                tenantId,
                customerId: body.customerId,
                name: body.name,
                address: body.address || null,
                contactPerson: body.contactPerson || null,
                contactPhone: body.contactPhone || null,
                mapsLink: body.mapsLink || body.notes || null,
            },
        })

        return NextResponse.json(site, { status: 201 })
    } catch (error) {
        console.error('Şantiye ekleme hatası:', error)
        return NextResponse.json({ error: 'Şantiye eklenirken hata oluştu' }, { status: 500 })
    }
}
