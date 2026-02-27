import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })

        const { id } = await params
        const tenantId = (session.user as any).tenantId

        const operator = await prisma.operator.findFirst({
            where: { id, tenantId },
            include: {
                rentals: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    include: {
                        machine: { select: { brand: true, model: true, plate: true } },
                        customer: { select: { companyName: true } },
                    },
                },
                timesheets: {
                    orderBy: { date: 'desc' },
                    take: 20,
                    include: {
                        rental: {
                            select: {
                                machine: { select: { brand: true, model: true } },
                            },
                        },
                    },
                },
                _count: { select: { rentals: true, timesheets: true } },
            },
        })

        if (!operator) return NextResponse.json({ error: 'Operatör bulunamadı' }, { status: 404 })

        // Toplam çalışma saati
        const totalHours = await prisma.timesheet.aggregate({
            where: { operatorId: id, tenantId },
            _sum: { hoursWorked: true },
        })

        return NextResponse.json({
            ...operator,
            totalHoursWorked: Number(totalHours._sum.hoursWorked || 0),
        })
    } catch (error) {
        console.error('Operatör detay hatası:', error)
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    }
}
