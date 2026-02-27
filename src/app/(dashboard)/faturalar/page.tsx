'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Receipt, Plus } from 'lucide-react'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from '@/lib/constants'

export default function FaturalarPage() {
    const [invoices, setInvoices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/faturalar')
            .then((res) => res.json())
            .then(setInvoices)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Faturalar</h1>
                    <p className="page-subtitle">{invoices.length} fatura</p>
                </div>
                <Link href="/faturalar/yeni" className="btn btn-primary">
                    <Plus size={18} />
                    Yeni Fatura
                </Link>
            </div>

            {loading && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '30vh' }}><div className="spinner" /></div>}

            {!loading && invoices.length === 0 && (
                <div className="card"><div className="empty-state"><div className="empty-state-icon"><Receipt size={28} /></div><div className="empty-state-title">Fatura yok</div></div></div>
            )}

            {!loading && invoices.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {invoices.map((inv: any) => {
                        const statusColor = INVOICE_STATUS_COLORS[inv.status as keyof typeof INVOICE_STATUS_COLORS]
                        return (
                            <div key={inv.id} className="card" style={{ padding: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    <div>
                                        <div style={{ fontSize: '1rem', fontWeight: 700 }}>{inv.invoiceNumber}</div>
                                        <div style={{ fontSize: '0.8125rem', color: '#334155', fontWeight: 600, marginTop: '0.125rem' }}>🏢 {inv.customer?.companyName}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                                            Düzenleme: {formatDate(inv.issueDate)} · Vade: {formatDate(inv.dueDate)}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{formatCurrency(inv.totalAmount)}</div>
                                        <span className={cn('badge', statusColor?.bg, statusColor?.text)} style={{ fontSize: '0.6875rem', marginTop: '0.25rem' }}>
                                            {INVOICE_STATUS_LABELS[inv.status as keyof typeof INVOICE_STATUS_LABELS]}
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
