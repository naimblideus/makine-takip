// POST /api/gps/speedlimit — Hız sınırı güncelle
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })
        }

        const tenantId = (session.user as any).tenantId
        const body = await req.json()
        const { machineId, speedLimit } = body

        if (!machineId) {
            return NextResponse.json({ error: 'machineId gerekli' }, { status: 400 })
        }

        const machine = await prisma.machine.findFirst({
            where: { id: machineId, tenantId },
        })

        if (!machine) {
            return NextResponse.json({ error: 'Makine bulunamadı' }, { status: 404 })
        }

        await prisma.machine.update({
            where: { id: machineId },
            data: { speedLimit: speedLimit ? parseInt(speedLimit) : null },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Hız sınırı güncelleme hatası:', error)
        return NextResponse.json({ error: 'Hız sınırı güncellenemedi' }, { status: 500 })
    }
}
