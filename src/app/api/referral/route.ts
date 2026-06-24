// /api/referral — Gömülü fintech: sigorta/leasing/yakıt yönlendirme talepleri
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const VALID = ['SIGORTA', 'LEASING', 'YAKIT']

export async function GET() {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId
    const leads = await prisma.referralLead.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ leads })
}

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const tenantId = (session.user as any).tenantId
    const { type, machineId, note, contact } = await req.json()
    if (!VALID.includes(type)) return NextResponse.json({ error: 'Geçersiz tür' }, { status: 400 })

    const lead = await prisma.referralLead.create({
        data: { tenantId, type, machineId: machineId || null, note: note || null, contact: contact || null },
    })
    return NextResponse.json({ lead }, { status: 201 })
}
