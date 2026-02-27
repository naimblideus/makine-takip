'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CreditCard, Plus } from 'lucide-react'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { PAYMENT_METHOD_LABELS } from '@/lib/constants'

const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
    ODENDI: { label: 'Ödendi', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    BEKLIYOR: { label: 'Bekliyor', bg: 'bg-amber-50', text: 'text-amber-700' },
    GECIKTI: { label: 'Gecikti', bg: 'bg-red-50', text: 'text-red-700' },
    IPTAL: { label: 'İptal', bg: 'bg-slate-50', text: 'text-slate-500' },
}

export default function OdemelerPage() {
    const [payments, setPayments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('ALL')

    useEffect(() => {
        fetch('/api/odemeler')
            .then((res) => res.json())
            .then((data) => setPayments(Array.isArray(data) ? data : []))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const filtered = filter === 'ALL' ? payments : payments.filter(p => p.status === filter)
    const totalPaid = payments.filter(p => p.status === 'ODENDI').reduce((s, p) => s + Number(p.amount), 0)

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Ödemeler</h1>
                    <p className="page-subtitle">{payments.length} kayıt · Toplam tahsilat: <strong>{formatCurrency(totalPaid)}</strong></p>
                </div>
                <Link href="/odemeler/yeni" className="btn btn-primary">
                    <Plus size={18} />
                    Ödeme Kaydet
                </Link>
            </div>

            {/* Filtre */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {[
                    { key: 'ALL', label: 'Tümü' },
                    { key: 'ODENDI', label: '✅ Ödendi' },
                    { key: 'BEKLIYOR', label: '⏳ Bekliyor' },
                    { key: 'GECIKTI', label: '🔴 Gecikti' },
                ].map((f) => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={cn('filter-chip', filter === f.key && 'filter-chip-active')}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {loading && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '30vh' }}><div className="spinner" /></div>}

            {!loading && filtered.length === 0 && (
                <div className="card"><div className="empty-state"><div className="empty-state-icon"><CreditCard size={28} /></div><div className="empty-state-title">Ödeme kaydı yok</div></div></div>
            )}

            {!loading && filtered.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filtered.map((p: any) => {
                        const st = STATUS_MAP[p.status] || STATUS_MAP.BEKLIYOR
                        return (
                            <div key={p.id} className="card" style={{ padding: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    <div>
                                        <div style={{ fontSize: '1rem', fontWeight: 700 }}>{p.customer?.companyName}</div>
                                        {p.invoice && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem' }}>Fatura: {p.invoice.invoiceNumber}</div>}
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.375rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                            <span className="badge bg-slate-50 text-slate-600" style={{ fontSize: '0.6875rem' }}>
                                                {PAYMENT_METHOD_LABELS[p.method as keyof typeof PAYMENT_METHOD_LABELS] || p.method}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                {p.paidAt ? formatDate(p.paidAt) : 'Ödenmedi'}
                                            </span>
                                        </div>
                                        {p.notes && <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.375rem' }}>{p.notes}</p>}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{formatCurrency(p.amount)}</div>
                                        <span className={cn('badge', st.bg, st.text)} style={{ fontSize: '0.6875rem', marginTop: '0.25rem' }}>
                                            {st.label}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
