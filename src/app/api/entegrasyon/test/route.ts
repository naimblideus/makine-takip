// /api/entegrasyon/test — authed: entegrasyon durumu (GET) + bağlantı testi (POST)
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { channelStatus, testSmsConn, testEmailConn, testWhatsAppConn } from '@/lib/messaging'
import { isTraccarMock, testTraccar } from '@/lib/traccar'
import { efaturaChannelStatus, testEfatura } from '@/lib/efatura'
import { paymentChannelStatus, testIyzico } from '@/lib/payment'

export async function GET() {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const m = channelStatus()
    const efa = efaturaChannelStatus()
    const pay = paymentChannelStatus()
    return NextResponse.json({
        gps: { mock: isTraccarMock() },
        sms: { mock: m.smsMock },
        email: { mock: m.mailMock },
        whatsapp: { mock: m.whatsappMock },
        efatura: { mock: efa.mock, provider: efa.provider },
        iyzico: { mock: pay.mock, uri: pay.uri },
    })
}

export async function POST(req: NextRequest) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const { channel } = await req.json().catch(() => ({} as any))
    const map: Record<string, () => Promise<{ ok: boolean; info: string }>> = {
        gps: testTraccar,
        sms: testSmsConn,
        email: testEmailConn,
        whatsapp: testWhatsAppConn,
        efatura: testEfatura,
        iyzico: testIyzico,
    }
    const fn = map[channel]
    if (!fn) return NextResponse.json({ error: 'Geçersiz kanal' }, { status: 400 })
    const result = await fn()
    return NextResponse.json(result)
}
