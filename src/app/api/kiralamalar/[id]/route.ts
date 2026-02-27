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

        const rental = await prisma.rental.findFirst({
            where: { id, tenantId },
            include: {
                machine: true,
                customer: true,
                operator: true,
                site: true,
                invoices: {
                    include: { payments: true },
                },
            },
        })

        if (!rental) return NextResponse.json({ error: 'Kiralama bulunamadı' }, { status: 404 })
        return NextResponse.json(rental)
    } catch (error) {
        console.error('Kiralama detay hatası:', error)
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    }
}

// İade işlemi
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })

        const { id } = await params
        const tenantId = (session.user as any).tenantId
        const body = await req.json()

        const rental = await prisma.rental.findFirst({
            where: { id, tenantId },
        })

        if (!rental) return NextResponse.json({ error: 'Kiralama bulunamadı' }, { status: 404 })

        // İade: kiralama tamamla + makine müsait yap
        if (body.action === 'return') {
            const [updatedRental] = await prisma.$transaction([
                prisma.rental.update({
                    where: { id },
                    data: {
                        status: 'TAMAMLANDI',
                        actualEndDate: new Date(),
                        endDate: new Date(),
                        returnHours: body.returnHours ? parseInt(body.returnHours) : null,
                        returnFuel: body.returnFuel || null,
                        notes: body.notes ? `${rental.notes || ''}\n--- İade Notu ---\n${body.notes}` : rental.notes,
                    },
                }),
                prisma.machine.update({
                    where: { id: rental.machineId },
                    data: {
                        status: 'MUSAIT',
                        totalHours: body.returnHours ? parseInt(body.returnHours) : undefined,
                    },
                }),
            ])

            return NextResponse.json(updatedRental)
        }

        // İptal
        if (body.action === 'cancel') {
            const [updatedRental] = await prisma.$transaction([
                prisma.rental.update({
                    where: { id },
                    data: { status: 'IPTAL' },
                }),
                prisma.machine.update({
                    where: { id: rental.machineId },
                    data: { status: 'MUSAIT' },
                }),
            ])

            return NextResponse.json(updatedRental)
        }

        return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 })
    } catch (error) {
        console.error('Kiralama güncelleme hatası:', error)
        return NextResponse.json({ error: 'İşlem hatası' }, { status: 500 })
    }
}
