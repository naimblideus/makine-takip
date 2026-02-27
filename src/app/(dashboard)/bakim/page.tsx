'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Wrench, Plus } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { MAINTENANCE_TYPE_LABELS } from '@/lib/constants'

export default function BakimPage() {
    const [records, setRecords] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/bakim')
            .then((res) => res.json())
            .then(setRecords)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Bakım Takibi</h1>
                    <p className="page-subtitle">{records.length} kayıt</p>
                </div>
                <Link href="/bakim/yeni" className="btn btn-primary">
                    <Plus size={18} />
                    Yeni Kayıt
                </Link>
            </div>

            {loading && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '30vh' }}><div className="spinner" /></div>}

            {!loading && records.length === 0 && (
                <div className="card"><div className="empty-state"><div className="empty-state-icon"><Wrench size={28} /></div><div className="empty-state-title">Bakım kaydı yok</div></div></div>
            )}

            {!loading && records.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {records.map((r: any) => (
                        <div key={r.id} className="card" style={{ padding: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                                <div>
                                    <div style={{ fontSize: '1rem', fontWeight: 700 }}>
                                        {r.machine?.brand} {r.machine?.model}
                                        <span style={{ color: '#94a3b8', fontWeight: 400, marginLeft: '0.5rem', fontSize: '0.8125rem' }}>{r.machine?.plate}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.375rem', flexWrap: 'wrap' }}>
                                        <span className="badge bg-amber-50 text-amber-700" style={{ fontSize: '0.6875rem' }}>
                                            {MAINTENANCE_TYPE_LABELS[r.type as keyof typeof MAINTENANCE_TYPE_LABELS] || r.type}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{formatDate(r.performedAt)}</span>
                                    </div>
                                    {r.description && <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.5rem', lineHeight: 1.5 }}>{r.description}</p>}
                                    {r.parts && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Parçalar: {r.parts}</div>}
                                    {r.serviceName && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Servis: {r.serviceName}</div>}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    {r.cost && <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>{formatCurrency(r.cost)}</div>}
                                    {r.machineHoursAt && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{r.machineHoursAt} saat</div>}
                                </div>
                            </div>
                            {r.nextMaintenanceDate && (
                                <div style={{ marginTop: '0.75rem', padding: '0.5rem', borderRadius: '0.375rem', background: '#fef3c7', fontSize: '0.75rem', color: '#92400e' }}>
                                    ⏰ Sonraki bakım: {formatDate(r.nextMaintenanceDate)} {r.nextMaintenanceHours ? `(${r.nextMaintenanceHours} saat)` : ''}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
