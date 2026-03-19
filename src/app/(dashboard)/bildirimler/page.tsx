'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, AlertTriangle, AlertCircle, Info, RefreshCw } from 'lucide-react'

const PRIORITY_CONFIG: Record<string, { color: string; bg: string; border: string; icon: any; label: string }> = {
    KRITIK: { color: '#dc2626', bg: '#fee2e2', border: '#fca5a5', icon: <AlertTriangle size={18} />, label: 'Kritik' },
    UYARI:  { color: '#d97706', bg: '#fef3c7', border: '#fcd34d', icon: <AlertCircle size={18} />, label: 'Uyarı' },
    BILGI:  { color: '#2563eb', bg: '#dbeafe', border: '#93c5fd', icon: <Info size={18} />, label: 'Bilgi' },
}

const TYPE_ICON: Record<string, string> = { BELGE: '📄', BAKIM: '🔧', ODEME: '💰', KIRALAMA: '📋' }

export default function BildirimlerPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('TUMU')

    const load = async () => {
        setLoading(true)
        const res = await fetch('/api/bildirimler')
        setData(await res.json())
        setLoading(false)
    }
    useEffect(() => { load() }, [])

    if (loading || !data) return <div className="spinner" style={{ margin: '3rem auto' }} />
    const { notifications = [], counts } = data
    const filtered = filter === 'TUMU' ? notifications : notifications.filter((n: any) => n.priority === filter)

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Bell size={22} color="#2563eb" /> Bildirimler
                    </h1>
                    <p className="page-subtitle">Kritik uyarılar, hatırlatmalar ve aksiyon gerektiren durumlar</p>
                </div>
                <button className="btn btn-outline" onClick={load}><RefreshCw size={15} /> Yenile</button>
            </div>

            {/* Özet Sayaçları */}
            <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                {[
                    { key: 'TUMU', label: `Tümü (${notifications.length})`, color: '#1e293b', bg: '#f8fafc' },
                    { key: 'KRITIK', label: `Kritik (${counts.kritik})`, color: '#dc2626', bg: '#fee2e2' },
                    { key: 'UYARI', label: `Uyarı (${counts.uyari})`, color: '#d97706', bg: '#fef3c7' },
                    { key: 'BILGI', label: `Bilgi (${counts.bilgi})`, color: '#2563eb', bg: '#dbeafe' },
                ].map(f => (
                    <button key={f.key} onClick={() => setFilter(f.key)}
                        style={{ padding: '0.4rem 0.875rem', borderRadius: '9999px', border: `2px solid ${filter === f.key ? f.color : 'transparent'}`, background: filter === f.key ? f.bg : '#fff', color: f.color, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Bildirim Listesi */}
            {filtered.length === 0 ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    <Bell size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <div style={{ fontWeight: 600 }}>Bildirim yok</div>
                    <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Her şey yolunda görünüyor 👍</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {filtered.map((n: any) => {
                        const pc = PRIORITY_CONFIG[n.priority] || PRIORITY_CONFIG.BILGI
                        return (
                            <Link key={n.id} href={n.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div style={{ background: '#fff', border: `1px solid ${pc.border}`, borderLeft: `4px solid ${pc.color}`, borderRadius: '0.75rem', padding: '1rem 1.25rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', transition: 'box-shadow 0.15s', cursor: 'pointer' }}
                                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)')}
                                    onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                                    <div style={{ background: pc.bg, color: pc.color, borderRadius: '0.5rem', padding: '0.5rem', flexShrink: 0 }}>
                                        {pc.icon}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '1rem' }}>{TYPE_ICON[n.type] || '📋'}</span>
                                            <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{n.title}</span>
                                            <span style={{ padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 700, background: pc.bg, color: pc.color }}>{pc.label}</span>
                                        </div>
                                        <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>{n.description}</p>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, whiteSpace: 'nowrap', alignSelf: 'center' }}>Görüntüle →</span>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
