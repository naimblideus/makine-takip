// ─── Hakediş Delil Paketi PDF — "itiraz edilemez" kanıt ────────────────────
import React from 'react'
import { Document, Page, View, Text, Image } from '@react-pdf/renderer'
import { styles as s, C, formatTL, formatTarih, formatSaat, registerPdfFonts } from './base'

registerPdfFonts()

const GPS_LABELS: Record<string, string> = {
    ENGINE_STOP: 'Motor Durdurma', ENGINE_START: 'Motor Başlatma', SPEED_ALERT: 'Hız İhlali',
    GEOFENCE_BREACH: 'Geofence İhlali', FUEL_THEFT_ALERT: 'Yakıt Hırsızlığı', UNAUTHORIZED_USE: 'Yetkisiz Kullanım', IDLE_ALERT: 'Boşta Çalışma',
}

function dt(d: any): string {
    if (!d) return '—'
    const x = new Date(d)
    if (Number.isNaN(x.getTime())) return '—'
    return x.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }) + ' ' + x.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

export function KanitPaketiPdf({ data }: { data: any }) {
    const { tenant, hakedis, machine, customer, site, operator, sessions = [], gpsLogs = [] } = data
    const gps = hakedis?.gpsReport || {}
    const manualH = gps?.manualHours != null ? Number(gps.manualHours) : Number(hakedis?.totalHours || 0)
    const ignitionH = gps?.ignitionHours != null ? Number(gps.ignitionHours) : null
    const deltaH = gps?.deltaHours != null ? Number(gps.deltaHours) : null
    const deltaTL = gps?.deltaTL != null ? Number(gps.deltaTL) : null

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
                        <Text style={[s.docTitle, { color: C.ink }]}>DELİL PAKETİ</Text>
                        <Text style={s.docMeta}>Dönem: {hakedis?.periodLabel || '—'}</Text>
                        <Text style={s.docMeta}>Düzenleme: {formatTarih(hakedis?.createdAt)}</Text>
                    </View>
                </View>

                <View style={s.twoCol}>
                    <View style={s.infoBox}>
                        <Text style={s.infoLabel}>Müşteri</Text>
                        <Text style={s.infoValueStrong}>{customer?.companyName || '—'}</Text>
                        {site?.name ? <Text style={s.infoValue}>Şantiye: {site.name}</Text> : null}
                    </View>
                    <View style={s.infoBox}>
                        <Text style={s.infoLabel}>Makine</Text>
                        <Text style={s.infoValueStrong}>{machine?.brand} {machine?.model}{machine?.plate ? ` (${machine.plate})` : ''}</Text>
                        {operator?.name ? <Text style={s.infoValue}>Operatör: {operator.name}</Text> : null}
                    </View>
                </View>

                {/* ÖZET — itirazsız başlık */}
                <Text style={s.sectionTitle}>Çalışma Saati Kanıtı</Text>
                <View style={[s.table, { marginBottom: 4 }]}>
                    <View style={s.thRow}>
                        <Text style={[s.th, { flex: 4 }]}>Kalem</Text>
                        <Text style={[s.th, { flex: 2, textAlign: 'right' }]}>Değer</Text>
                    </View>
                    <View style={s.tr}>
                        <Text style={[s.td, { flex: 4 }]}>Beyan edilen (puantaj)</Text>
                        <Text style={[s.td, { flex: 2, textAlign: 'right' }]}>{formatSaat(manualH)}</Text>
                    </View>
                    {ignitionH != null && (
                        <View style={[s.tr, { backgroundColor: C.greenBg }]}>
                            <Text style={[s.td, { flex: 4, fontWeight: 'bold' }]}>GPS-doğrulanmış motor çalışma saati</Text>
                            <Text style={[s.td, { flex: 2, textAlign: 'right', fontWeight: 'bold', color: C.green }]}>{formatSaat(ignitionH)}</Text>
                        </View>
                    )}
                    {deltaH != null && Math.abs(deltaH) > 0.05 && (
                        <View style={[s.tr, { backgroundColor: deltaH > 0 ? C.redBg : C.bgSoft }]}>
                            <Text style={[s.td, { flex: 4, fontWeight: 'bold' }]}>Fark (beyan − doğrulanmış)</Text>
                            <Text style={[s.td, { flex: 2, textAlign: 'right', fontWeight: 'bold', color: deltaH > 0 ? C.red : C.green }]}>
                                {deltaH > 0 ? '+' : ''}{formatSaat(deltaH)}{deltaTL != null ? ` = ${formatTL(deltaTL)}` : ''}
                            </Text>
                        </View>
                    )}
                </View>

                {/* MOTOR OTURUMLARI — kanıt detayı */}
                <Text style={s.sectionTitle}>Motor Oturumları ({sessions.length})</Text>
                <View style={s.table}>
                    <View style={s.thRow}>
                        <Text style={[s.th, { flex: 2.5 }]}>Başlangıç</Text>
                        <Text style={[s.th, { flex: 2.5 }]}>Bitiş</Text>
                        <Text style={[s.th, { flex: 1.5, textAlign: 'right' }]}>Motor sa</Text>
                        <Text style={[s.th, { flex: 1.5, textAlign: 'right' }]}>Boşta*</Text>
                        <Text style={[s.th, { flex: 1.2 }]}>Yetki</Text>
                    </View>
                    {sessions.slice(0, 30).map((se: any, i: number) => (
                        <View key={i} style={s.tr}>
                            <Text style={[s.td, { flex: 2.5 }]}>{dt(se.startedAt)}</Text>
                            <Text style={[s.td, { flex: 2.5 }]}>{se.endedAt ? dt(se.endedAt) : 'devam ediyor'}</Text>
                            <Text style={[s.td, { flex: 1.5, textAlign: 'right' }]}>{se.durationMinutes != null ? (Math.round(se.durationMinutes / 6) / 10) : '—'}</Text>
                            <Text style={[s.td, { flex: 1.5, textAlign: 'right', color: C.amber }]}>{se.idleMinutes != null ? (Math.round(se.idleMinutes / 6) / 10) : '—'}</Text>
                            <Text style={[s.td, { flex: 1.2, color: se.isAuthorized ? C.green : C.red }]}>{se.isAuthorized ? 'Yetkili' : 'Yetkisiz'}</Text>
                        </View>
                    ))}
                    {sessions.length === 0 && (
                        <View style={s.tr}><Text style={[s.td, { flex: 8, color: C.faint }]}>Bu dönemde kayıtlı motor oturumu bulunmuyor.</Text></View>
                    )}
                </View>
                <Text style={s.smallNote}>* Boşta (rölanti) süresi tahmini analizdir; yalnızca motor çalışma saati (ignition) yetkili kanıttır.</Text>

                {/* GPS OLAYLARI / UYARILAR */}
                {gpsLogs.length > 0 && (
                    <>
                        <Text style={s.sectionTitle}>GPS Olayları & Uyarılar</Text>
                        <View style={s.table}>
                            <View style={s.thRow}>
                                <Text style={[s.th, { flex: 2 }]}>Tarih</Text>
                                <Text style={[s.th, { flex: 2 }]}>Olay</Text>
                                <Text style={[s.th, { flex: 4 }]}>Açıklama</Text>
                            </View>
                            {gpsLogs.slice(0, 20).map((g: any, i: number) => (
                                <View key={i} style={s.tr}>
                                    <Text style={[s.td, { flex: 2 }]}>{dt(g.createdAt)}</Text>
                                    <Text style={[s.td, { flex: 2 }]}>{GPS_LABELS[g.action] || g.action}</Text>
                                    <Text style={[s.td, { flex: 4 }]}>{g.reason || '—'}</Text>
                                </View>
                            ))}
                        </View>
                    </>
                )}

                {/* İMZALAR */}
                <View style={s.sigRow}>
                    <View style={s.sigBox}>
                        {hakedis?.operatorSignature ? <Image style={s.sigImg} src={hakedis.operatorSignature} /> : <View style={{ height: 50 }} />}
                        <View style={s.sigLine}><Text style={s.sigName}>{operator?.name || tenant?.name}</Text><Text style={s.sigCaption}>Hazırlayan</Text></View>
                    </View>
                    <View style={s.sigBox}>
                        {hakedis?.customerSignature ? <Image style={s.sigImg} src={hakedis.customerSignature} /> : <View style={{ height: 50 }} />}
                        <View style={s.sigLine}><Text style={s.sigName}>{customer?.companyName || 'Müşteri'}</Text><Text style={s.sigCaption}>Müşteri Onayı{hakedis?.customerApprovedAt ? ` · ${formatTarih(hakedis.customerApprovedAt)}` : ''}</Text></View>
                    </View>
                </View>

                <View style={s.footer} fixed>
                    <Text style={s.footerText}>Delil paketi — motor çalışma saati GPS/telemetri kontak verisinden doğrulanmıştır.</Text>
                    <Text style={s.footerText} render={({ pageNumber, totalPages }: any) => `Sayfa ${pageNumber} / ${totalPages}`} />
                </View>
            </Page>
        </Document>
    )
}
