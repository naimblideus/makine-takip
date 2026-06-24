// ─── Fiyat Teklifi PDF ──────────────────────────────────────
import React from 'react'
import { Document, Page, View, Text } from '@react-pdf/renderer'
import { styles as s, C, formatTL, formatTarih, registerPdfFonts } from './base'

registerPdfFonts()

const PERIOD: Record<string, string> = { SAATLIK: 'saat', GUNLUK: 'gün', HAFTALIK: 'hafta', AYLIK: 'ay' }

export function TeklifPdf({ data }: { data: any }) {
    const { tenant, quote } = data
    const birim = PERIOD[quote?.periodType] || 'birim'

    return (
        <Document>
            <Page size="A4" style={s.page}>
                <View style={s.header}>
                    <View>
                        <Text style={s.brandName}>{tenant?.name || 'İş Makineleri'}</Text>
                        {tenant?.address ? <Text style={s.brandMeta}>{tenant.address}</Text> : null}
                        <Text style={s.brandMeta}>{[tenant?.phone, tenant?.email].filter(Boolean).join('  •  ')}</Text>
                    </View>
                    <View style={s.docTitleWrap}>
                        <Text style={s.docTitle}>FİYAT TEKLİFİ</Text>
                        <Text style={s.docMeta}>Teklif No: TKF-{String(quote?.id || '').slice(0, 8).toUpperCase()}</Text>
                        <Text style={s.docMeta}>Tarih: {formatTarih(quote?.createdAt)}</Text>
                        <Text style={s.docMeta}>Geçerlilik: {formatTarih(quote?.validUntil)}</Text>
                    </View>
                </View>

                <View style={s.twoCol}>
                    <View style={s.infoBox}>
                        <Text style={s.infoLabel}>Sayın</Text>
                        <Text style={s.infoValueStrong}>{quote?.customerName || '—'}</Text>
                        {quote?.customerPhone ? <Text style={s.infoValue}>{quote.customerPhone}</Text> : null}
                    </View>
                    <View style={s.infoBox}>
                        <Text style={s.infoLabel}>Teklif Edilen Makine</Text>
                        <Text style={s.infoValueStrong}>{quote?.machineLabel || quote?.machineType || 'İş makinesi'}</Text>
                        <Text style={s.infoValue}>{quote?.operatorIncluded ? 'Operatör dahil' : 'Operatörsüz'}</Text>
                    </View>
                </View>

                <Text style={s.sectionTitle}>Teklif Kalemleri</Text>
                <View style={s.table}>
                    <View style={s.thRow}>
                        <Text style={[s.th, { flex: 4 }]}>Açıklama</Text>
                        <Text style={[s.th, { flex: 1.2, textAlign: 'right' }]}>Miktar</Text>
                        <Text style={[s.th, { flex: 1.6, textAlign: 'right' }]}>Birim Fiyat</Text>
                        <Text style={[s.th, { flex: 1.6, textAlign: 'right' }]}>Tutar</Text>
                    </View>
                    <View style={s.tr}>
                        <Text style={[s.td, { flex: 4 }]}>
                            {quote?.machineLabel || quote?.machineType || 'İş makinesi'} kiralama ({birim} bazlı)
                        </Text>
                        <Text style={[s.td, { flex: 1.2, textAlign: 'right' }]}>{quote?.quantity} {birim}</Text>
                        <Text style={[s.td, { flex: 1.6, textAlign: 'right' }]}>{formatTL(quote?.unitPrice)}</Text>
                        <Text style={[s.td, { flex: 1.6, textAlign: 'right' }]}>{formatTL(Number(quote?.unitPrice) * Number(quote?.quantity))}</Text>
                    </View>
                    {quote?.transportCost ? (
                        <View style={s.tr}>
                            <Text style={[s.td, { flex: 4 }]}>Nakliye</Text>
                            <Text style={[s.td, { flex: 1.2, textAlign: 'right' }]}>1</Text>
                            <Text style={[s.td, { flex: 1.6, textAlign: 'right' }]}>{formatTL(quote.transportCost)}</Text>
                            <Text style={[s.td, { flex: 1.6, textAlign: 'right' }]}>{formatTL(quote.transportCost)}</Text>
                        </View>
                    ) : null}
                </View>

                <View style={s.totalsWrap}>
                    {quote?.discount ? (
                        <View style={s.totalRow}><Text style={[s.totalLabel, { color: C.green }]}>İndirim</Text><Text style={[s.totalValue, { color: C.green }]}>− {formatTL(quote.discount)}</Text></View>
                    ) : null}
                    <View style={s.totalRow}><Text style={s.totalLabel}>Ara Toplam</Text><Text style={s.totalValue}>{formatTL(quote?.subtotal)}</Text></View>
                    <View style={s.totalRow}><Text style={s.totalLabel}>KDV (%{Number(quote?.taxRate || 20)})</Text><Text style={s.totalValue}>{formatTL(quote?.taxAmount)}</Text></View>
                    <View style={s.grandRow}><Text style={s.grandLabel}>GENEL TOPLAM</Text><Text style={s.grandValue}>{formatTL(quote?.totalAmount)}</Text></View>
                </View>

                {quote?.notes ? (<><Text style={s.sectionTitle}>Notlar</Text><Text style={s.para}>{quote.notes}</Text></>) : null}

                <Text style={[s.smallNote, { marginTop: 14 }]}>
                    Bu teklif {formatTarih(quote?.validUntil)} tarihine kadar geçerlidir. Fiyatlara yakıt hariç (operatör {quote?.operatorIncluded ? 'dahil' : 'hariç'}) koşullar uygulanır.
                    Kiralama süresince makine konumu ve çalışma saatleri GPS ile takip edilir; hakediş motor çalışma saatinden doğrulanır.
                </Text>

                <View style={s.footer} fixed>
                    <Text style={s.footerText}>Fiyat teklifi — {tenant?.name || 'Makine Takip'}</Text>
                    <Text style={s.footerText} render={({ pageNumber, totalPages }: any) => `Sayfa ${pageNumber} / ${totalPages}`} />
                </View>
            </Page>
        </Document>
    )
}
