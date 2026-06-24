'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, XCircle, AlertTriangle, Download } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const PERIOD: Record<string, string> = { SAATLIK: 'saat', GUNLUK: 'gün', HAFTALIK: 'hafta', AYLIK: 'ay' }
const MTYPE: Record<string, string> = { FORKLIFT: 'Forklift', EKSAVATOR: 'Ekskavatör', VINC: 'Vinç', DOZER: 'Dozer', KEPCE: 'Kepçe', GREYDER: 'Greyder', SILINDIR: 'Silindir', KAMYON: 'Kamyon', BEKO_LODER: 'Beko Loder', DIGER: 'Diğer' }

export default function TeklifPortalPage() {
    const { token } = useParams<{ token: string }>()
    const [q, setQ] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [done, setDone] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetch(`/api/teklif-portal/${token}`).then(r => r.json())
            .then(j => { if (j.error) setError(j.error); else setQ(j.quote) })
            .catch(() => setError('Sayfa yüklenemedi')).finally(() => setLoading(false))
    }, [token])

    const respond = async (action: 'KABUL' | 'RED') => {
        setSubmitting(true)
        const res = await fetch(`/api/teklif-portal/${token}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
        const j = await res.json()
        if (j.success) setDone(action); else setError(j.error || 'İşlem başarısız')
        setSubmitting(false)
    }

    const wrap = (children: React.ReactNode) => (
        <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '1.5rem', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
    )

    if (loading) return wrap(<div style={{ textAlign: 'center', color: '#64748b' }}><div style={{ width: 40, height: 40, border: '3px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />Yükleniyor...</div>)
    if (error && !q) return wrap(<div style={{ textAlign: 'center', maxWidth: 400 }}><AlertTriangle size={48} color="#ef4444" /><h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '1rem 0 0.5rem' }}>Teklif Bulunamadı</h1><p style={{ color: '#64748b' }}>{error}</p></div>)
    if (done) return wrap(<div style={{ textAlign: 'center', maxWidth: 420 }}>{done === 'KABUL' ? <CheckCircle size={56} color="#10b981" /> : <XCircle size={56} color="#ef4444" />}<h1 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '1rem 0 0.5rem' }}>{done === 'KABUL' ? 'Teklifi Kabul Ettiniz!' : 'Teklifi Reddettiniz'}</h1><p style={{ color: '#64748b' }}>{done === 'KABUL' ? 'Firma sizinle en kısa sürede iletişime geçecek. Teşekkürler!' : 'Geri bildiriminiz için teşekkürler.'}</p></div>)

    const tenant = q.tenant
    const canRespond = ['GONDERILDI', 'GORUNTULENDI'].includes(q.status)
    const expired = q.validUntil && new Date(q.validUntil) < new Date()

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '1.5rem', fontFamily: 'system-ui, sans-serif' }}>
            <div style={{ maxWidth: 560, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#1e293b', color: '#fff', padding: '0.5rem 1.25rem', borderRadius: 9999, marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 700 }}>🏗 {tenant?.name}</div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b' }}>Fiyat Teklifi</h1>
                    <p style={{ color: '#64748b', marginTop: '0.25rem' }}>Sayın {q.customerName}</p>
                </div>

                <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div style={{ background: '#f8fafc', borderRadius: '0.5rem', padding: '0.75rem' }}>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Makine</div>
                            <div style={{ fontWeight: 700 }}>{q.machineLabel || MTYPE[q.machineType] || 'İş makinesi'}</div>
                        </div>
                        <div style={{ background: '#f8fafc', borderRadius: '0.5rem', padding: '0.75rem' }}>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Koşul</div>
                            <div style={{ fontWeight: 700 }}>{q.quantity} {PERIOD[q.periodType]} {q.operatorIncluded ? '· operatörlü' : ''}</div>
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                        {[
                            { l: `${q.quantity} ${PERIOD[q.periodType]} × ${formatCurrency(Number(q.unitPrice))}`, v: Number(q.unitPrice) * Number(q.quantity) },
                            q.transportCost ? { l: 'Nakliye', v: Number(q.transportCost) } : null,
                            q.discount ? { l: 'İndirim', v: -Number(q.discount) } : null,
                            { l: `KDV (%${Number(q.taxRate)})`, v: Number(q.taxAmount) },
                        ].filter(Boolean).map((r: any) => (
                            <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.4rem', color: r.v < 0 ? '#10b981' : '#64748b' }}>
                                <span>{r.l}</span><span style={{ fontWeight: 500 }}>{r.v < 0 ? `- ${formatCurrency(-r.v)}` : formatCurrency(r.v)}</span>
                            </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800, borderTop: '2px solid #1e293b', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                            <span>TOPLAM</span><span style={{ color: '#2563eb' }}>{formatCurrency(Number(q.totalAmount))}</span>
                        </div>
                    </div>

                    {q.validUntil && <div style={{ fontSize: '0.75rem', color: expired ? '#dc2626' : '#94a3b8', marginTop: '0.75rem', textAlign: 'center' }}>{expired ? 'Bu teklifin süresi dolmuştur.' : `Geçerlilik: ${new Date(q.validUntil).toLocaleDateString('tr-TR')}`}</div>}

                    {canRespond && !expired ? (
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                            <button onClick={() => respond('RED')} disabled={submitting} style={{ flex: 1, padding: '0.75rem', border: '2px solid #ef4444', background: '#fff', color: '#ef4444', borderRadius: '0.625rem', fontWeight: 700, cursor: 'pointer' }}>✗ Reddet</button>
                            <button onClick={() => respond('KABUL')} disabled={submitting} style={{ flex: 2, padding: '0.75rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '0.625rem', fontWeight: 700, cursor: 'pointer' }}>{submitting ? 'İşleniyor...' : '✓ Teklifi Kabul Et'}</button>
                        </div>
                    ) : q.status === 'KABUL' || q.status === 'KIRALAMAYA_DONDU' ? (
                        <div style={{ marginTop: '1rem', padding: '0.875rem', background: '#d1fae5', borderRadius: '0.625rem', color: '#065f46', fontWeight: 600, textAlign: 'center' }}>✅ Bu teklifi kabul ettiniz. Teşekkürler!</div>
                    ) : null}

                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <a href={`/api/teklifler/${q.id}/pdf`} style={{ display: 'none' }}>pdf</a>
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                    {tenant?.phone && <>İletişim: {tenant.phone} · </>}Makine Takip ile hazırlanmıştır
                </div>
            </div>
        </div>
    )
}
