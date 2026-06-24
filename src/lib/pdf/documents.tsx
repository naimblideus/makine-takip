// ─── PDF Dokümanları: Hakediş, Sözleşme, Fatura ────────────────────────────
import React from 'react'
import { Document, Page, View, Text, Image } from '@react-pdf/renderer'
import { styles as s, C, formatTL, formatTarih, formatSaat, registerPdfFonts } from './base'

registerPdfFonts()

const MACHINE_TYPE_LABELS: Record<string, string> = {
    FORKLIFT: 'Forklift', EKSAVATOR: 'Ekskavatör', VINC: 'Vinç', DOZER: 'Dozer',
    KEPCE: 'Kepçe', GREYDER: 'Greyder', SILINDIR: 'Silindir', KAMYON: 'Kamyon',
    BEKO_LODER: 'Beko Loder', DIGER: 'Diğer',
}

const PERIOD_LABELS: Record<string, string> = {
    SAATLIK: 'Saatlik', GUNLUK: 'Günlük', HAFTALIK: 'Haftalık', AYLIK: 'Aylık',
}

// ─── Ortak parçalar ─────────────────────────────────────────
function Header({ tenant, title, meta }: { tenant: any; title: string; meta: { label: string; value: string }[] }) {
    return (
        <View style={s.header}>
            <View>
                <Text style={s.brandName}>{tenant?.name || 'İş Makineleri'}</Text>
                {tenant?.address ? <Text style={s.brandMeta}>{tenant.address}</Text> : null}
                <Text style={s.brandMeta}>
                    {[tenant?.phone, tenant?.email].filter(Boolean).join('  •  ')}
                </Text>
                {tenant?.taxOffice || tenant?.taxNumber ? (
                    <Text style={s.brandMeta}>
                        VD: {tenant?.taxOffice || '—'}  •  VKN: {tenant?.taxNumber || '—'}
                    </Text>
                ) : null}
            </View>
            <View style={s.docTitleWrap}>
                <Text style={s.docTitle}>{title}</Text>
                {meta.map((m) => (
                    <Text key={m.label} style={s.docMeta}>{m.label}: {m.value}</Text>
                ))}
            </View>
        </View>
    )
}

function Footer({ note }: { note?: string }) {
    return (
        <View style={s.footer} fixed>
            <Text style={s.footerText}>{note || 'Bu belge Makine Takip sistemi tarafından elektronik olarak oluşturulmuştur.'}</Text>
            <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Sayfa ${pageNumber} / ${totalPages}`} />
        </View>
    )
}

function PartyBox({ label, name, lines }: { label: string; name?: string; lines: (string | null | undefined)[] }) {
    return (
        <View style={s.infoBox}>
            <Text style={s.infoLabel}>{label}</Text>
            <Text style={s.infoValueStrong}>{name || '—'}</Text>
            {lines.filter(Boolean).map((l, i) => (
                <Text key={i} style={s.infoValue}>{l}</Text>
            ))}
        </View>
    )
}

// ════════════════════════════════════════════════════════════
// HAKEDİŞ PDF — wedge'in görünür çıktısı
// ════════════════════════════════════════════════════════════
export function HakedisPdf({ data }: { data: any }) {
    const { tenant, hakedis, machine, customer, site, operator } = data
    const gps = hakedis?.gpsReport || null

    const manualHours = gps?.manualHours != null ? Number(gps.manualHours) : Number(hakedis?.totalHours || 0)
    const ignitionHours = gps?.ignitionHours != null ? Number(gps.ignitionHours) : null
    const deltaHours = gps?.deltaHours != null ? Number(gps.deltaHours) : (ignitionHours != null ? manualHours - ignitionHours : null)
    const deltaTL = gps?.deltaTL != null ? Number(gps.deltaTL) : null
    const hasDelta = ignitionHours != null

    const costRows = [
        { label: 'Ara Toplam', value: Number(hakedis?.subtotal || 0) },
        hakedis?.fuelCost ? { label: 'Yakıt', value: Number(hakedis.fuelCost) } : null,
        hakedis?.operatorCost ? { label: 'Operatör Ücreti', value: Number(hakedis.operatorCost) } : null,
        hakedis?.transportCost ? { label: 'Nakliye', value: Number(hakedis.transportCost) } : null,
        hakedis?.discount ? { label: 'İndirim', value: -Number(hakedis.discount) } : null,
        { label: `KDV (%${Number(hakedis?.taxRate || 20)})`, value: Number(hakedis?.taxAmount || 0) },
    ].filter(Boolean) as { label: string; value: number }[]

    return (
        <Document>
            <Page size="A4" style={s.page}>
                <Header
                    tenant={tenant}
                    title="HAKEDİŞ RAPORU"
                    meta={[
                        { label: 'Dönem', value: hakedis?.periodLabel || '—' },
                        { label: 'Düzenleme', value: formatTarih(hakedis?.createdAt) },
                    ]}
                />

                {/* Taraflar */}
                <View style={s.twoCol}>
                    <PartyBox
                        label="Müşteri"
                        name={customer?.companyName}
                        lines={[
                            customer?.contactPerson ? `İlgili: ${customer.contactPerson}` : null,
                            customer?.phone,
                            customer?.taxNumber ? `VD: ${customer?.taxOffice || '—'} / VKN: ${customer.taxNumber}` : null,
                        ]}
                    />
                    <PartyBox
                        label="Şantiye / İş Yeri"
                        name={site?.name || '—'}
                        lines={[site?.address, operator?.name ? `Operatör: ${operator.name}` : null]}
                    />
                </View>

                {/* Makine */}
                <View style={s.twoCol}>
                    <PartyBox
                        label="Makine"
                        name={`${machine?.brand || ''} ${machine?.model || ''}`.trim()}
                        lines={[
                            `${MACHINE_TYPE_LABELS[machine?.type] || machine?.type || ''}${machine?.plate ? `  •  ${machine.plate}` : ''}`,
                            machine?.serialNumber ? `Seri No: ${machine.serialNumber}` : null,
                        ]}
                    />
                    <PartyBox
                        label="Kira Koşulu"
                        name={`${formatTL(hakedis?.unitPrice)} / ${PERIOD_LABELS[hakedis?.periodType] || hakedis?.periodType || ''}`}
                        lines={[
                            hakedis?.workingDays ? `${hakedis.workingDays} çalışma günü` : null,
                            `Beyan: ${formatSaat(manualHours)}`,
                        ]}
                    />
                </View>

                {/* ─── TELEMETRİ DOĞRULAMA TABLOSU (wedge) ─── */}
                <Text style={s.sectionTitle}>Çalışma Saati Doğrulaması</Text>
                <View style={s.table}>
                    <View style={s.thRow}>
                        <Text style={[s.th, { flex: 3 }]}>Kalem</Text>
                        <Text style={[s.th, { flex: 1.4, textAlign: 'right' }]}>Saat</Text>
                        <Text style={[s.th, { flex: 1.6, textAlign: 'right' }]}>Tutar Etkisi</Text>
                    </View>
                    <View style={s.tr}>
                        <Text style={[s.td, { flex: 3 }]}>Beyan edilen puantaj (elle girilen)</Text>
                        <Text style={[s.td, { flex: 1.4, textAlign: 'right' }]}>{formatSaat(manualHours)}</Text>
                        <Text style={[s.td, { flex: 1.6, textAlign: 'right', color: C.sub }]}>
                            {formatTL(manualHours * Number(hakedis?.unitPrice || 0))}
                        </Text>
                    </View>
                    {hasDelta ? (
                        <>
                            <View style={[s.tr, { backgroundColor: C.greenBg }]}>
                                <Text style={[s.td, { flex: 3, fontWeight: 'bold' }]}>
                                    Motor çalışma saati — GPS doğrulanmış
                                </Text>
                                <Text style={[s.td, { flex: 1.4, textAlign: 'right', fontWeight: 'bold', color: C.green }]}>
                                    {formatSaat(ignitionHours)}
                                </Text>
                                <Text style={[s.td, { flex: 1.6, textAlign: 'right', color: C.green }]}>
                                    {formatTL((ignitionHours || 0) * Number(hakedis?.unitPrice || 0))}
                                </Text>
                            </View>
                            {Math.abs(deltaHours || 0) > 0.05 ? (
                                <View style={[s.tr, { backgroundColor: (deltaHours || 0) > 0 ? C.redBg : C.bgSoft }]}>
                                    <Text style={[s.td, { flex: 3, fontWeight: 'bold' }]}>
                                        Fark (beyan − doğrulanmış)
                                    </Text>
                                    <Text style={[s.td, { flex: 1.4, textAlign: 'right', fontWeight: 'bold', color: (deltaHours || 0) > 0 ? C.red : C.green }]}>
                                        {(deltaHours || 0) > 0 ? '+' : ''}{formatSaat(deltaHours)}
                                    </Text>
                                    <Text style={[s.td, { flex: 1.6, textAlign: 'right', fontWeight: 'bold', color: (deltaHours || 0) > 0 ? C.red : C.green }]}>
                                        {deltaTL != null ? formatTL(deltaTL) : '—'}
                                    </Text>
                                </View>
                            ) : null}
                        </>
                    ) : (
                        <View style={s.tr}>
                            <Text style={[s.td, { flex: 6, color: C.faint }]}>
                                Bu makinede GPS/motor telemetrisi bulunmuyor — saat beyana göre alınmıştır.
                            </Text>
                        </View>
                    )}
                    {gps?.estimatedIdleHours != null ? (
                        <View style={s.tr}>
                            <Text style={[s.td, { flex: 3 }]}>
                                Boşta (rölanti) süresi
                                <Text style={{ color: C.amber }}>  · tahmini</Text>
                            </Text>
                            <Text style={[s.td, { flex: 1.4, textAlign: 'right', color: C.sub }]}>{formatSaat(gps.estimatedIdleHours)}</Text>
                            <Text style={[s.td, { flex: 1.6, textAlign: 'right', color: C.faint }]}>—</Text>
                        </View>
                    ) : null}
                </View>
                {hasDelta ? (
                    <Text style={s.smallNote}>
                        Motor çalışma saati, makineye takılı GPS/telemetri cihazının kontak (ignition) sinyalinden ölçülmüştür ve doğrulanmış veridir.
                        Boşta süresi ve yakıt değerleri tahmini analizdir; sensör kalibrasyonuna göre değişebilir.
                    </Text>
                ) : null}

                {/* ─── Tutar özeti ─── */}
                <Text style={s.sectionTitle}>Tutar Özeti</Text>
                <View style={s.totalsWrap}>
                    {costRows.map((row) => (
                        <View key={row.label} style={s.totalRow}>
                            <Text style={[s.totalLabel, row.label === 'İndirim' ? { color: C.green } : {}]}>{row.label}</Text>
                            <Text style={[s.totalValue, row.label === 'İndirim' ? { color: C.green } : {}]}>
                                {row.value < 0 ? `− ${formatTL(-row.value)}` : formatTL(row.value)}
                            </Text>
                        </View>
                    ))}
                    <View style={s.grandRow}>
                        <Text style={s.grandLabel}>GENEL TOPLAM</Text>
                        <Text style={s.grandValue}>{formatTL(hakedis?.totalAmount)}</Text>
                    </View>
                </View>

                {hakedis?.notes ? (
                    <>
                        <Text style={s.sectionTitle}>Notlar</Text>
                        <Text style={s.para}>{hakedis.notes}</Text>
                    </>
                ) : null}

                {/* ─── İmzalar ─── */}
                <View style={s.sigRow}>
                    <View style={s.sigBox}>
                        {hakedis?.operatorSignature ? (
                            <Image style={s.sigImg} src={hakedis.operatorSignature} />
                        ) : <View style={{ height: 50 }} />}
                        <View style={s.sigLine}>
                            <Text style={s.sigName}>{operator?.name || 'Yetkili'}</Text>
                            <Text style={s.sigCaption}>Hazırlayan / Operatör</Text>
                        </View>
                    </View>
                    <View style={s.sigBox}>
                        {hakedis?.customerSignature ? (
                            <Image style={s.sigImg} src={hakedis.customerSignature} />
                        ) : <View style={{ height: 50 }} />}
                        <View style={s.sigLine}>
                            <Text style={s.sigName}>{customer?.companyName || 'Müşteri'}</Text>
                            <Text style={s.sigCaption}>
                                Müşteri Onayı{hakedis?.customerApprovedAt ? ` · ${formatTarih(hakedis.customerApprovedAt)}` : ''}
                            </Text>
                        </View>
                    </View>
                </View>

                <Footer note="Hakediş raporu — Makine Takip" />
            </Page>
        </Document>
    )
}

// ════════════════════════════════════════════════════════════
// KİRA SÖZLEŞMESİ PDF
// ════════════════════════════════════════════════════════════
export function SozlesmePdf({ data }: { data: any }) {
    const { tenant, rental, machine, customer, site, operator } = data
    const today = new Date()

    return (
        <Document>
            <Page size="A4" style={s.page}>
                <Header
                    tenant={tenant}
                    title="KİRA SÖZLEŞMESİ"
                    meta={[
                        { label: 'Sözleşme No', value: `SZL-${String(rental?.id || '').slice(0, 8).toUpperCase()}` },
                        { label: 'Tarih', value: formatTarih(today) },
                    ]}
                />

                <View style={s.twoCol}>
                    <PartyBox
                        label="Kiraya Veren"
                        name={tenant?.name}
                        lines={[tenant?.address, tenant?.phone, tenant?.taxNumber ? `VKN: ${tenant.taxNumber}` : null]}
                    />
                    <PartyBox
                        label="Kiracı"
                        name={customer?.companyName}
                        lines={[
                            customer?.contactPerson ? `İlgili: ${customer.contactPerson}` : null,
                            customer?.phone,
                            customer?.taxNumber ? `VD: ${customer?.taxOffice || '—'} / VKN: ${customer.taxNumber}` : null,
                        ]}
                    />
                </View>

                <Text style={s.sectionTitle}>Kira Konusu Makine</Text>
                <View style={s.table}>
                    <View style={s.thRow}>
                        <Text style={[s.th, { flex: 3 }]}>Makine</Text>
                        <Text style={[s.th, { flex: 1.5 }]}>Plaka / Seri</Text>
                        <Text style={[s.th, { flex: 1.5 }]}>Dönem</Text>
                        <Text style={[s.th, { flex: 1.5, textAlign: 'right' }]}>Birim Fiyat</Text>
                    </View>
                    <View style={s.tr}>
                        <Text style={[s.td, { flex: 3 }]}>
                            {machine?.brand} {machine?.model} ({MACHINE_TYPE_LABELS[machine?.type] || machine?.type})
                        </Text>
                        <Text style={[s.td, { flex: 1.5 }]}>{machine?.plate || machine?.serialNumber || '—'}</Text>
                        <Text style={[s.td, { flex: 1.5 }]}>{PERIOD_LABELS[rental?.periodType] || rental?.periodType}</Text>
                        <Text style={[s.td, { flex: 1.5, textAlign: 'right' }]}>{formatTL(rental?.unitPrice)}</Text>
                    </View>
                </View>

                <View style={[s.twoCol, { marginTop: 8 }]}>
                    <PartyBox label="Başlangıç" name={formatTarih(rental?.startDate)} lines={[site?.name ? `Şantiye: ${site.name}` : null]} />
                    <PartyBox label="Planlanan Bitiş" name={formatTarih(rental?.endDate)} lines={[
                        rental?.operatorIncluded ? 'Operatör dahil' : 'Operatörsüz (kuru kiralama)',
                        rental?.deposit ? `Depozito: ${formatTL(rental.deposit)}` : null,
                    ]} />
                </View>

                <Text style={s.sectionTitle}>Sözleşme Şartları</Text>
                {[
                    `1. Kiraya veren, yukarıda nitelikleri belirtilen iş makinesini ${formatTarih(rental?.startDate)} tarihinden itibaren çalışır ve bakımlı vaziyette kiracıya teslim eder.`,
                    `2. Kira bedeli ${PERIOD_LABELS[rental?.periodType] || rental?.periodType?.toLowerCase()} ${formatTL(rental?.unitPrice)} olup, hakediş dönemleri sonunda makineye ait GPS/motor çalışma saati verileri esas alınarak hesaplanır ve faturalandırılır.`,
                    `3. Makinenin çalışma saatleri, takılı telemetri cihazının kontak (ignition) verisinden doğrulanır. Taraflar bu verinin hakedişe esas teşkil edeceğini kabul eder.`,
                    `4. Yakıt, mesai dışı/yetkisiz kullanım, hız ihlali ve şantiye dışına çıkış (geofence) durumları sistem tarafından kayıt altına alınır.`,
                    `5. Kiracı, makineyi sözleşmede belirtilen şantiye/iş yeri sınırları içinde ve amacına uygun kullanmakla yükümlüdür. Hasar ve arızalardan kiracı sorumludur.`,
                    `6. Depozito${rental?.deposit ? ` (${formatTL(rental.deposit)})` : ''} sözleşme sonunda makinenin hasarsız iadesi hâlinde iade edilir.`,
                    `7. İşbu sözleşme tarafların imzası ile yürürlüğe girer. Anlaşmazlıklarda ${tenant?.taxOffice ? tenant.taxOffice.split(' ')[0] : 'yetkili'} mahkeme ve icra daireleri yetkilidir.`,
                ].map((t, i) => (
                    <Text key={i} style={s.para}>{t}</Text>
                ))}

                <View style={s.sigRow}>
                    <View style={s.sigBox}>
                        <View style={{ height: 40 }} />
                        <View style={s.sigLine}>
                            <Text style={s.sigName}>{tenant?.name}</Text>
                            <Text style={s.sigCaption}>Kiraya Veren</Text>
                        </View>
                    </View>
                    <View style={s.sigBox}>
                        <View style={{ height: 40 }} />
                        <View style={s.sigLine}>
                            <Text style={s.sigName}>{customer?.companyName}</Text>
                            <Text style={s.sigCaption}>Kiracı</Text>
                        </View>
                    </View>
                </View>

                <Footer note="Kira sözleşmesi — Makine Takip" />
            </Page>
        </Document>
    )
}

// ════════════════════════════════════════════════════════════
// FATURA PDF
// ════════════════════════════════════════════════════════════
export function FaturaPdf({ data }: { data: any }) {
    const { tenant, invoice, customer } = data
    let items: any[] = []
    try {
        items = typeof invoice?.items === 'string' ? JSON.parse(invoice.items) : (invoice?.items || [])
    } catch { items = [] }

    return (
        <Document>
            <Page size="A4" style={s.page}>
                <Header
                    tenant={tenant}
                    title="FATURA"
                    meta={[
                        { label: 'Fatura No', value: invoice?.invoiceNumber || '—' },
                        { label: 'Düzenleme', value: formatTarih(invoice?.issueDate) },
                        { label: 'Vade', value: formatTarih(invoice?.dueDate) },
                    ]}
                />

                <View style={s.twoCol}>
                    <PartyBox
                        label="Sayın"
                        name={customer?.companyName}
                        lines={[
                            customer?.address,
                            customer?.taxNumber ? `VD: ${customer?.taxOffice || '—'} / VKN: ${customer.taxNumber}` : null,
                        ]}
                    />
                </View>

                <Text style={s.sectionTitle}>Fatura Kalemleri</Text>
                <View style={s.table}>
                    <View style={s.thRow}>
                        <Text style={[s.th, { flex: 4 }]}>Açıklama</Text>
                        <Text style={[s.th, { flex: 1, textAlign: 'right' }]}>Miktar</Text>
                        <Text style={[s.th, { flex: 1.5, textAlign: 'right' }]}>Birim Fiyat</Text>
                        <Text style={[s.th, { flex: 1.5, textAlign: 'right' }]}>Tutar</Text>
                    </View>
                    {(items.length ? items : [{ description: 'Kiralama hizmeti', quantity: 1, unitPrice: Number(invoice?.subtotal || 0), total: Number(invoice?.subtotal || 0) }]).map((it, i) => (
                        <View key={i} style={s.tr}>
                            <Text style={[s.td, { flex: 4 }]}>{it.description}</Text>
                            <Text style={[s.td, { flex: 1, textAlign: 'right' }]}>{it.quantity}</Text>
                            <Text style={[s.td, { flex: 1.5, textAlign: 'right' }]}>{formatTL(it.unitPrice)}</Text>
                            <Text style={[s.td, { flex: 1.5, textAlign: 'right' }]}>{formatTL(it.total)}</Text>
                        </View>
                    ))}
                </View>

                <View style={s.totalsWrap}>
                    <View style={s.totalRow}>
                        <Text style={s.totalLabel}>Ara Toplam</Text>
                        <Text style={s.totalValue}>{formatTL(invoice?.subtotal)}</Text>
                    </View>
                    <View style={s.totalRow}>
                        <Text style={s.totalLabel}>KDV (%{Number(invoice?.taxRate || 20)})</Text>
                        <Text style={s.totalValue}>{formatTL(invoice?.taxAmount)}</Text>
                    </View>
                    <View style={s.grandRow}>
                        <Text style={s.grandLabel}>GENEL TOPLAM</Text>
                        <Text style={s.grandValue}>{formatTL(invoice?.totalAmount)}</Text>
                    </View>
                </View>

                {invoice?.notes ? (
                    <>
                        <Text style={s.sectionTitle}>Notlar</Text>
                        <Text style={s.para}>{invoice.notes}</Text>
                    </>
                ) : null}

                <Text style={[s.smallNote, { marginTop: 16 }]}>
                    Bu belge bilgilendirme amaçlı ön fatura/proforma niteliğindedir. e-Fatura/e-Arşiv resmi belgesi GİB entegrasyonu üzerinden ayrıca düzenlenir.
                </Text>

                <Footer note="Fatura — Makine Takip" />
            </Page>
        </Document>
    )
}
