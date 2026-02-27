'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, CalendarRange, Download } from 'lucide-react'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import {
    RENTAL_STATUS_LABELS,
    RENTAL_STATUS_COLORS,
    RENTAL_PERIOD_LABELS,
    MACHINE_TYPE_LABELS,
} from '@/lib/constants'

interface Rental {
    id: string
    status: string
    periodType: string
    unitPrice: string
    operatorIncluded: boolean
    startDate: string
    endDate: string | null
    deposit: string | null
    machine: { brand: string; model: string; plate: string | null; type: string }
    customer: { companyName: string; contactPerson: string | null; phone: string | null }
    operator: { name: string; phone: string | null } | null
    site: { name: string; address: string | null } | null
}

const statusFilters = [
    { value: 'all', label: 'Tümü' },
    { value: 'AKTIF', label: 'Aktif', dot: 'bg-blue-500' },
    { value: 'TAMAMLANDI', label: 'Tamamlandı', dot: 'bg-emerald-500' },
    { value: 'IPTAL', label: 'İptal', dot: 'bg-red-500' },
]

export default function KiralamalarPage() {
    const [rentals, setRentals] = useState<Rental[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('all')
    const [search, setSearch] = useState('')

    useEffect(() => {
        setLoading(true)
        const params = new URLSearchParams()
        if (statusFilter !== 'all') params.set('status', statusFilter)
        if (search) params.set('search', search)

        fetch(`/api/kiralamalar?${params}`)
            .then((res) => res.json())
            .then(setRentals)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [statusFilter, search])

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Kiralamalar</h1>
                    <p className="page-subtitle">{rentals.length} kiralama</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <a href="/api/export/kiralamalar" download className="btn btn-outline btn-sm" style={{ textDecoration: 'none' }}>
                        <Download size={16} />
                        Excel
                    </a>
                    <Link href="/kiralamalar/yeni" className="btn btn-primary">
                        <Plus size={18} />
                        Yeni Kiralama
                    </Link>
                </div>
            </div>

            {/* Filtreler */}
            <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ position: 'relative', maxWidth: '24rem' }}>
                    <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        className="input"
                        placeholder="Makine veya müşteri ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: '2.5rem' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {statusFilters.map((f) => (
                        <button
                            key={f.value}
                            className={cn('filter-chip', statusFilter === f.value && 'filter-chip-active')}
                            onClick={() => setStatusFilter(f.value)}
                        >
                            {f.dot && <span className={cn('badge-dot', f.dot)} style={{ width: '0.5rem', height: '0.5rem' }} />}
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '30vh' }}>
                    <div className="spinner" />
                </div>
            )}

            {!loading && rentals.length === 0 && (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon"><CalendarRange size={28} /></div>
                        <div className="empty-state-title">Kiralama bulunamadı</div>
                        <div className="empty-state-text">{search || statusFilter !== 'all' ? 'Filtre kriterine uygun kiralama yok' : 'İlk kiralamanızı oluşturun'}</div>
                    </div>
                </div>
            )}

            {!loading && rentals.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {rentals.map((rental) => {
                        const statusColor = RENTAL_STATUS_COLORS[rental.status as keyof typeof RENTAL_STATUS_COLORS]
                        const dayCount = rental.endDate
                            ? Math.ceil((new Date(rental.endDate).getTime() - new Date(rental.startDate).getTime()) / 86400000)
                            : Math.ceil((Date.now() - new Date(rental.startDate).getTime()) / 86400000)

                        return (
                            <Link
                                key={rental.id}
                                href={`/kiralamalar/${rental.id}`}
                                className="card card-interactive"
                                style={{ padding: '1.25rem', textDecoration: 'none', color: 'inherit', display: 'block' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                                    {/* Sol: Makine + Müşteri */}
                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
                                            <div style={{ fontSize: '1rem', fontWeight: 700 }}>
                                                {rental.machine.brand} {rental.machine.model}
                                            </div>
                                            <span className={cn('badge', statusColor?.bg, statusColor?.text)} style={{ fontSize: '0.6875rem' }}>
                                                <span className={cn('badge-dot', statusColor?.dot)} />
                                                {RENTAL_STATUS_LABELS[rental.status as keyof typeof RENTAL_STATUS_LABELS]}
                                            </span>
                                        </div>
                                        {rental.machine.plate && (
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '0.125rem 0.5rem',
                                                borderRadius: '0.25rem',
                                                background: '#f1f5f9',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                marginBottom: '0.375rem',
                                            }}>
                                                {rental.machine.plate}
                                            </span>
                                        )}
                                        <div style={{ fontSize: '0.8125rem', color: '#334155', fontWeight: 600, marginTop: '0.25rem' }}>
                                            🏢 {rental.customer.companyName}
                                        </div>
                                        {rental.site && (
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem' }}>
                                                📍 {rental.site.name}
                                            </div>
                                        )}
                                        {rental.operator && (
                                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem' }}>
                                                👷 {rental.operator.name}
                                            </div>
                                        )}
                                    </div>

                                    {/* Sağ: Fiyat + Tarihler */}
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a' }}>
                                            {formatCurrency(rental.unitPrice)}
                                        </div>
                                        <div style={{ fontSize: '0.6875rem', color: '#94a3b8', fontWeight: 500 }}>
                                            {RENTAL_PERIOD_LABELS[rental.periodType as keyof typeof RENTAL_PERIOD_LABELS]}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                                            {formatDate(rental.startDate)}
                                            {rental.endDate && ` → ${formatDate(rental.endDate)}`}
                                        </div>
                                        <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: '0.125rem' }}>
                                            {dayCount} gün
                                        </div>
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
