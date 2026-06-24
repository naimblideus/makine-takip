// ─── Para Aritmetiği — güvenli yuvarlama ───────────────────────────────────
// Floating-point birikim hatasını önler. Tüm hakediş/fatura/teklif/ödeme
// hesapları bu yardımcıdan geçmeli (kuruş tutarlılığı).

/** 2 ondalığa güvenli yuvarla (kuruş). */
export function toMoney(n: number): number {
    if (!Number.isFinite(n)) return 0
    return Math.round((n + Number.EPSILON) * 100) / 100
}

/** Sayı dizisini kuruş-güvenli topla. */
export function sumMoney(...vals: (number | null | undefined)[]): number {
    return toMoney(vals.reduce<number>((s, v) => s + (Number(v) || 0), 0))
}

/** KDV tutarı (taban × oran%). */
export function taxOf(base: number, ratePct: number): number {
    return toMoney(base * (ratePct / 100))
}
