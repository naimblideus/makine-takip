// POST /api/gps/command — Motor durdur/başlat komutu
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { sendCommand } from '@/lib/traccar'

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })
        }

        const tenantId = (session.user as any).tenantId
        const userId = (session.user as any).id
        const body = await req.json()
        const { machineId, command, reason } = body

        if (!machineId || !command) {
            return NextResponse.json({ error: 'machineId ve command gerekli' }, { status: 400 })
        }

        // Makineyi bul
        const machine = await prisma.machine.findFirst({
            where: { id: machineId, tenantId },
        })

        if (!machine) {
            return NextResponse.json({ error: 'Makine bulunamadı' }, { status: 404 })
        }

        if (!machine.traccarDeviceId) {
            return NextResponse.json({ error: 'Bu makinenin GPS cihazı tanımlı değil' }, { status: 400 })
        }

        // Traccar komutu gönder
        const success = await sendCommand(machine.traccarDeviceId, command)

        if (!success) {
            return NextResponse.json({ error: 'Komut gönderilemedi' }, { status: 500 })
        }

        // GpsLog kaydı oluştur
        const action = command === 'engineStop' ? 'ENGINE_STOP' : 'ENGINE_START'
        await prisma.gpsLog.create({
            data: {
                tenantId,
                machineId,
                action: action as any,
                triggeredBy: userId,
                reason: reason || (command === 'engineStop' ? 'Manuel motor durdurma' : 'Manuel motor başlatma'),
            },
        })

        // Bildirim oluştur
        await prisma.systemNotification.create({
            data: {
                tenantId,
                type: 'MOTOR_DURDU',
                title: command === 'engineStop'
                    ? `Motor Durduruldu: ${machine.brand} ${machine.model}`
                    : `Motor Başlatıldı: ${machine.brand} ${machine.model}`,
                message: `${machine.plate || machine.serialNumber || ''} — ${reason || 'Kullanıcı tarafından'}`,
                machineId,
            },
        })

        return NextResponse.json({ success: true, action })
    } catch (error) {
        console.error('GPS komut hatası:', error)
        return NextResponse.json({ error: 'Komut gönderilemedi' }, { status: 500 })
    }
}
