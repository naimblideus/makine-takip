'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Users, Phone, MapPin, Ban, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Customer {
    id: string
    companyName: string
    contactPerson: string | null
    phone: string | null
    email: string | null
    address: string | null
    taxOffice: string | null
    taxNumber: string | null
    isBlacklisted: boolean
    blacklistReason: string | null
    _count: { rentals: number; sites: number }
}

export default function MusterilerPage() {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [tab, setTab] = useState<'all' | 'active' | 'blacklisted'>('all')

    useEffect(() => {
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        if (tab === 'blacklisted') params.set('blacklisted', 'true')
        if (tab === 'active') params.set('blacklisted', 'false')

        fetch(`/api/musteriler?${params}`)
            .then((res) => res.json())
            .then(setCustomers)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [search, tab])

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Müşteriler</h1>
                    <p className="page-subtitle">{customers.length} müşteri</p>
                </div>
                <Link href="/musteriler/yeni" className="btn btn-primary">
                    <Plus size={18} />
                    Yeni Müşteri
                </Link>
            </div>

            {/* Arama + Tab */}
            <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ position: 'relative', maxWidth: '24rem' }}>
                    <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        className="input"
                        placeholder="Firma, yetkili veya telefon ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: '2.5rem' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[{ v: 'all' as const, l: 'Tümü' }, { v: 'active' as const, l: 'Aktif' }, { v: 'blacklisted' as const, l: '🚫 Kara Liste' }].map((t) => (
                        <button
                            key={t.v}
                            className={cn('filter-chip', tab === t.v && 'filter-chip-active')}
                            onClick={() => setTab(t.v)}
                        >
                            {t.l}
                        </button>
                    ))}
                </div>
            </div>

            {loading && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '30vh' }}>
                    <div className="spinner" />
                </div>
            )}

            {!loading && customers.length === 0 && (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon"><Users size={28} /></div>
                        <div className="empty-state-title">Müşteri bulunamadı</div>
                        <div className="empty-state-text">{search ? 'Arama kriterine uygun müşteri yok' : 'İlk müşterinizi ekleyin'}</div>
                    </div>
                </div>
            )}

            {!loading && customers.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                    {customers.map((c) => (
                        <Link
                            key={c.id}
                            href={`/musteriler/${c.id}`}
                            className="card card-interactive"
                            style={{
                                padding: '1.25rem',
                                textDecoration: 'none',
                                color: 'inherit',
                                display: 'block',
                                borderLeft: c.isBlacklisted ? '3px solid #dc2626' : undefined,
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                <div style={{ fontSize: '1rem', fontWeight: 700 }}>{c.companyName}</div>
                                {c.isBlacklisted && (
                                    <span className="badge bg-red-50 text-red-700" style={{ fontSize: '0.6875rem' }}>
                                        <Ban size={12} />
                                        Kara Liste
                                    </span>
                                )}
                            </div>
                            {c.contactPerson && (
                                <div style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '0.375rem' }}>
                                    👤 {c.contactPerson}
                                </div>
                            )}
                            {c.phone && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: '#64748b', marginBottom: '0.375rem' }}>
                                    <Phone size={12} />
                                    {c.phone}
                                </div>
                            )}
                            {c.isBlacklisted && c.blacklistReason && (
                                <div style={{ fontSize: '0.75rem', color: '#dc2626', background: '#fee2e2', padding: '0.5rem', borderRadius: '0.375rem', marginTop: '0.5rem' }}>
                                    ⚠️ {c.blacklistReason}
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.625rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                                <span>{c._count.rentals} kiralama</span>
                                <span>{c._count.sites} şantiye</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
