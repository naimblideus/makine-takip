'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CreditCard, CheckCircle, AlertTriangle, Lock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function OdemePage() {
    const { token } = useParams<{ token: string }>()
    const [d, setD] = useState<any>(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)
    const [paying, setPaying] = useState(false)
    const [done, setDone] = useState(false)
    const [card, setCard] = useState({ name: '', no: '', exp: '', cvc: '' })

    useEffect(() => {
        fetch(`/api/odeme/${token}`).then(r => r.json()).then(j => { if (j.error) setError(j.error); else { setD(j); if (j.paid) setDone(true) } }).finally(() => setLoading(false))
    }, [token])

    const pay = async (e: React.FormEvent) => {
        e.preventDefault(); setPaying(true)
        const res = await fetch(`/api/odeme/${token}`, { method: 'POST' })
        const j = await res.json()
        if (j.success) setDone(true); else setError(j.error || 'Ödeme başarısız')
        setPaying(false)
    }

    const wrap = (c: React.ReactNode) => <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', fontFamily: 'system-ui, sans-serif' }}>{c}</div>

    if (loading) return wrap(<div style={{ color: '#64748b' }}>Yükleniyor...</div>)
    if (error && !d) return wrap(<div style={{ textAlign: 'center' }}><AlertTriangle size={44} color="#ef4444" /><h1 style={{ fontWeight: 700, marginTop: '1rem' }}>{error}</h1></div>)
    if (done) return wrap(
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <CheckCircle size={56} color="#10b981" />
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '1rem 0 0.5rem' }}>Ödeme Alındı!</h1>
            <p style={{ color: '#64748b' }}>{d?.invoiceNumber} faturanız ödendi. Teşekkürler.</p>
        </div>
    )

    return wrap(
        <div style={{ width: '100%', maxWidth: 420 }}>
            <div style={{ background: '#fff', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }}>
                <div style={{ background: 'linear-gradient(135deg,#1e293b,#1e3a8a)', color: '#fff', padding: '1.5rem' }}>
                    <div style={{ fontSize: '0.78rem', opacity: 0.8 }}>{d.tenantName}</div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '0.25rem' }}>{d.invoiceNumber} · {d.customerName}</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem' }}>{formatCurrency(d.remaining)}</div>
                </div>
                <form onSubmit={pay} style={{ padding: '1.5rem' }}>
                    {d.mock && <div style={{ background: '#fef3c7', color: '#92400e', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', marginBottom: '1rem' }}>Test modu — gerçek tahsilat için iyzico anahtarı tanımlanmalı. "Öde" ile akış simüle edilir.</div>}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div><label style={lbl}>Kart Üzerindeki İsim</label><input style={inp} value={card.name} onChange={e => setCard({ ...card, name: e.target.value })} placeholder="AD SOYAD" /></div>
                        <div><label style={lbl}>Kart Numarası</label><input style={inp} value={card.no} onChange={e => setCard({ ...card, no: e.target.value })} placeholder="0000 0000 0000 0000" inputMode="numeric" /></div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div><label style={lbl}>SKT</label><input style={inp} value={card.exp} onChange={e => setCard({ ...card, exp: e.target.value })} placeholder="AA/YY" /></div>
                            <div><label style={lbl}>CVC</label><input style={inp} value={card.cvc} onChange={e => setCard({ ...card, cvc: e.target.value })} placeholder="000" /></div>
                        </div>
                    </div>
                    <button type="submit" disabled={paying} style={{ width: '100%', marginTop: '1.25rem', padding: '0.8rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '0.625rem', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                        <CreditCard size={17} /> {paying ? 'İşleniyor...' : `${formatCurrency(d.remaining)} Öde`}
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', marginTop: '0.875rem', fontSize: '0.72rem', color: '#94a3b8' }}>
                        <Lock size={12} /> Kart bilgileriniz güvenli ödeme sağlayıcıda işlenir, bizde saklanmaz.
                    </div>
                </form>
            </div>
        </div>
    )
}

const lbl: React.CSSProperties = { display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }
const inp: React.CSSProperties = { width: '100%', padding: '0.65rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.95rem' }
