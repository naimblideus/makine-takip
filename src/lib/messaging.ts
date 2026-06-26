// ─── Outbound Mesajlaşma Adaptörü ──────────────────────────────────────────
// SMS (NetGSM), E-posta (Resend), WhatsApp (Meta Cloud API). Hepsi saf HTTP —
// ekstra bağımlılık yok. traccar.ts ile aynı desen: env yoksa MOCK (loglar,
// gönderim yapmaz) → dev'de akış kırılmaz, prod'da env ile canlıya geçer.

const NETGSM_USERCODE = process.env.NETGSM_USERCODE || ''
const NETGSM_PASSWORD = process.env.NETGSM_PASSWORD || ''
const NETGSM_HEADER = process.env.NETGSM_MSGHEADER || ''

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const MAIL_FROM = process.env.MAIL_FROM || 'Makine Takip <bildirim@makinetakip.app>'

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || ''
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID || ''

const SMS_MOCK = !NETGSM_USERCODE || !NETGSM_PASSWORD
const MAIL_MOCK = !RESEND_API_KEY
const WA_MOCK = !WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID

export interface SendResult {
    ok: boolean
    channel: 'sms' | 'email' | 'whatsapp'
    mock: boolean
    info?: string
}

// ─── Telefon normalizasyonu (TR) → 90XXXXXXXXXX ─────────────
export function normalizePhoneTR(phone: string): string {
    const d = (phone || '').replace(/\D/g, '')
    if (!d) return ''
    if (d.startsWith('90')) return d
    if (d.startsWith('0')) return `90${d.slice(1)}`
    if (d.length === 10) return `90${d}`
    return d
}

// ─── SMS (NetGSM) ───────────────────────────────────────────
export async function sendSms(phone: string, message: string): Promise<SendResult> {
    const num = normalizePhoneTR(phone)
    if (SMS_MOCK) {
        console.log(`[MOCK SMS] → ${num}: ${message.slice(0, 80)}`)
        return { ok: true, channel: 'sms', mock: true, info: 'env yok' }
    }
    try {
        const params = new URLSearchParams({
            usercode: NETGSM_USERCODE, password: NETGSM_PASSWORD,
            gsmno: num, message, msgheader: NETGSM_HEADER, dil: 'TR',
        })
        const res = await fetch(`https://api.netgsm.com.tr/sms/send/get/?${params}`)
        const body = await res.text()
        // NetGSM "00" veya "01"+ jobid ile başarılı döner
        const ok = /^0[0-9]/.test(body.trim())
        return { ok, channel: 'sms', mock: false, info: body.trim().slice(0, 60) }
    } catch (e: any) {
        console.error('SMS hatası:', e?.message)
        return { ok: false, channel: 'sms', mock: false, info: e?.message }
    }
}

// ─── E-posta (Resend) ───────────────────────────────────────
export async function sendEmail(to: string, subject: string, html: string): Promise<SendResult> {
    if (!to) return { ok: false, channel: 'email', mock: MAIL_MOCK, info: 'alıcı yok' }
    if (MAIL_MOCK) {
        console.log(`[MOCK EMAIL] → ${to}: ${subject}`)
        return { ok: true, channel: 'email', mock: true, info: 'env yok' }
    }
    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: MAIL_FROM, to: [to], subject, html }),
        })
        return { ok: res.ok, channel: 'email', mock: false, info: `http ${res.status}` }
    } catch (e: any) {
        console.error('E-posta hatası:', e?.message)
        return { ok: false, channel: 'email', mock: false, info: e?.message }
    }
}

// ─── WhatsApp (Meta Cloud API) ──────────────────────────────
export async function sendWhatsApp(phone: string, message: string): Promise<SendResult> {
    const num = normalizePhoneTR(phone)
    if (WA_MOCK) {
        console.log(`[MOCK WHATSAPP] → ${num}: ${message.slice(0, 80)}`)
        return { ok: true, channel: 'whatsapp', mock: true, info: 'env yok' }
    }
    try {
        const res = await fetch(`https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_ID}/messages`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ messaging_product: 'whatsapp', to: num, type: 'text', text: { body: message } }),
        })
        return { ok: res.ok, channel: 'whatsapp', mock: false, info: `http ${res.status}` }
    } catch (e: any) {
        console.error('WhatsApp hatası:', e?.message)
        return { ok: false, channel: 'whatsapp', mock: false, info: e?.message }
    }
}

// ─── wa.me click-to-chat linki (manuel gönderim için) ───────
export function whatsappLink(phone: string, message: string): string {
    return `https://wa.me/${normalizePhoneTR(phone)}?text=${encodeURIComponent(message)}`
}

// ─── Birleşik müşteri bildirimi (SMS + e-posta birlikte) ────
export async function notifyCustomer(
    target: { phone?: string | null; email?: string | null; name?: string | null },
    payload: { subject: string; smsText: string; emailHtml: string },
): Promise<{ sms?: SendResult; email?: SendResult }> {
    const out: { sms?: SendResult; email?: SendResult } = {}
    if (target.phone) out.sms = await sendSms(target.phone, payload.smsText)
    if (target.email) out.email = await sendEmail(target.email, payload.subject, payload.emailHtml)
    return out
}

// ─── Bağlantı testleri (kredi/erişim kontrolü; MESAJ GÖNDERMEZ, spam yok) ────
export async function testSmsConn(): Promise<{ ok: boolean; info: string }> {
    if (SMS_MOCK) return { ok: false, info: 'NetGSM anahtarı girilmemiş (mock)' }
    try {
        const params = new URLSearchParams({ usercode: NETGSM_USERCODE, password: NETGSM_PASSWORD })
        const res = await fetch(`https://api.netgsm.com.tr/balance/list/get/?${params}`)
        const body = (await res.text()).trim()
        // Hata kodları (30/40/60/70/80...) ile baslarsa basarisiz; aksi halde bakiye doner
        const ok = res.ok && !/^\s*(30|40|60|70|80)\b/.test(body)
        return { ok, info: ok ? `NetGSM bağlandı ✓ (${body.slice(0, 40)})` : `NetGSM kodu: ${body.slice(0, 40)}` }
    } catch (e: any) { return { ok: false, info: e?.message || 'Bağlantı hatası' } }
}
export async function testEmailConn(): Promise<{ ok: boolean; info: string }> {
    if (MAIL_MOCK) return { ok: false, info: 'Resend anahtarı girilmemiş (mock)' }
    try {
        const res = await fetch('https://api.resend.com/domains', { headers: { Authorization: `Bearer ${RESEND_API_KEY}` } })
        return { ok: res.ok, info: res.ok ? 'Resend bağlandı ✓' : `http ${res.status} — anahtar kontrolü` }
    } catch (e: any) { return { ok: false, info: e?.message || 'Bağlantı hatası' } }
}
export async function testWhatsAppConn(): Promise<{ ok: boolean; info: string }> {
    if (WA_MOCK) return { ok: false, info: 'WhatsApp token girilmemiş (mock)' }
    try {
        const res = await fetch(`https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_ID}?fields=display_phone_number`, { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } })
        return { ok: res.ok, info: res.ok ? 'WhatsApp Cloud bağlandı ✓' : `http ${res.status} — token/phone-id kontrolü` }
    } catch (e: any) { return { ok: false, info: e?.message || 'Bağlantı hatası' } }
}

export function channelStatus() {
    return { smsMock: SMS_MOCK, mailMock: MAIL_MOCK, whatsappMock: WA_MOCK }
}
