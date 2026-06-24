// ─── API Güvenlik Yardımcıları ─────────────────────────────────────────────
// Cron secret (prod'da 'dev' fallback KAPALI) + basit in-memory rate limit.

const isProd = process.env.NODE_ENV === 'production'

/** Cron endpoint yetkisi: CRON_SECRET eşleşmeli. 'dev' yalnızca prod-dışı. */
export function cronAuthorized(req: Request): boolean {
    const key = new URL(req.url).searchParams.get('key')
    if (process.env.CRON_SECRET && key === process.env.CRON_SECRET) return true
    if (!isProd && key === 'dev') return true
    return false
}

// ── Basit in-memory rate limit (tek-instance; ölçekte Redis önerilir) ──
const buckets = new Map<string, { count: number; reset: number }>()

export function rateLimit(key: string, max = 10, windowMs = 60_000): boolean {
    const now = Date.now()
    const b = buckets.get(key)
    if (!b || b.reset < now) {
        buckets.set(key, { count: 1, reset: now + windowMs })
        return true
    }
    if (b.count >= max) return false
    b.count++
    return true
}

export function clientIp(req: Request): string {
    const xff = req.headers.get('x-forwarded-for')
    if (xff) return xff.split(',')[0].trim()
    return req.headers.get('x-real-ip') || 'unknown'
}

/** Rate limit aşıldıysa 429 yanıtı üretir, yoksa null. */
export function rateLimited(req: Request, scope: string, max = 10, windowMs = 60_000) {
    const ok = rateLimit(`${scope}:${clientIp(req)}`, max, windowMs)
    if (ok) return null
    return Response.json({ error: 'Çok fazla istek. Lütfen biraz sonra tekrar deneyin.' }, { status: 429 })
}
