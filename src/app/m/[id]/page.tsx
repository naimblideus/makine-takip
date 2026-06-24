'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { AlertTriangle, CheckCircle, Wrench, Phone } from 'lucide-react'

const TYPE: Record<string, string> = { FORKLIFT: 'Forklift', EKSAVATOR: 'Ekskavatör', VINC: 'Vinç', DOZER: 'Dozer', KEPCE: 'Kepçe', GREYDER: 'Greyder', SILINDIR: 'Silindir', KAMYON: 'Kamyon', BEKO_LODER: 'Beko Loder', DIGER: 'Diğer' }
const STATUS_COLOR: Record<string, { c: string; b: string }> = { MUSAIT: { c: '#059669', b: '#d1fae5' }, KIRADA: { c: '#2563eb', b: '#dbeafe' }, BAKIMDA: { c: '#d97706', b: '#fef3c7' }, ARIZALI: { c: '#dc2626', b: '#fee2e2' } }

export default function MachineQrPage() {
    const { id } = useParams<{ id: string }>()
    const [m, setM] = useState<any>(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState({ description: '', reporterName: '', reporterPhone: '' })
    const [sent, setSent] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [pageUrl, setPageUrl] = useState('')

    useEffect(() => {
        setPageUrl(window.location.href)
        fetch(`/api/m/${id}`).then(r => r.json()).then(j => { if (j.error) setError(j.error); else setM(j.machine) }).catch(() => setError('Yüklenemedi')).finally(() => setLoading(false))
    }, [id])

    const submit = async (e: React.FormEvent) => {
        e.preventDefault(); setSubmitting(true)
        const res = await fetch(`/api/m/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        const j = await res.json()
        if (j.success) setSent(true); else setError(j.error || 'Gönderilemedi')
        setSubmitting(false)
    }

    const wrap = (c: React.ReactNode) => <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '1.5rem', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c}</div>

    if (loading) return wrap(<div style={{ color: '#64748b' }}>Yükleniyor...</div>)
    if (error && !m) return wrap(<div style={{ textAlign: 'center' }}><AlertTriangle size={44} color="#ef4444" /><h1 style={{ fontWeight: 700, marginTop: '1rem' }}>Makine bulunamadı</h1></div>)

    const sc = STATUS_COLOR[m.status] || STATUS_COLOR.MUSAIT
    const qrSrc = pageUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pageUrl)}` : ''

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '1.5rem', fontFamily: 'system-ui, sans-serif' }}>
            <div style={{ maxWidth: 460, margin: '0 auto' }}>
                <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{m.tenantName}</div>
                            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b' }}>{m.brand} {m.model}</h1>
                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{TYPE[m.type] || m.type}{m.plate ? ` · ${m.plate}` : ''}{m.serialNumber ? ` · ${m.serialNumber}` : ''}</div>
                        </div>
                        <span style={{ padding: '0.3rem 0.7rem', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 700, background: sc.b, color: sc.c }}>{m.statusLabel}</span>
                    </div>
                    {qrSrc && (
                        <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={qrSrc} alt="QR" style={{ width: 150, height: 150 }} />
                            <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.25rem' }}>Bu kartı yazdırıp makineye yapıştırın</div>
                        </div>
                    )}
                    {m.tenantPhone && (
                        <a href={`tel:${m.tenantPhone}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '0.5rem', color: '#2563eb', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}>
                            <Phone size={15} /> {m.tenantPhone}
                        </a>
                    )}
                </div>

                {/* Arıza Bildir */}
                <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                    {sent ? (
                        <div style={{ textAlign: 'center', padding: '1rem' }}>
                            <CheckCircle size={48} color="#10b981" />
                            <h2 style={{ fontWeight: 700, margin: '0.75rem 0 0.25rem' }}>Arıza bildirimi alındı</h2>
                            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Yetkili en kısa sürede ilgilenecek. Teşekkürler.</p>
                        </div>
                    ) : (
                        <form onSubmit={submit}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem' }}>
                                <Wrench size={17} color="#d97706" /> Arıza / Sorun Bildir
                            </div>
                            <textarea required rows={3} placeholder="Sorunu kısaca yazın (örn. hidrolik kaçağı, çalışmıyor...)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.9rem', marginBottom: '0.625rem', resize: 'vertical' }} />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', marginBottom: '0.875rem' }}>
                                <input placeholder="Adınız (ops.)" value={form.reporterName} onChange={e => setForm({ ...form, reporterName: e.target.value })} style={{ padding: '0.55rem 0.7rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.875rem' }} />
                                <input placeholder="Telefon (ops.)" value={form.reporterPhone} onChange={e => setForm({ ...form, reporterPhone: e.target.value })} style={{ padding: '0.55rem 0.7rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.875rem' }} />
                            </div>
                            <button type="submit" disabled={submitting} style={{ width: '100%', padding: '0.75rem', background: '#d97706', color: '#fff', border: 'none', borderRadius: '0.625rem', fontWeight: 700, cursor: 'pointer' }}>
                                {submitting ? 'Gönderiliyor...' : 'Arızayı Bildir'}
                            </button>
                        </form>
                    )}
                </div>

                <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.72rem', color: '#94a3b8' }}>Makine Takip · QR kart</div>
            </div>
        </div>
    )
}
