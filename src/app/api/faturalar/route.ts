import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })

        const tenantId = (session.user as any).tenantId

        const invoices = await prisma.invoice.findMany({
            where: { tenantId },
            orderBy: { issueDate: 'desc' },
            include: {
                customer: { select: { companyName: true } },
            },
        })

        return NextResponse.json(invoices)
    } catch (error) {
        console.error('Fatura listesi hatası:', error)
        return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    }
}
