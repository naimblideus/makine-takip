import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })

        const tenantId = (session.user as any).tenantId

        const timesheets = await prisma.timesheet.findMany({
            where: { tenantId },
            orderBy: { date: 'desc' },
            take: 50,
            include: {
                operator: { select: { name: true } },
                rental: {
                    select: {
                        machine: { select: { brand: true, model: true, plate: true } },
                        customer: { select: { companyName: true } },
                    },
                },
            },
        })

        return NextResponse.json(timesheets)
    } catch (error) {
        console.error('Puantaj listesi hatası:', error)
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })

        const tenantId = (session.user as any).tenantId
        const body = await req.json()

        const timesheet = await prisma.timesheet.create({
            data: {
                tenantId,
                operatorId: body.operatorId,
                rentalId: body.rentalId,
                date: new Date(body.date),
                hoursWorked: parseFloat(body.hoursWorked),
                type: body.type,
                notes: body.notes || null,
            },
        })

        return NextResponse.json(timesheet, { status: 201 })
    } catch (error) {
        console.error('Puantaj ekleme hatası:', error)
        return NextResponse.json({ error: 'Puantaj eklenirken hata oluştu' }, { status: 500 })
    }
}
