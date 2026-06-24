'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, MapPin, Truck } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const TYPES = ['all', 'EKSAVATOR', 'KEPCE', 'VINC', 'DOZER', 'BEKO_LODER', 'FORKLIFT', 'GREYDER', 'SILINDIR', 'KAMYON', 'DIGER']
const TYPE_LABELS: Record<string, string> = { all: 'Tümü', FORKLIFT: 'Forklift', EKSAVATOR: 'Ekskavatör', VINC: 'Vinç', DOZER: 'Dozer', KEPCE: 'Kepçe', GREYDER: 'Greyder', SILINDIR: 'Silindir', KAMYON: 'Kamyon', BEKO_LODER: 'Beko Loder', DIGER: 'Diğer' }

export default function PazarPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [type, setType] = useState('all')
    const [search, setSearch] = useState('')
    const [city, setCity] = useState('')

    useEffect(() => {
        const p = new URLSearchParams()
        if (type !== 'all') p.set('type', type)
        if (search) p.set('search', search)
        if (city) p.set('city', city)
        setLoading(true)
        fetch(`/api/pazar?${p}`).then(r => r.json()).then(setData).finally(() => setLoading(false))
    }, [type, search, city])

    const listings = data?.listings || []
    const cities: string[] = data?.cities || []

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e3a8a)', color: '#fff', padding: '2rem 1.5rem' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8, fontWeight: 700 }}>🏗 MAKİNE TAKİP</div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.25rem 0' }}>İş Makinesi Kiralama Borsası</h1>
                    <p style={{ opacity: 0.85 }}>Kiralık iş makinesi bul, sahibinden teklif al. Doğrudan iletişim.</p>
                    <Link href="/talep-ver" style={{ display: 'inline-block', marginTop: '0.875rem', background: '#fff', color: '#1e3a8a', padding: '0.55rem 1.1rem', borderRadius: 9999, fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}>+ Aradığını bulamadın mı? Talep ver, firmalar sana teklif getirsin →</Link>
                    <div style={{ position: 'relative', maxWidth: 480, marginTop: '1rem' }}>
                        <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input placeholder="Marka, model ara..." value={search} onChange={e => setSearch(e.target.value)}
                            style={{ width: '100%', padding: '0.7rem 0.7rem 0.7rem 2.5rem', borderRadius: '0.625rem', border: 'none', fontSize: '0.95rem' }} />
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem' }}>
                {/* Tip + şehir filtreleri */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
                    {TYPES.map(t => (
                        <button key={t} onClick={() => setType(t)} style={{
                            padding: '0.4rem 0.9rem', borderRadius: 9999, border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                            background: type === t ? '#2563eb' : '#fff', color: type === t ? '#fff' : '#64748b', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        }}>{TYPE_LABELS[t]}</button>
                    ))}
                    {cities.length > 0 && (
                        <select value={city} onChange={e => setCity(e.target.value)} style={{ marginLeft: 'auto', padding: '0.4rem 0.75rem', borderRadius: 9999, border: '1px solid #e2e8f0', fontSize: '0.82rem', fontWeight: 600, color: '#475569', background: '#fff', cursor: 'pointer' }}>
                            <option value="">📍 Tüm şehirler</option>
                            {cities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    )}
                </div>

                {loading ? <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Yükleniyor...</div>
                    : listings.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                            <Truck size={40} style={{ opacity: 0.4 }} />
                            <div style={{ marginTop: '0.75rem' }}>Bu kritere uygun ilan yok.</div>
                        </div>
                    ) : (
                        <>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.75rem' }}>{listings.length} kiralık makine</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                                {listings.map((l: any) => (
                                    <Link key={l.id} href={`/pazar/${l.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <div style={{ background: '#fff', borderRadius: '0.875rem', padding: '1.1rem', boxShadow: l.featured ? '0 4px 14px rgba(245,158,11,0.18)' : '0 1px 3px rgba(0,0,0,0.08)', height: '100%', border: l.featured ? '1.5px solid #f59e0b' : '1px solid #f1f5f9', position: 'relative' }}>
                                            {l.featured && <div style={{ position: 'absolute', top: -9, left: 12, background: '#f59e0b', color: '#fff', fontSize: '0.62rem', fontWeight: 800, padding: '0.1rem 0.5rem', borderRadius: 9999, letterSpacing: '0.02em' }}>★ SPONSORLU</div>}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{l.brand} {l.model}</div>
                                                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{l.typeLabel}{l.year ? ` · ${l.year}` : ''}</div>
                                                </div>
                                                <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 9999, background: l.available ? '#d1fae5' : '#fef3c7', color: l.available ? '#059669' : '#d97706' }}>{l.available ? 'Müsait' : 'Dolu'}</span>
                                            </div>
                                            {l.city && <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={13} /> {l.city}</div>}
                                            {l.dailyRate && <div style={{ marginTop: '0.625rem', fontWeight: 800, color: '#2563eb', fontSize: '1.05rem' }}>{formatCurrency(l.dailyRate)}<span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}> /gün</span></div>}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.625rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
                                                <span>{l.ownerName}</span>
                                                {l.rating && <span style={{ color: '#f59e0b', fontWeight: 700 }}>★ {l.rating.avg} ({l.rating.count})</span>}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </>
                    )}
            </div>
        </div>
    )
}
