// ─── e-Fatura / GİB Entegratör Adaptörü ────────────────────────────────────
// Türkiye e-Fatura/e-Arşiv zorunluluğu (2026: kağıt fatura bitti). UBL-TR XML
// ve mali mühür ENTEGRATÖRDE üretilir — kendin yazma. Bu katman entegratöre
// (Nilvera / Paraşüt / Foriba) bağlanır. env yoksa MOCK: gerçek ETTN benzeri
// referans üretir, faturayı "MOCK" olarak işaretler → dev'de akış kırılmaz.

const PROVIDER = process.env.EFATURA_PROVIDER || ''     // 'nilvera' | 'parasut' | ...
const API_KEY = process.env.EFATURA_API_KEY || ''
const USERNAME = process.env.EFATURA_USERNAME || ''

const IS_MOCK = !PROVIDER || !API_KEY

export interface EInvoiceInput {
    invoice: any      // Invoice (+items, subtotal, taxAmount, totalAmount, invoiceNumber, issueDate)
    customer: any     // Customer (companyName, taxOffice, taxNumber, address, email)
    tenant: any       // Tenant (name, taxOffice, taxNumber, address)
}

export interface EInvoiceResult {
    ok: boolean
    mock: boolean
    uuid?: string
    ettn?: string
    status: string    // GONDERILDI | KABUL | RED | MOCK | HATA
    info?: string
}

function genRef(): string {
    try { return (globalThis.crypto as any)?.randomUUID?.() || `${Date.now()}-${Math.round(Math.random() * 1e9)}` }
    catch { return `${Date.now()}` }
}

/** Faturayı e-Fatura/e-Arşiv olarak entegratöre gönderir. */
export async function sendEInvoice(input: EInvoiceInput): Promise<EInvoiceResult> {
    const { invoice, customer } = input

    // Alıcı VKN/TCKN var mı → e-Fatura, yoksa e-Arşiv (mantık entegratörde netleşir)
    const hasVkn = !!customer?.taxNumber

    if (IS_MOCK) {
        const uuid = genRef()
        console.log(`[MOCK e-FATURA] ${invoice?.invoiceNumber} → ${customer?.companyName} (${hasVkn ? 'e-Fatura' : 'e-Arşiv'}) ETTN=${uuid}`)
        return { ok: true, mock: true, uuid, ettn: uuid, status: 'MOCK', info: 'Entegratör env yok — mock gönderim' }
    }

    try {
        // ── GERÇEK ENTEGRATÖR ÇAĞRISI (örnek iskelet — Nilvera benzeri) ──
        // Not: Gerçek entegrasyonda UBL-TR belgesi ve mali mühür entegratörce üretilir.
        const payload = {
            invoiceNumber: invoice.invoiceNumber,
            issueDate: invoice.issueDate,
            scenario: hasVkn ? 'TICARIFATURA' : 'EARSIVFATURA',
            buyer: {
                title: customer.companyName,
                taxOffice: customer.taxOffice,
                taxNumber: customer.taxNumber,
                address: customer.address,
                email: customer.email,
            },
            lines: (typeof invoice.items === 'string' ? JSON.parse(invoice.items || '[]') : invoice.items) || [],
            taxRate: Number(invoice.taxRate || 20),
            subtotal: Number(invoice.subtotal),
            taxAmount: Number(invoice.taxAmount),
            total: Number(invoice.totalAmount),
        }
        const res = await fetch(`${integratorBaseUrl()}/invoices`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json', 'X-User': USERNAME },
            body: JSON.stringify(payload),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) return { ok: false, mock: false, status: 'HATA', info: `http ${res.status}` }
        return {
            ok: true, mock: false,
            uuid: data.uuid || data.id,
            ettn: data.ettn || data.uuid,
            status: data.status || 'GONDERILDI',
            info: `${PROVIDER} kabul`,
        }
    } catch (e: any) {
        console.error('e-Fatura gönderim hatası:', e?.message)
        return { ok: false, mock: false, status: 'HATA', info: e?.message }
    }
}

function integratorBaseUrl(): string {
    switch (PROVIDER) {
        case 'nilvera': return 'https://api.nilvera.com/einvoice'
        case 'parasut': return 'https://api.parasut.com/v4'
        default: return process.env.EFATURA_BASE_URL || 'https://example-entegrator.test'
    }
}

export function efaturaChannelStatus() {
    return { mock: IS_MOCK, provider: PROVIDER || 'mock' }
}
