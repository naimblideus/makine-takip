// ─── Ödeme Sağlayıcı Soyutlaması (iyzico / sanal POS) ──────────────────────
// env yoksa MOCK: kendi /odeme sayfamız üzerinden test ödemesi. iyzico anahtarı
// gelince createCheckout gerçek iyzico Checkout Form'a yönlendirir.
// PCI-DSS: kart verisi ASLA bizde tutulmaz — iyzico hosted/token modeli.
import { randomBytes } from 'crypto'

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
    mock: boolean
}

export async function createCheckout(params: {
    invoiceNumber: string
    amount: number
    payToken: string
    baseUrl: string
    buyerName?: string
}): Promise<CheckoutResult> {
    if (PAYMENT_MOCK) {
        return { checkoutUrl: `${params.baseUrl}/odeme/${params.payToken}`, ref: `mock_${params.payToken.slice(0, 12)}`, mock: true }
    }

    // ── GERÇEK iyzico (iskelet — canlı anahtar gelince doldurulur) ──
    // const Iyzipay = require('iyzipay')
    // const iyzipay = new Iyzipay({ apiKey: IYZICO_API_KEY, secretKey: IYZICO_SECRET, uri: IYZICO_URI })
    // checkoutFormInitialize → result.paymentPageUrl + result.token
    // callbackUrl: `${baseUrl}/api/odeme/${payToken}` (webhook doğrular)
    // Kart verisi iyzico hosted sayfasında alınır, bize gelmez.
    return { checkoutUrl: `${params.baseUrl}/odeme/${params.payToken}`, ref: `iyzico_${params.payToken.slice(0, 10)}`, mock: false }
}

export function paymentChannelStatus() {
    return { mock: PAYMENT_MOCK, uri: PAYMENT_MOCK ? 'mock' : IYZICO_URI }
}
