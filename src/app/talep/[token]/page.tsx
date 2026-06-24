'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, Clock, Award, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const TYPES: Record<string, string> = { EKSAVATOR: 'Ekskavatör', KEPCE: 'Kepçe', VINC: 'Vinç', DOZER: 'Dozer', BEKO_LODER: 'Beko Loder', FORKLIFT: 'Forklift', GREYDER: 'Greyder', SILINDIR: 'Silindir', KAMYON: 'Kamyon', DIGER: 'Diğer' }
const PERIOD: Record<string, string> = { SAATLIK: 'saat', GUNLUK: 'gün', HAFTALIK: 'hafta', AYLIK: 'ay' }

export default function TalepTakipPage() {
    const { token } = useParams<{ token: string }>()
    const [rfq, setRfq] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [accepting, setAccepting] = useState('')
    const [done, setDone] = useState(false)

    const load = () => fetch(`/api/talep/${token}`).then(r => r.json()).then(j => { if (j.error) setError(j.error); else setRfq(j.rfq) }).finally(() => setLoading(false))
    useEffect(() => { load() }, [token])

    const accept = async (bidId: string) => {
        if (!confirm('Bu teklifi kabul ediyor musunuz? Firma sizinle iletişime geçecek.')) return
        setAccepting(bidId)
        const res = await fetch(`/api/talep/${token}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bidId }) })
        const j = await res.json()
        if (j.success) {
            if (j.escrowToken) { window.location.href = `/emanet/${j.escrowToken}`; return }
            setDone(true)
        } else setError(j.error || 'İşlem başarısız')
        setAccepting(''); load()
    }

    const wrap = (c: React.ReactNode) => <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'system-ui, sans-serif', padding: '1.5rem' }}>{c}</div>
    if (loading) return wrap(<div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Yükleniyor...</div>)
    if (error && !rfq) return wrap(<div style={{ textAlign: 'center', padding: '3rem' }}><AlertTriangle size={44} color="#ef4444" /><div style={{ marginTop: '1rem' }}>{error}</div></div>)

    const bids = rfq.bids || []
    const closed = rfq.status === 'KAPANDI'
    const best = bids.length ? Math.min(...bids.map((b: any) => Number(b.unitPrice))) : null

    return wrap(
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Talebiniz</div>
                <h1 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{TYPES[rfq.machineType] || rfq.machineType || 'İş makinesi'}{rfq.city ? ` · ${rfq.city}` : ''}</h1>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>{rfq.quantity} {PERIOD[rfq.periodType]} {rfq.operatorNeeded ? '· operatörlü' : ''}{rfq.budget ? ` · bütçe ${formatCurrency(Number(rfq.budget))}` : ''}</div>
                {rfq.description && <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.5rem' }}>{rfq.description}</p>}
            </div>

            {done && <div style={{ background: '#d1fae5', color: '#065f46', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1rem', textAlign: 'center', fontWeight: 600 }}>✅ Teklifi kabul ettiniz! Firma sizinle iletişime geçecek.</div>}

            <div style={{ fontWeight: 700, margin: '0 0.25rem 0.625rem', color: '#1e293b' }}>{bids.length} Teklif {closed ? '(sonuçlandı)' : '· en uygun fiyatı seç'}</div>

            {bids.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: '0.875rem', padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                    <Clock size={36} style={{ opacity: 0.4 }} /><div style={{ marginTop: '0.75rem' }}>Henüz teklif yok. Firmalar bildirim aldı, kısa süre içinde teklifler gelecek.</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {bids.map((b: any) => {
                        const isBest = Number(b.unitPrice) === best
                        const isAccepted = closed && rfq.acceptedBidId === b.id
                        return (
                            <div key={b.id} style={{ background: '#fff', borderRadius: '0.875rem', padding: '1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: isAccepted ? '2px solid #10b981' : isBest ? '1px solid #93c5fd' : '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    <div>
                                        <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>{b.ownerName}{b.ownerRating && <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 700 }}>★ {b.ownerRating.avg} ({b.ownerRating.count})</span>}{isBest && !closed && <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#2563eb', background: '#dbeafe', padding: '0.1rem 0.4rem', borderRadius: 9999, display: 'inline-flex', alignItems: 'center', gap: 2 }}><Award size={11} /> En uygun</span>}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{b.machineLabel || TYPES[rfq.machineType] || ''}{b.operatorIncluded ? ' · operatörlü' : ''}</div>
                                        {b.note && <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.25rem' }}>{b.note}</div>}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#2563eb' }}>{formatCurrency(Number(b.unitPrice))}<span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 400 }}> /{PERIOD[b.periodType]}</span></div>
                                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>≈ {formatCurrency(Number(b.unitPrice) * rfq.quantity)} toplam</div>
                                    </div>
                                </div>
                                {!closed && (
                                    <button onClick={() => accept(b.id)} disabled={!!accepting} style={{ width: '100%', marginTop: '0.875rem', padding: '0.6rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer' }}>{accepting === b.id ? 'İşleniyor...' : 'Bu Teklifi Kabul Et'}</button>
                                )}
                                {isAccepted && <div style={{ marginTop: '0.75rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}><CheckCircle size={16} /> Kabul edildi</div>}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
