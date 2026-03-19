import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') // GELIR | GIDER | null (hepsi)
    const category = searchParams.get('category')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const machineId = searchParams.get('machineId')

    const where: any = { tenantId }
    if (type) where.type = type
    if (category) where.category = category
    if (machineId) where.machineId = machineId
    if (from || to) {
        where.date = {}
        if (from) where.date.gte = new Date(from)
        if (to) where.date.lte = new Date(to)
    }

    const entries = await prisma.incomeExpense.findMany({
        where,
        orderBy: { date: 'desc' },
        take: 500,
    })

    // Özet
    const totalGelir = entries.filter(e => e.type === 'GELIR').reduce((s, e) => s + Number(e.amount), 0)
    const totalGider = entries.filter(e => e.type === 'GIDER').reduce((s, e) => s + Number(e.amount), 0)
    const netKar = totalGelir - totalGider

    // Kategori bazlı gider
    const categoryBreakdown: Record<string, number> = {}
    entries.filter(e => e.type === 'GIDER').forEach(e => {
        categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + Number(e.amount)
    })

    // Aylık trend (son 6 ay)
    const now = new Date()
    const monthlyTrend = []
    for (let i = 5; i >= 0; i--) {
        const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
        const mEntries = entries.filter(e => e.date >= mStart && e.date <= mEnd)
        monthlyTrend.push({
            month: mStart.toLocaleString('tr-TR', { month: 'short', year: 'numeric' }),
            gelir: mEntries.filter(e => e.type === 'GELIR').reduce((s, e) => s + Number(e.amount), 0),
            gider: mEntries.filter(e => e.type === 'GIDER').reduce((s, e) => s + Number(e.amount), 0),
        })
    }

    return NextResponse.json({ entries, summary: { totalGelir, totalGider, netKar, categoryBreakdown }, monthlyTrend })
}

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const body = await req.json()
    const { type, category, description, amount, date, machineId, customerId, invoiceId, paymentMethod, reference, notes } = body

    const entry = await prisma.incomeExpense.create({
        data: {
            tenantId, type, category, description,
            amount: Number(amount),
            date: new Date(date),
            machineId: machineId || null,
            customerId: customerId || null,
            invoiceId: invoiceId || null,
            paymentMethod: paymentMethod || null,
            reference: reference || null,
            notes: notes || null,
        },
    })

    return NextResponse.json({ entry }, { status: 201 })
}
