'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, HardHat, Phone } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { MACHINE_TYPE_LABELS } from '@/lib/constants'

interface Operator {
    id: string
    name: string
    phone: string | null
    tcNumber: string | null
    licenseClass: string | null
    machineTypes: string[]
    dailyWage: string | null
    isActive: boolean
    rentals: {
        machine: { brand: string; model: string }
        customer: { companyName: string }
    }[]
    _count: { timesheets: number }
}

export default function OperatorlerPage() {
    const [operators, setOperators] = useState<Operator[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        const params = new URLSearchParams()
        if (search) params.set('search', search)

        fetch(`/api/operatorler?${params}`)
            .then((res) => res.json())
            .then(setOperators)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [search])

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Operatörler</h1>
                    <p className="page-subtitle">{operators.length} operatör</p>
                </div>
                <Link href="/operatorler/yeni" className="btn btn-primary">
                    <Plus size={18} />
                    Yeni Operatör
                </Link>
            </div>

            <div style={{ position: 'relative', maxWidth: '24rem', marginBottom: '1.25rem' }}>
                <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                    type="text"
                    className="input"
                    placeholder="İsim, telefon veya TC ara..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                />
            </div>

            {loading && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '30vh' }}>
                    <div className="spinner" />
                </div>
            )}

            {!loading && operators.length === 0 && (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon"><HardHat size={28} /></div>
                        <div className="empty-state-title">Operatör bulunamadı</div>
                        <div className="empty-state-text">{search ? 'Arama kriterine uygun operatör yok' : 'İlk operatörünüzü ekleyin'}</div>
                    </div>
                </div>
            )}

            {!loading && operators.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                    {operators.map((op) => {
                        const activeRental = op.rentals[0]
                        return (
                            <Link key={op.id} href={`/operatorler/${op.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div className="card" style={{ padding: '1.25rem', cursor: 'pointer', transition: 'box-shadow 0.15s' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                        <div>
                                            <div style={{ fontSize: '1rem', fontWeight: 700 }}>{op.name}</div>
                                            {op.phone && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
                                                    <Phone size={12} />
                                                    {op.phone}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.375rem',
                                            padding: '0.25rem 0.625rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.6875rem',
                                            fontWeight: 600,
                                            background: activeRental ? '#dbeafe' : '#d1fae5',
                                            color: activeRental ? '#1e40af' : '#166534',
                                        }}>
                                            <span style={{
                                                width: '0.375rem',
                                                height: '0.375rem',
                                                borderRadius: '9999px',
                                                background: activeRental ? '#2563eb' : '#16a34a',
                                            }} />
                                            {activeRental ? 'Görevde' : 'Boşta'}
                                        </div>
                                    </div>

                                    {/* Makine tipleri */}
                                    {op.machineTypes.length > 0 && (
                                        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                                            {op.machineTypes.map((t) => (
                                                <span key={t} className="badge bg-slate-100 text-slate-600" style={{ fontSize: '0.6875rem' }}>
                                                    {MACHINE_TYPE_LABELS[t as keyof typeof MACHINE_TYPE_LABELS] || t}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Günlük ücret */}
                                    {op.dailyWage && (
                                        <div style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '0.5rem' }}>
                                            Günlük: <strong style={{ color: '#0f172a' }}>{formatCurrency(op.dailyWage)}</strong>
                                        </div>
                                    )}

                                    {/* Aktif görev */}
                                    {activeRental && (
                                        <div style={{
                                            padding: '0.5rem 0.625rem',
                                            borderRadius: '0.375rem',
                                            background: '#eff6ff',
                                            fontSize: '0.75rem',
                                            color: '#1e40af',
                                        }}>
                                            🚧 {activeRental.machine.brand} {activeRental.machine.model} — {activeRental.customer.companyName}
                                        </div>
                                    )}

                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                                        {op._count.timesheets} puantaj kaydı
                                        {op.licenseClass && ` · Ehliyet: ${op.licenseClass}`}
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
