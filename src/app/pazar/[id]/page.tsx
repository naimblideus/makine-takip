'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, CheckCircle, Send } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function PazarDetailPage() {
    const { id } = useParams<{ id: string }>()
    const [l, setL] = useState<any>(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState({ requesterName: '', requesterPhone: '', requesterCity: '', message: '' })
    const [sent, setSent] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetch(`/api/pazar/${id}`).then(r => r.json()).then(j => { if (j.error) setError(j.error); else setL(j.listing) }).finally(() => setLoading(false))
    }, [id])

    const submit = async (e: React.FormEvent) => {
        e.preventDefault(); setSubmitting(true)
        const res = await fetch(`/api/pazar/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        const j = await res.json()
        if (j.success) setSent(true); else setError(j.error || 'Gönderilemedi')
        setSubmitting(false)
    }

    if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Yükleniyor...</div>
    if (error && !l) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}><div>İlan bulunamadı</div><Link href="/pazar" style={{ color: '#2563eb' }}>← Borsaya dön</Link></div>

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif', padding: '1.5rem' }}>
            <div style={{ maxWidth: 640, margin: '0 auto' }}>
                <Link href="/pazar" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#64748b', textDecoration: 'none', fontSize: '0.85rem', marginBottom: '1rem' }}><ArrowLeft size={15} /> Borsa</Link>

                <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{l.brand} {l.model}</h1>
                            <div style={{ color: '#64748b' }}>{l.typeLabel}{l.year ? ` · ${l.year}` : ''}</div>
                            {l.city && <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} /> {l.city}</div>}
                        </div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 9999, background: l.available ? '#d1fae5' : '#fef3c7', color: l.available ? '#059669' : '#d97706' }}>{l.available ? 'Müsait' : 'Dolu'}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))', gap: '0.625rem', marginTop: '1.25rem' }}>
                        {l.dailyRate && <div style={{ background: '#f8fafc', borderRadius: '0.5rem', padding: '0.625rem', textAlign: 'center' }}><div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Günlük</div><div style={{ fontWeight: 800, color: '#2563eb' }}>{formatCurrency(l.dailyRate)}</div></div>}
                        {l.weeklyRate && <div style={{ background: '#f8fafc', borderRadius: '0.5rem', padding: '0.625rem', textAlign: 'center' }}><div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Haftalık</div><div style={{ fontWeight: 800 }}>{formatCurrency(l.weeklyRate)}</div></div>}
                        {l.monthlyRate && <div style={{ background: '#f8fafc', borderRadius: '0.5rem', padding: '0.625rem', textAlign: 'center' }}><div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Aylık</div><div style={{ fontWeight: 800 }}>{formatCurrency(l.monthlyRate)}</div></div>}
                    </div>

                    {l.note && <p style={{ marginTop: '1rem', color: '#475569', fontSize: '0.9rem' }}>{l.note}</p>}
                    <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>Sahip: <b style={{ color: '#475569' }}>{l.ownerName}</b></div>
                </div>

                {/* Teklif iste */}
                <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                    {sent ? (
                        <div style={{ textAlign: 'center', padding: '1rem' }}>
                            <CheckCircle size={48} color="#10b981" />
                            <h2 style={{ fontWeight: 700, margin: '0.75rem 0 0.25rem' }}>Talebiniz iletildi!</h2>
                            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Makine sahibi en kısa sürede size dönecek.</p>
                        </div>
                    ) : (
                        <form onSubmit={submit}>
                            <h3 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Bu makine için teklif iste</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', marginBottom: '0.625rem' }}>
                                <input required placeholder="Adınız *" value={form.requesterName} onChange={e => setForm({ ...form, requesterName: e.target.value })} style={inp} />
                                <input placeholder="Telefon" value={form.requesterPhone} onChange={e => setForm({ ...form, requesterPhone: e.target.value })} style={inp} />
                            </div>
                            <input placeholder="Şehir / şantiye" value={form.requesterCity} onChange={e => setForm({ ...form, requesterCity: e.target.value })} style={{ ...inp, marginBottom: '0.625rem', width: '100%' }} />
                            <textarea rows={3} placeholder="Ne kadar süre, ne zaman lazım? (opsiyonel)" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} style={{ ...inp, width: '100%', marginBottom: '0.875rem', resize: 'vertical' }} />
                            <button type="submit" disabled={submitting} style={{ width: '100%', padding: '0.75rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '0.625rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                                <Send size={15} /> {submitting ? 'Gönderiliyor...' : 'Teklif İste'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}

const inp: React.CSSProperties = { padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.9rem' }
