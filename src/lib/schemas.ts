// ─── Zod Doğrulama Şemaları ────────────────────────────────────────────────
// Yazma uçlarında ham body yerine doğrulanmış veri. Türkçe alan-bazlı hata.
import { z } from 'zod'

const optStr = (max: number) => z.string().max(max).optional().or(z.literal('')).transform(v => v || undefined)

export const SignupSchema = z.object({
    companyName: z.string().min(1, 'Firma adı zorunlu').max(200),
    name: z.string().min(1, 'Ad zorunlu').max(120),
    email: z.string().email('Geçerli e-posta girin').max(160),
    password: z.string().min(6, 'Şifre en az 6 karakter').max(100),
    phone: optStr(30),
})

export const PortalActionSchema = z.object({
    action: z.enum(['ONAYLA', 'REDDET']),
    signature: z.string().max(800_000).nullable().optional(),
})

export const TeklifPortalSchema = z.object({
    action: z.enum(['KABUL', 'RED']),
})

export const ArizaSchema = z.object({
    description: z.string().min(3, 'Lütfen arızayı kısaca açıklayın').max(500),
    reporterName: optStr(120),
    reporterPhone: optStr(30),
})

export const PaymentSchema = z.object({
    invoiceId: z.string().uuid().optional(),
    customerId: z.string().uuid().optional(),
    amount: z.coerce.number().positive('Tutar pozitif olmalı'),
    method: z.enum(['NAKIT', 'KREDI_KARTI', 'HAVALE_EFT', 'CEK', 'SENET']),
    paidAt: z.string().optional(),
    notes: optStr(500),
}).refine(d => d.invoiceId || d.customerId, { message: 'Fatura veya müşteri belirtilmeli' })

export const QuoteCreateSchema = z.object({
    customerName: z.string().min(1, 'Müşteri adı zorunlu').max(200),
    customerPhone: optStr(30),
    customerId: z.string().uuid().optional().or(z.literal('')).transform(v => v || undefined),
    machineId: z.string().uuid().optional().or(z.literal('')).transform(v => v || undefined),
    machineType: optStr(30),
    machineLabel: optStr(200),
    periodType: z.enum(['SAATLIK', 'GUNLUK', 'HAFTALIK', 'AYLIK']).default('GUNLUK'),
    unitPrice: z.coerce.number().positive('Birim fiyat pozitif olmalı'),
    quantity: z.coerce.number().int().positive().default(1),
    operatorIncluded: z.boolean().optional().default(false),
    transportCost: z.coerce.number().nonnegative().optional(),
    discount: z.coerce.number().nonnegative().optional(),
    taxRate: z.coerce.number().min(0).max(100).default(20),
    validUntil: z.string().optional(),
    notes: optStr(1000),
})

/** safeParse + Türkçe ilk hata mesajı döner. */
export function parseBody<T>(schema: z.ZodType<T>, body: unknown): { ok: true; data: T } | { ok: false; error: string } {
    const r = schema.safeParse(body)
    if (r.success) return { ok: true, data: r.data }
    const first = r.error.issues[0]
    return { ok: false, error: first?.message || 'Geçersiz veri' }
}
