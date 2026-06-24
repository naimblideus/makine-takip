'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ShieldCheck, CreditCard, CheckCircle, Lock, PackageCheck, AlertTriangle, Star } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function EmanetPage() {
    const { token } = useParams<{ token: string }>()
    const [e, setE] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)
    const [card, setCard] = useState({ name: '', no: '', exp: '', cvc: '' })
    const [stars, setStars] = useState(0)
    const [rComment, setRComment] = useState('')
    const [reviewed, setReviewed] = useState(false)

    const submitReview = async () => {
        if (!stars) return
        await fetch('/api/pazar-puan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ escrowToken: token, rating: stars, comment: rComment }) })
        setReviewed(true)
    }

    const load = () => fetch(`/api/emanet/${token}`).then(r => r.json()).then(j => { if (j.error) setError(j.error); else setE(j.escrow) }).finally(() => setLoading(false))
    useEffect(() => { load() }, [token])

    const act = async (action: string) => {
        setBusy(true)
        const res = await fetch(`/api/emanet/${token}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
        const j = await res.json()
        if (!j.success) setError(j.error || 'İşlem başarısız')
        await load(); setBusy(false)
    }

    const wrap = (c: React.ReactNode) => <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', fontFamily: 'system-ui, sans-serif' }}>{c}</div>
    if (loading) return wrap(<div style={{ color: '#64748b' }}>Yükleniyor...</div>)
    if (error && !e) return wrap(<div style={{ textAlign: 'center' }}><AlertTriangle size={44} color="#ef4444" /><div style={{ marginTop: '1rem' }}>{error}</div></div>)

    return wrap(
        <div style={{ width: '100%', maxWidth: 440 }}>
            <div style={{ background: '#fff', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }}>
                <div style={{ background: 'linear-gradient(135deg,#065f46,#047857)', color: '#fff', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.85rem', opacity: 0.9 }}><ShieldCheck size={18} /> Güvenli Emanet Ödeme</div>
                    <div style={{ fontSize: '0.82rem', opacity: 0.85, marginTop: '0.25rem' }}>{e.ownerName} · {e.payerName}</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem' }}>{formatCurrency(e.amount)}</div>
                </div>

                <div style={{ padding: '1.5rem' }}>
                    {/* Adım göstergesi */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', fontSize: '0.72rem' }}>
                        {[['BEKLIYOR', 'Öde'], ['TUTULUYOR', 'Tutuluyor'], ['SERBEST', 'Teslim & Serbest']].map(([s, label], i) => {
                            const order = ['BEKLIYOR', 'TUTULUYOR', 'SERBEST']
                            const active = order.indexOf(e.status) >= i
                            return <div key={s} style={{ flex: 1, textAlign: 'center', color: active ? '#059669' : '#cbd5e1', fontWeight: active ? 700 : 400 }}>● {label}</div>
                        })}
                    </div>

                    {e.status === 'BEKLIYOR' && (
                        <>
                            {e.mock && <div style={{ background: '#fef3c7', color: '#92400e', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.74rem', marginBottom: '1rem' }}>Test modu — gerçek tahsilat için iyzico anahtarı gerekir.</div>}
                            <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '1rem' }}>Paranız platformda <b>emanette</b> tutulur; makineyi teslim alıp onaylayana kadar firmaya geçmez. Güvendesiniz.</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                                <input style={inp} placeholder="Kart üzerindeki isim" value={card.name} onChange={ev => setCard({ ...card, name: ev.target.value })} />
                                <input style={inp} placeholder="0000 0000 0000 0000" value={card.no} onChange={ev => setCard({ ...card, no: ev.target.value })} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
                                    <input style={inp} placeholder="AA/YY" value={card.exp} onChange={ev => setCard({ ...card, exp: ev.target.value })} />
                                    <input style={inp} placeholder="CVC" value={card.cvc} onChange={ev => setCard({ ...card, cvc: ev.target.value })} />
                                </div>
                            </div>
                            <button onClick={() => act('FUND')} disabled={busy} style={btn('#059669')}><CreditCard size={17} /> {busy ? 'İşleniyor...' : `${formatCurrency(e.amount)} Emanete Öde`}</button>
                        </>
                    )}

                    {e.status === 'TUTULUYOR' && (
                        <div style={{ textAlign: 'center' }}>
                            <Lock size={40} color="#059669" />
                            <h3 style={{ fontWeight: 700, margin: '0.75rem 0 0.25rem' }}>Ödemeniz emanette güvende</h3>
                            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>Makineyi teslim aldıysanız ödemeyi serbest bırakın; {formatCurrency(e.ownerNet)} firmaya geçer.</p>
                            <button onClick={() => act('RELEASE')} disabled={busy} style={btn('#2563eb')}><PackageCheck size={17} /> {busy ? 'İşleniyor...' : 'Teslim Aldım — Serbest Bırak'}</button>
                        </div>
                    )}

                    {e.status === 'SERBEST' && (
                        <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                            <CheckCircle size={52} color="#10b981" />
                            <h3 style={{ fontWeight: 800, margin: '0.75rem 0 0.25rem' }}>Tamamlandı!</h3>
                            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>Ödeme firmaya aktarıldı. İyi çalışmalar.</p>
                            {(reviewed || e.reviewed) ? (
                                <div style={{ background: '#f0fdf4', color: '#065f46', padding: '0.75rem', borderRadius: '0.625rem', fontWeight: 600, fontSize: '0.85rem' }}>⭐ Değerlendirmeniz için teşekkürler!</div>
                            ) : (
                                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem' }}>{e.ownerName}'i puanla</div>
                                    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center', marginBottom: '0.75rem' }}>
                                        {[1, 2, 3, 4, 5].map(n => (
                                            <button key={n} onClick={() => setStars(n)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                                                <Star size={28} fill={n <= stars ? '#f59e0b' : 'none'} color={n <= stars ? '#f59e0b' : '#cbd5e1'} />
                                            </button>
                                        ))}
                                    </div>
                                    <input value={rComment} onChange={ev => setRComment(ev.target.value)} placeholder="Yorum (opsiyonel)" style={inp} />
                                    <button onClick={submitReview} disabled={!stars} style={btn(stars ? '#f59e0b' : '#cbd5e1')}>Puanı Gönder</button>
                                </div>
                            )}
                        </div>
                    )}

                    {e.status === 'IADE' && <div style={{ textAlign: 'center', color: '#dc2626', fontWeight: 600 }}>Bu emanet iade edildi.</div>}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', marginTop: '1rem', fontSize: '0.7rem', color: '#94a3b8' }}><ShieldCheck size={12} /> Platform güvencesi · komisyon {formatCurrency(e.commissionTL)}</div>
                </div>
            </div>
        </div>
    )
}

const inp: React.CSSProperties = { width: '100%', padding: '0.6rem 0.7rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.92rem' }
const btn = (bg: string): React.CSSProperties => ({ width: '100%', marginTop: '1.1rem', padding: '0.8rem', background: bg, color: '#fff', border: 'none', borderRadius: '0.625rem', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' })
