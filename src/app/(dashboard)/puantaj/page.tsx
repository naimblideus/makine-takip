'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ClipboardList, Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { TIMESHEET_TYPE_LABELS } from '@/lib/constants'

export default function PuantajPage() {
    const [entries, setEntries] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/puantaj')
            .then((res) => res.json())
            .then(setEntries)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Puantaj</h1>
                    <p className="page-subtitle">{entries.length} kayıt</p>
                </div>
                <Link href="/puantaj/yeni" className="btn btn-primary">
                    <Plus size={18} />
                    Yeni Giriş
                </Link>
            </div>

            {loading && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '30vh' }}><div className="spinner" /></div>}

            {!loading && entries.length === 0 && (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon"><ClipboardList size={28} /></div>
                        <div className="empty-state-title">Puantaj kaydı yok</div>
                        <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>Operatör çalışma saatlerini kaydedin</p>
                    </div>
                </div>
            )}

            {!loading && entries.length > 0 && (
                <div className="card" style={{ overflow: 'auto' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Tarih</th>
                                <th>Operatör</th>
                                <th>Makine</th>
                                <th>Müşteri</th>
                                <th>Saat</th>
                                <th>Tip</th>
                                <th>Not</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((e: any) => (
                                <tr key={e.id}>
                                    <td>{formatDate(e.date)}</td>
                                    <td><strong>{e.operator?.name}</strong></td>
                                    <td>
                                        {e.rental?.machine?.brand} {e.rental?.machine?.model}
                                        <br />
                                        <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>{e.rental?.machine?.plate}</span>
                                    </td>
                                    <td style={{ fontSize: '0.8125rem' }}>{e.rental?.customer?.companyName || '-'}</td>
                                    <td style={{ fontWeight: 700 }}>{parseFloat(e.hoursWorked)} saat</td>
                                    <td>
                                        <span className={`badge ${e.type === 'FAZLA_MESAI' ? 'bg-amber-50 text-amber-700' : e.type === 'RESMI_TATIL' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`} style={{ fontSize: '0.6875rem' }}>
                                            {TIMESHEET_TYPE_LABELS[e.type as keyof typeof TIMESHEET_TYPE_LABELS] || e.type}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.notes || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
