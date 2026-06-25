import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { parseBody, FuelEntryCreateSchema } from '@/lib/schemas'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })

        const tenantId = (session.user as any).tenantId

        const entries = await prisma.fuelEntry.findMany({
            where: { tenantId },
            orderBy: { date: 'desc' },
            include: {
                machine: { select: { brand: true, model: true, plate: true } },
            },
        })

        return NextResponse.json(entries)
    } catch (error) {
        console.error('Yakıt listesi hatası:', error)
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })

        const tenantId = (session.user as any).tenantId
        const _p = parseBody(FuelEntryCreateSchema, await req.json().catch(() => null)); if (!_p.ok) return NextResponse.json({ error: _p.error }, { status: 400 }); const body = _p.data as any

        const entry = await prisma.fuelEntry.create({
            data: {
                tenantId,
                machineId: body.machineId,
                date: new Date(body.date),
                liters: parseFloat(body.liters),
                cost: parseFloat(body.cost),
                fuelLevel: body.fuelLevel || null,
                supplier: body.supplier || null,
                notes: body.notes || null,
            },
        })

        return NextResponse.json(entry, { status: 201 })
    } catch (error) {
        console.error('Yakıt ekleme hatası:', error)
        return NextResponse.json({ error: 'Yakıt kaydı eklenirken hata oluştu' }, { status: 500 })
    }
}
