'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    Plus,
    Search,
    Truck,
    Clock,
    Calendar,
    AlertCircle,
} from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import {
    MACHINE_TYPE_LABELS,
    MACHINE_STATUS_LABELS,
    MACHINE_STATUS_COLORS,
} from '@/lib/constants'

interface Machine {
    id: string
    plate: string | null
    serialNumber: string | null
    brand: string
    model: string
    year: number | null
    type: string
    status: string
    photo: string | null
    dailyRate: string | null
    totalHours: string
    insuranceExpiry: string | null
    inspectionExpiry: string | null
    rentals: {
        customer: { companyName: string }
    }[]
}

const statusFilters = [
    { value: 'all', label: 'Tümü' },
    { value: 'MUSAIT', label: 'Müsait', dot: 'bg-emerald-500' },
    { value: 'KIRADA', label: 'Kirada', dot: 'bg-blue-500' },
    { value: 'BAKIMDA', label: 'Bakımda', dot: 'bg-amber-500' },
    { value: 'ARIZALI', label: 'Arızalı', dot: 'bg-red-500' },
]

export default function MakinelerPage() {
    const [machines, setMachines] = useState<Machine[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('all')
    const [search, setSearch] = useState('')

    useEffect(() => {
        const params = new URLSearchParams()
        if (statusFilter !== 'all') params.set('status', statusFilter)
        if (search) params.set('search', search)

        fetch(`/api/makineler?${params}`)
            .then((res) => res.json())
            .then(setMachines)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [statusFilter, search])

    const isExpiringSoon = (date: string | null) => {
        if (!date) return false
        const d = new Date(date)
        const now = new Date()
        return d <= now
    }

    return (
        <div>
            {/* Sayfa Başlık */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Makineler</h1>
                    <p className="page-subtitle">{machines.length} makine</p>
                </div>
                <Link href="/makineler/yeni" className="btn btn-primary">
                    <Plus size={18} />
                    Yeni Makine
                </Link>
            </div>

            {/* Arama + Filtreler */}
            <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Arama */}
                <div style={{ position: 'relative', maxWidth: '24rem' }}>
                    <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        className="input"
                        placeholder="Plaka, marka veya model ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: '2.5rem' }}
                    />
                </div>

                {/* Durum Filtreleri */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {statusFilters.map((f) => (
                        <button
                            key={f.value}
                            className={cn('filter-chip', statusFilter === f.value && 'filter-chip-active')}
                            onClick={() => setStatusFilter(f.value)}
                        >
                            {f.dot && (
                                <span className={cn('badge-dot', f.dot)} style={{ width: '0.5rem', height: '0.5rem' }} />
                            )}
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '30vh' }}>
                    <div className="spinner" />
                </div>
            )}

            {/* Boş Durum */}
            {!loading && machines.length === 0 && (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <Truck size={28} />
                        </div>
                        <div className="empty-state-title">Makine bulunamadı</div>
                        <div className="empty-state-text">
                            {search || statusFilter !== 'all'
                                ? 'Filtre kriterlerine uygun makine yok'
                                : 'İlk makinenizi ekleyin'}
                        </div>
                        {!search && statusFilter === 'all' && (
                            <Link href="/makineler/yeni" className="btn btn-primary btn-sm">
                                <Plus size={16} />
                                Makine Ekle
                            </Link>
                        )}
                    </div>
                </div>
            )}

            {/* Makine Kartları */}
            {!loading && machines.length > 0 && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '1rem',
                }}>
                    {machines.map((machine) => {
                        const statusColor = MACHINE_STATUS_COLORS[machine.status as keyof typeof MACHINE_STATUS_COLORS]
                        const activeRental = machine.rentals[0]
                        const expired = isExpiringSoon(machine.insuranceExpiry) || isExpiringSoon(machine.inspectionExpiry)

                        return (
                            <Link
                                key={machine.id}
                                href={`/makineler/${machine.id}`}
                                className="card card-interactive"
                                style={{ padding: '1.25rem', textDecoration: 'none', color: 'inherit', display: 'block' }}
                            >
                                {/* Üst: Marka/Model + Durum */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                    <div>
                                        <div style={{ fontSize: '1rem', fontWeight: 700 }}>
                                            {machine.brand} {machine.model}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem' }}>
                                            {MACHINE_TYPE_LABELS[machine.type as keyof typeof MACHINE_TYPE_LABELS]}
                                            {machine.year && ` · ${machine.year}`}
                                        </div>
                                    </div>
                                    <span className={cn('badge', statusColor?.bg, statusColor?.text)}>
                                        <span className={cn('badge-dot', statusColor?.dot)} />
                                        {MACHINE_STATUS_LABELS[machine.status as keyof typeof MACHINE_STATUS_LABELS]}
                                    </span>
                                </div>

                                {/* Plaka / Seri No */}
                                <div style={{
                                    display: 'inline-block',
                                    padding: '0.25rem 0.625rem',
                                    borderRadius: '0.375rem',
                                    background: '#f1f5f9',
                                    fontSize: '0.8125rem',
                                    fontWeight: 600,
                                    letterSpacing: '0.025em',
                                    marginBottom: '0.75rem',
                                    color: '#334155',
                                }}>
                                    {machine.plate || machine.serialNumber || '-'}
                                </div>

                                {/* Bilgiler */}
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                                    {machine.dailyRate && (
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{formatCurrency(machine.dailyRate)}</span>
                                            <span>/gün</span>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#64748b' }}>
                                        <Clock size={12} />
                                        {parseFloat(machine.totalHours).toLocaleString('tr-TR')} saat
                                    </div>
                                </div>

                                {/* Aktif Kiralama */}
                                {activeRental && (
                                    <div style={{
                                        padding: '0.5rem 0.625rem',
                                        borderRadius: '0.375rem',
                                        background: '#dbeafe',
                                        fontSize: '0.75rem',
                                        color: '#1e40af',
                                        fontWeight: 500,
                                        marginBottom: '0.5rem',
                                    }}>
                                        📋 {activeRental.customer.companyName}
                                    </div>
                                )}

                                {/* Uyarılar */}
                                {expired && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.375rem',
                                        fontSize: '0.6875rem',
                                        color: '#dc2626',
                                        fontWeight: 500,
                                    }}>
                                        <AlertCircle size={12} />
                                        Belge süresi dolmuş
                                    </div>
                                )}
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
