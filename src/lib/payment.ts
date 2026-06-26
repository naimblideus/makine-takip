// ─── Ödeme Sağlayıcı (iyzico Checkout Form) ────────────────────────────────
// env yoksa MOCK: kendi /odeme sayfamız üzerinden test ödemesi.
// env varsa GERÇEK: iyzico hosted Checkout Form (IYZWSv2 imzalı). Kart verisi
// ASLA bize gelmez (PCI-DSS hosted/token modeli). Saf HTTP + Node crypto — SDK yok.
import { randomBytes, createHmac } from 'crypto'

const IYZICO_API_KEY = process.env.IYZICO_API_KEY || ''
const IYZICO_SECRET = process.env.IYZICO_SECRET || ''
const IYZICO_URI = process.env.IYZICO_URI || 'https://sandbox-api.iyzipay.com'

export const PAYMENT_MOCK = !IYZICO_API_KEY || !IYZICO_SECRET

export function genPayToken(): string {
    return randomBytes(20).toString('hex')
}

export interface CheckoutResult {
    checkoutUrl: string
    ref: string
    token?: string
    mock: boolean
    error?: string
}

// ─── IYZWSv2 yetkilendirme başlığı (iyzico resmi imza algoritması) ──────────
function iyziAuth(uriPath: string, bodyStr: string) {
    const rnd = Date.now().toString() + randomBytes(6).toString('hex')
    const payload = rnd + uriPath + bodyStr
    const signature = createHmac('sha256', IYZICO_SECRET).update(payload, 'utf8').digest('hex')
    const authStr = `apiKey:${IYZICO_API_KEY}&randomKey:${rnd}&signature:${signature}`
    const auth = 'IYZWSv2 ' + Buffer.from(authStr, 'utf8').toString('base64')
    return { auth, rnd }
}

async function iyziPost(uriPath: string, body: any): Promise<any> {
    const bodyStr = JSON.stringify(body)
    const { auth, rnd } = iyziAuth(uriPath, bodyStr)
    const res = await fetch(`${IYZICO_URI}${uriPath}`, {
        method: 'POST',
        headers: {
            'Authorization': auth,
            'x-iyzi-rnd': rnd,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: bodyStr,
    })
    return res.json().catch(() => ({ status: 'failure', errorMessage: `http ${res.status}` }))
}

/** Ödeme sayfası başlat. MOCK: kendi sayfamız. GERÇEK: iyzico hosted Checkout Form. */
export async function createCheckout(params: {
    invoiceNumber: string
    amount: number
    payToken: string
    baseUrl: string
    buyerName?: string
    buyerEmail?: string
    buyerPhone?: string
}): Promise<CheckoutResult> {
    if (PAYMENT_MOCK) {
        return { checkoutUrl: `${params.baseUrl}/odeme/${params.payToken}`, ref: `mock_${params.payToken.slice(0, 12)}`, mock: true }
    }

    const price = params.amount.toFixed(2)
    const nameParts = (params.buyerName || 'Müşteri Firma').trim().split(' ')
    const surname = nameParts.length > 1 ? nameParts.pop()! : 'Firma'
    const name = nameParts.join(' ') || 'Müşteri'
    const body = {
        locale: 'tr',
        conversationId: params.payToken,
        price,
        paidPrice: price,
        currency: 'TRY',
        basketId: params.invoiceNumber,
        paymentGroup: 'PRODUCT',
        // iyzico ödeme sonucu bu adrese POST'lar → biz retrieve edip faturayı kapatırız
        callbackUrl: `${params.baseUrl}/api/odeme/callback`,
        buyer: {
            id: params.payToken.slice(0, 16),
            name, surname,
            gsmNumber: params.buyerPhone || '+905555555555',
            email: params.buyerEmail || 'fatura@makinetakip.app',
            identityNumber: '11111111111',
            registrationAddress: 'Türkiye',
            city: 'İstanbul', country: 'Türkiye',
            ip: '85.34.78.112',
        },
        billingAddress: { contactName: name + ' ' + surname, city: 'İstanbul', country: 'Türkiye', address: 'Türkiye' },
        basketItems: [{
            id: params.invoiceNumber, name: `Fatura ${params.invoiceNumber}`,
            category1: 'Hizmet', itemType: 'VIRTUAL', price,
        }],
    }
    try {
        const r = await iyziPost('/payment/iyzipos/checkoutform/initialize/auth/ecom', body)
        if (r?.status === 'success' && r?.paymentPageUrl) {
            return { checkoutUrl: r.paymentPageUrl, ref: r.token, token: r.token, mock: false }
        }
        // iyzico hata → kendi sayfamıza düş (akış kırılmasın), hatayı taşı
        return { checkoutUrl: `${params.baseUrl}/odeme/${params.payToken}`, ref: `iyzico_err`, mock: false, error: r?.errorMessage || 'iyzico başlatılamadı' }
    } catch (e: any) {
        return { checkoutUrl: `${params.baseUrl}/odeme/${params.payToken}`, ref: 'iyzico_exc', mock: false, error: e?.message }
    }
}

/** Callback'te iyzico ödeme sonucunu doğrula (token ile). */
export async function retrieveCheckout(token: string): Promise<{ ok: boolean; conversationId?: string; paidPrice?: number; info?: string }> {
    if (PAYMENT_MOCK) return { ok: false, info: 'mock' }
    try {
        const r = await iyziPost('/payment/iyzipos/checkoutform/auth/ecom/detail', { locale: 'tr', token })
        const ok = r?.status === 'success' && r?.paymentStatus === 'SUCCESS'
        return { ok, conversationId: r?.conversationId, paidPrice: Number(r?.paidPrice) || undefined, info: r?.errorMessage || r?.paymentStatus }
    } catch (e: any) {
        return { ok: false, info: e?.message }
    }
}

/** Bağlantı testi — anahtarların geçerliliğini iyzico BIN-check ile doğrular. */
export async function testIyzico(): Promise<{ ok: boolean; info: string }> {
    if (PAYMENT_MOCK) return { ok: false, info: 'Anahtar girilmemiş (mock modda)' }
    try {
        const r = await iyziPost('/payment/bin/check', { locale: 'tr', conversationId: 'test', binNumber: '554960' })
        if (r?.status === 'success') return { ok: true, info: 'iyzico bağlantısı doğrulandı ✓' }
        return { ok: false, info: r?.errorMessage || 'Yetkilendirme reddedildi (anahtarları kontrol edin)' }
    } catch (e: any) {
        return { ok: false, info: e?.message || 'Bağlantı hatası' }
    }
}

export function paymentChannelStatus() {
    return { mock: PAYMENT_MOCK, uri: PAYMENT_MOCK ? 'mock' : IYZICO_URI }
}
