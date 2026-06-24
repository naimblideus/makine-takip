// ─── PDF Taban: Font kaydı, ortak stiller, biçimlendirme yardımcıları ──────
// react-pdf'in varsayılan Helvetica'sı Türkçe glifleri (ş, ğ, ı, İ) içermez.
// Bu yüzden Roboto TTF (public/fonts) kaydedilir — fatura/sözleşme/hakediş
// Türkçe karakterleri doğru basılır.

import path from 'path'
import { Font, StyleSheet } from '@react-pdf/renderer'

let fontsRegistered = false

export function registerPdfFonts() {
    if (fontsRegistered) return
    Font.register({
        family: 'AppSans',
        fonts: [
            { src: path.join(process.cwd(), 'public', 'fonts', 'DejaVuSans.ttf'), fontWeight: 'normal' },
            { src: path.join(process.cwd(), 'public', 'fonts', 'DejaVuSans-Bold.ttf'), fontWeight: 'bold' },
        ],
    })
    // Türkçe kelimelerin satır sonunda garip bölünmesini engelle
    Font.registerHyphenationCallback((word) => [word])
    fontsRegistered = true
}

// ─── Biçimlendirme ──────────────────────────────────────────
const tlFormatter = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})

export function formatTL(amount: number | string | null | undefined): string {
    if (amount === null || amount === undefined || amount === '') return '₺0,00'
    const n = typeof amount === 'string' ? parseFloat(amount) : amount
    if (Number.isNaN(n)) return '₺0,00'
    return tlFormatter.format(n)
}

export function formatTarih(date: Date | string | null | undefined): string {
    if (!date) return '—'
    const d = typeof date === 'string' ? new Date(date) : date
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function formatSaat(hours: number | string | null | undefined): string {
    if (hours === null || hours === undefined) return '0 sa'
    const n = typeof hours === 'string' ? parseFloat(hours) : hours
    if (Number.isNaN(n)) return '0 sa'
    return `${Math.round(n * 10) / 10} sa`
}

// ─── Renk paleti (uygulama ile uyumlu) ──────────────────────
export const C = {
    ink: '#1e293b',
    sub: '#64748b',
    faint: '#94a3b8',
    line: '#e2e8f0',
    bgSoft: '#f8fafc',
    blue: '#2563eb',
    blueBg: '#dbeafe',
    green: '#059669',
    greenBg: '#d1fae5',
    red: '#dc2626',
    redBg: '#fee2e2',
    amber: '#d97706',
    amberBg: '#fef3c7',
    white: '#ffffff',
}

// ─── Ortak stiller ──────────────────────────────────────────
export const styles = StyleSheet.create({
    page: {
        fontFamily: 'AppSans',
        fontSize: 9.5,
        color: C.ink,
        paddingTop: 36,
        paddingBottom: 56,
        paddingHorizontal: 40,
        lineHeight: 1.4,
    },
    // Üst başlık
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottomWidth: 2,
        borderBottomColor: C.ink,
        paddingBottom: 12,
        marginBottom: 16,
    },
    brandName: { fontSize: 15, fontWeight: 'bold', color: C.ink },
    brandMeta: { fontSize: 8, color: C.sub, marginTop: 2 },
    docTitleWrap: { alignItems: 'flex-end' },
    docTitle: { fontSize: 16, fontWeight: 'bold', color: C.blue, letterSpacing: 0.5 },
    docMeta: { fontSize: 8.5, color: C.sub, marginTop: 3 },

    // Bölüm
    sectionTitle: {
        fontSize: 9,
        fontWeight: 'bold',
        color: C.sub,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 6,
        marginTop: 10,
    },
    // İki sütun bilgi kutusu
    twoCol: { flexDirection: 'row', gap: 12, marginBottom: 6 },
    infoBox: {
        flex: 1,
        backgroundColor: C.bgSoft,
        borderRadius: 5,
        padding: 9,
    },
    infoLabel: { fontSize: 7.5, color: C.faint, marginBottom: 1, textTransform: 'uppercase' },
    infoValue: { fontSize: 9.5, color: C.ink },
    infoValueStrong: { fontSize: 10.5, fontWeight: 'bold', color: C.ink },

    // Tablo
    table: { marginTop: 4 },
    tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.line },
    thRow: { flexDirection: 'row', backgroundColor: C.ink },
    th: { color: C.white, fontSize: 8.5, fontWeight: 'bold', padding: 6 },
    td: { fontSize: 9, padding: 6, color: C.ink },

    // Tutar özet satırları
    totalsWrap: { marginTop: 10, alignItems: 'flex-end' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', width: 240, paddingVertical: 2 },
    totalLabel: { fontSize: 9.5, color: C.sub },
    totalValue: { fontSize: 9.5, color: C.ink },
    grandRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: 240,
        borderTopWidth: 2,
        borderTopColor: C.ink,
        paddingTop: 6,
        marginTop: 4,
    },
    grandLabel: { fontSize: 12, fontWeight: 'bold', color: C.ink },
    grandValue: { fontSize: 12, fontWeight: 'bold', color: C.blue },

    // Rozet
    badge: {
        fontSize: 7.5,
        fontWeight: 'bold',
        paddingVertical: 2,
        paddingHorizontal: 5,
        borderRadius: 3,
    },

    // İmza
    sigRow: { flexDirection: 'row', gap: 24, marginTop: 26 },
    sigBox: { flex: 1, alignItems: 'center' },
    sigImg: { width: 130, height: 50, objectFit: 'contain' },
    sigLine: { borderTopWidth: 1, borderTopColor: C.ink, width: '100%', marginTop: 4, paddingTop: 4 },
    sigCaption: { fontSize: 8.5, color: C.sub, textAlign: 'center' },
    sigName: { fontSize: 9.5, fontWeight: 'bold', color: C.ink, textAlign: 'center' },

    // Alt bilgi
    footer: {
        position: 'absolute',
        bottom: 24,
        left: 40,
        right: 40,
        borderTopWidth: 1,
        borderTopColor: C.line,
        paddingTop: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    footerText: { fontSize: 7, color: C.faint },

    smallNote: { fontSize: 7.5, color: C.faint, marginTop: 4 },
    para: { fontSize: 9.5, color: C.ink, marginBottom: 6, textAlign: 'justify' },
})
