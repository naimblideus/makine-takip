'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Truck, Wrench, AlertTriangle, CheckCircle, MapPin } from 'lucide-react'
import Link from 'next/link'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    KIRADA: { label: 'Kirada', color: '#2563eb', bg: '#dbeafe', icon: <Truck size={16} /> },
    MUSAIT: { label: 'Müsait', color: '#059669', bg: '#d1fae5', icon: <CheckCircle size={16} /> },
    BAKIMDA: { label: 'Bakımda', color: '#d97706', bg: '#fef3c7', icon: <Wrench size={16} /> },
    ARIZALI: { label: 'Arızalı', color: '#dc2626', bg: '#fee2e2', icon: <AlertTriangle size={16} /> },
    REZERVE: { label: 'Rezerve', color: '#7c3aed', bg: '#ede9fe', icon: <Truck size={16} /> },
}

const TYPE_LABELS: Record<string, string> = { FORKLIFT: 'Forklift', EKSAVATOR: 'Ekskavatör', VINC: 'Vinç', DOZER: 'Dozer', KEPCE: 'Kepçe', GREYDER: 'Greyder', SILINDIR: 'Silindir', KAMYON: 'Kamyon', BEKO_LODER: 'Beko Loder', DIGER: 'Diğer' }

export default function FiloDurumPage() {
    const [machines, setMachines] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('TUMU')
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

    const load = async () => {
        setLoading(true)
        const res = await fetch('/api/makineler')
        const j = await res.json()
        setMachines(j.machines || [])
        setLastUpdated(new Date())
        setLoading(false)
    }
    useEffect(() => { load() }, [])
    // Otomatik yenile (her 60 saniye)
    useEffect(() => { const t = setInterval(load, 60000); return () => clearInterval(t) }, [])

    const filtered = filter === 'TUMU' ? machines : machines.filter(m => m.status === filter)
    const counts: Record<string, number> = {}
    machines.forEach(m => { counts[m.status] = (counts[m.status] || 0) + 1 })

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">🗺️ Filo Anlık Durum</h1>
                    <p className="page-subtitle">Tüm makinelerin gerçek zamanlı durumu — Son güncelleme: {lastUpdated.toLocaleTimeString('tr-TR')}</p>
                </div>
                <button className="btn btn-outline" onClick={load}><RefreshCw size={15} /> Yenile</button>
            </div>

            {/* Durum Özeti */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                    { key: 'TUMU', label: 'Tümü', value: machines.length, color: '#1e293b', bg: '#f8fafc' },
                    ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ key: k, label: v.label, value: counts[k] || 0, color: v.color, bg: v.bg })),
                ].map(s => (
                    <button key={s.key} onClick={() => setFilter(s.key)}
                        style={{ border: `2px solid ${filter === s.key ? s.color : 'transparent'}`, background: filter === s.key ? s.bg : '#fff', borderRadius: '0.75rem', padding: '0.875rem', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                        <div style={{ fontSize: '1.625rem', fontWeight: 900, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>{s.label}</div>
                    </button>
                ))}
            </div>

            {/* Makine Kartları */}
            {loading ? (
                <div className="spinner" style={{ margin: '3rem auto' }} />
            ) : filtered.length === 0 ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    <Truck size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <div>Bu filtrede makine yok</div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.875rem' }}>
                    {filtered.map((m: any) => {
                        const sc = STATUS_CONFIG[m.status] || STATUS_CONFIG.MUSAIT
                        return (
                            <Link key={m.id} href={`/makineler/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div className="card" style={{ padding: '1.125rem', borderTop: `3px solid ${sc.color}`, transition: 'box-shadow 0.15s', cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{m.brand} {m.model}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{m.plate || TYPE_LABELS[m.type] || m.type}</div>
                                        </div>
                                        <span style={{ padding: '0.25rem 0.625rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 700, background: sc.bg, color: sc.color, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            {sc.icon} {sc.label}
                                        </span>
                                    </div>

                                    {/* Aktif kiralama bilgisi */}
                                    {m.status === 'KIRADA' && m.rentals?.[0] && (
                                        <div style={{ background: '#f0f9ff', borderRadius: '0.5rem', padding: '0.5rem 0.625rem', fontSize: '0.75rem', color: '#0369a1' }}>
                                            <div style={{ fontWeight: 600 }}>{m.rentals[0].customer?.companyName}</div>
                                            <div style={{ color: '#7dd3fc', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.125rem' }}>
                                                <MapPin size={11} /> {m.rentals[0].site?.name || 'Şantiye bilgisi yok'}
                                            </div>
                                        </div>
                                    )}

                                    {/* İstatistikler */}
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.625rem', fontSize: '0.7rem', color: '#94a3b8' }}>
                                        <span>⏱ {Number(m.totalHours || 0)}s</span>
                                        {m.year && <span>• {m.year}</span>}
                                        {m.location && <span>• 📍{m.location}</span>}
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
