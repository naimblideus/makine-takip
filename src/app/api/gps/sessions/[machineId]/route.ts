// GET /api/gps/sessions/[machineId] — Motor oturumları
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ machineId: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })
        }

        const tenantId = (session.user as any).tenantId
        const { machineId } = await params
        const { searchParams } = new URL(req.url)
        const from = searchParams.get('from')
        const to = searchParams.get('to')

        // Varsayılan: bugün
        const fromDate = from ? new Date(from) : new Date(new Date().setHours(0, 0, 0, 0))
        const toDate = to ? new Date(to) : new Date()

        const sessions = await prisma.engineSession.findMany({
            where: {
                tenantId,
                machineId,
                startedAt: { gte: fromDate, lte: toDate },
            },
            orderBy: { startedAt: 'desc' },
            include: {
                operator: { select: { name: true } },
            },
        })

        // Bugünkü özet
        const todaySessions = sessions.filter(s => {
            const start = new Date(s.startedAt)
            const today = new Date()
            return start.toDateString() === today.toDateString()
        })

        const summary = {
            totalSessions: todaySessions.length,
            totalDuration: todaySessions.reduce((s, se) => s + (se.durationMinutes || 0), 0),
            totalIdle: todaySessions.reduce((s, se) => s + (se.idleMinutes || 0), 0),
            totalWork: todaySessions.reduce((s, se) => s + (se.workMinutes || 0), 0),
            maxSpeed: Math.max(0, ...todaySessions.map(s => s.maxSpeed || 0)),
            totalFuel: todaySessions.reduce((s, se) => s + (se.fuelConsumed || 0), 0),
            unauthorizedCount: todaySessions.filter(s => !s.isAuthorized).length,
        }

        return NextResponse.json({ sessions, summary })
    } catch (error) {
        console.error('Motor oturumları hatası:', error)
        return NextResponse.json({ error: 'Motor oturumları alınamadı' }, { status: 500 })
    }
}
