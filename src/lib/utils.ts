import { format, formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

/**
 * Para tutarını Türk Lirası olarak formatlar
 */
export function formatCurrency(amount: number | string | null | undefined): string {
    if (amount === null || amount === undefined) return '₺0'
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(num)
}

/**
 * Tarihi Türkçe formatlar: 15 Şub 2025
 */
export function formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-'
    const d = typeof date === 'string' ? new Date(date) : date
    return format(d, 'd MMM yyyy', { locale: tr })
}

/**
 * Tarihi kısa formatlar: 15.02.2025
 */
export function formatDateShort(date: Date | string | null | undefined): string {
    if (!date) return '-'
    const d = typeof date === 'string' ? new Date(date) : date
    return format(d, 'dd.MM.yyyy', { locale: tr })
}

/**
 * Göreli zaman: 3 gün önce, 2 saat önce
 */
export function formatRelativeDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return formatDistanceToNow(d, { addSuffix: true, locale: tr })
}

/**
 * Sayıyı noktalı formata çevirir: 1.250.000
 */
export function formatNumber(num: number | string | null | undefined): string {
    if (num === null || num === undefined) return '0'
    const n = typeof num === 'string' ? parseFloat(num) : num
    return new Intl.NumberFormat('tr-TR').format(n)
}

/**
 * Yüzde değişimi hesaplar
 */
export function calcPercentChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
}

/**
 * Class name birleştirir (falsy değerleri filtreler)
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
    return classes.filter(Boolean).join(' ')
}

/**
 * API yanıtı oluşturur
 */
export function apiSuccess<T>(data: T) {
    return Response.json({ success: true, data })
}

export function apiError(message: string, status = 400) {
    return Response.json({ success: false, error: message }, { status })
}
