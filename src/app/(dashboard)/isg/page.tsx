'use client'

import { useEffect, useState } from 'react'
import { ShieldAlert, AlertTriangle, Clock, CheckCircle, FileWarning } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

const KIND_LABEL: Record<string, string> = {
    PERIYODIK_KONTROL: 'Periyodik Kontrol', SIGORTA: 'Sigorta', OPERATOR_BELGE: 'Operatör Belgesi',
}

export default function IsgPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/isg').then(r => r.json()).then(setData).finally(() => setLoading(false))
    }, [])

    if (loading) return <div className="spinner" style={{ margin: '3rem auto' }} />
    const items = data?.items || []
    const sum = data?.summary || {}

    const sevStyle = (s: string) => ({
        EXPIRED: { c: '#dc2626', b: '#fee2e2', t: 'Süresi Doldu', icon: <AlertTriangle size={14} /> },
        SOON: { c: '#d97706', b: '#fef3c7', t: 'Yaklaşıyor', icon: <Clock size={14} /> },
        OK: { c: '#059669', b: '#d1fae5', t: 'Geçerli', icon: <CheckCircle size={14} /> },
        NONE: { c: '#64748b', b: '#f1f5f9', t: 'Tarih Yok', icon: <FileWarning size={14} /> },
    }[s] || { c: '#64748b', b: '#f1f5f9', t: s, icon: null })

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 36, height: 36, borderRadius: 10, background: '#ef444420', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldAlert size={20} color="#ef4444" /></span>
                        İSG Ceza Kalkanı
                    </h1>
                    <p className="page-subtitle">Periyodik kontrol, sigorta ve operatör belgesi takibi — ceza riskini önle</p>
                </div>
            </div>

            {/* Risk özeti */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem', border: sum.expired > 0 ? '1px solid #fecaca' : '1px solid #e2e8f0', background: sum.expired > 0 ? 'linear-gradient(180deg,#fff,#fef2f2)' : '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Şu an geçmiş yükümlülüklerin tahmini ceza riski</div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: sum.expired > 0 ? '#dc2626' : '#059669' }}>{formatCurrency(sum.totalPenaltyRisk || 0)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626' }}>{sum.expired || 0}</div><div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Süresi dolmuş</div></div>
                        <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706' }}>{sum.soon || 0}</div><div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>30 gün içinde</div></div>
                        <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>{sum.total || 0}</div><div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Toplam kalem</div></div>
                    </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.75rem' }}>
                    İş ekipmanı periyodik kontrol yaptırmama cezası ekipman başına ~17.686–55.356 TL (2025). ISG-KATIP&apos;te sözleşmesiz raporlar geçersizdir.
                </div>
            </div>

            {/* Liste */}
            <div className="card">
                <table className="table">
                    <thead><tr><th>Yükümlülük</th><th>İlgili</th><th>Son Tarih</th><th>Kalan</th><th>Durum</th><th>Ceza Riski</th></tr></thead>
                    <tbody>
                        {items.map((it: any, i: number) => {
                            const ss = sevStyle(it.severity)
                            return (
                                <tr key={i}>
                                    <td style={{ fontWeight: 600 }}>{it.label}</td>
                                    <td style={{ fontSize: '0.82rem' }}>{it.entity}</td>
                                    <td style={{ fontSize: '0.82rem', color: '#64748b' }}>{it.expiryDate ? formatDate(it.expiryDate) : '—'}</td>
                                    <td style={{ fontSize: '0.82rem', fontWeight: 700, color: ss.c }}>{it.daysLeft === null ? '—' : it.daysLeft < 0 ? `${Math.abs(it.daysLeft)} gün geçti` : `${it.daysLeft} gün`}</td>
                                    <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0.2rem 0.6rem', borderRadius: 9999, fontSize: '0.7rem', fontWeight: 700, background: ss.b, color: ss.c }}>{ss.icon} {ss.t}</span></td>
                                    <td style={{ fontWeight: 700, color: it.severity === 'EXPIRED' ? '#dc2626' : '#94a3b8' }}>{it.severity === 'EXPIRED' ? formatCurrency(it.penaltyTL) : '—'}</td>
                                </tr>
                            )
                        })}
                        {items.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>Kayıt yok</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
