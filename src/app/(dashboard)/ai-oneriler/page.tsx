'use client'

import { useEffect, useState } from 'react'
import { Brain, TrendingUp, AlertTriangle, Star, Fuel, Wrench, RefreshCw } from 'lucide-react'
import Link from 'next/link'

const PRIORITY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
    YUKSEK: { color: '#dc2626', bg: '#fee2e2', label: 'Yüksek Öncelik' },
    ORTA: { color: '#d97706', bg: '#fef3c7', label: 'Orta Öncelik' },
    DUSUK: { color: '#2563eb', bg: '#dbeafe', label: 'Bilgi' },
}

const TYPE_ICONS: Record<string, any> = {
    FILO_OPTIMIZASYON: <TrendingUp size={22} />,
    BAKIM: <Wrench size={22} />,
    MUSTERI_RISKI: <AlertTriangle size={22} />,
    YAKIT_ANOMALI: <Fuel size={22} />,
    VIP_FIRSAT: <Star size={22} />,
}

export default function AiOnerilerPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [ozet, setOzet] = useState<any>(null)
    const [waModal, setWaModal] = useState(false)

    const load = async () => {
        setLoading(true)
        const [sugRes, ozetRes] = await Promise.all([
            fetch('/api/ai-oneriler'),
            fetch('/api/ozet'),
        ])
        setData(await sugRes.json())
        setOzet(await ozetRes.json())
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    if (loading) return <div className="spinner" style={{ margin: '3rem auto' }} />
    const { suggestions = [], generatedAt } = data || {}

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Brain size={22} color="#7c3aed" /> AI Öneriler
                    </h1>
                    <p className="page-subtitle">Verilerinizden üretilen akıllı içgörüler ve öneriler</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-outline" onClick={() => setWaModal(true)}>📱 WhatsApp Özeti</button>
                    <button className="btn btn-outline" onClick={load}><RefreshCw size={15} /> Yenile</button>
                </div>
            </div>

            {/* Öneri Kartları */}
            {suggestions.length === 0 ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    <Brain size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <div style={{ fontWeight: 600 }}>Her şey yolunda görünüyor!</div>
                    <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Şu an önerilecek kritik bir durum yok.</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    {suggestions.map((s: any, i: number) => {
                        const pr = PRIORITY_CONFIG[s.priority] || PRIORITY_CONFIG.DUSUK
                        return (
                            <div key={i} className="card" style={{ padding: '1.25rem', borderLeft: `4px solid ${pr.color}` }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                    <div style={{ background: pr.bg, color: pr.color, borderRadius: '0.625rem', padding: '0.625rem', flexShrink: 0 }}>
                                        {TYPE_ICONS[s.type] || <Brain size={22} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                                            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0 }}>{s.title}</h3>
                                            <span style={{ padding: '0.15rem 0.55rem', borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 700, background: pr.bg, color: pr.color }}>
                                                {pr.label}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0 0 0.75rem' }}>{s.description}</p>
                                        {s.action && (
                                            <Link href={s.action.href} className="btn btn-sm btn-outline">
                                                {s.action.label} →
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {generatedAt && (
                <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                    Son güncelleme: {new Date(generatedAt).toLocaleString('tr-TR')}
                </div>
            )}

            {/* WhatsApp Özet Modal */}
            {waModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
                    <div className="card" style={{ width: '100%', maxWidth: 480, padding: '1.5rem' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>📱 WhatsApp Günlük Özeti</h2>
                        <div style={{ background: '#dcfce7', borderRadius: '0.75rem', padding: '1rem', fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#166534', marginBottom: '1rem', overflowY: 'auto', maxHeight: 300 }}>
                            {ozet?.whatsappText || 'Yükleniyor...'}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-outline" onClick={() => { navigator.clipboard.writeText(ozet?.whatsappText || '') }} style={{ flex: 1 }}>
                                📋 Kopyala
                            </button>
                            <button className="btn btn-primary" onClick={() => setWaModal(false)} style={{ flex: 1 }}>Kapat</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
