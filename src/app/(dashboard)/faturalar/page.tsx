'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Receipt, Plus, Download, FileCheck2, Loader2, CheckCircle2 } from 'lucide-react'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from '@/lib/constants'

export default function FaturalarPage() {
    const [invoices, setInvoices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState('')

    const load = () => {
        fetch('/api/faturalar')
            .then((res) => res.json())
            .then((d) => setInvoices(Array.isArray(d) ? d : (d.invoices || [])))
            .catch(console.error)
            .finally(() => setLoading(false))
    }
    useEffect(() => { load() }, [])

    const sendEfatura = async (id: string) => {
        setSending(id)
        const res = await fetch(`/api/faturalar/${id}/efatura`, { method: 'POST' })
        const j = await res.json().catch(() => null)
        setSending('')
        if (j?.result?.mock) {
            alert('e-Fatura MOCK olarak işaretlendi (entegratör env tanımlı değil). Canlıda Nilvera/Paraşüt anahtarı ile gerçek gönderim yapılır.')
        }
        load()
    }

    const efBadge = (s: string) => {
        const map: Record<string, { t: string; c: string; b: string }> = {
            MOCK: { t: 'e-Fatura (test)', c: '#7c3aed', b: '#ede9fe' },
            GONDERILDI: { t: 'GİB: Gönderildi', c: '#2563eb', b: '#dbeafe' },
            KABUL: { t: 'GİB: Kabul', c: '#059669', b: '#d1fae5' },
            RED: { t: 'GİB: Red', c: '#dc2626', b: '#fee2e2' },
            HATA: { t: 'GİB: Hata', c: '#dc2626', b: '#fee2e2' },
        }
        return map[s] || { t: s, c: '#64748b', b: '#f1f5f9' }
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Faturalar</h1>
                    <p className="page-subtitle">{invoices.length} fatura</p>
                </div>
                <Link href="/faturalar/yeni" className="btn btn-primary">
                    <Plus size={18} /> Yeni Fatura
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
                        const eb = inv.efaturaStatus ? efBadge(inv.efaturaStatus) : null
                        return (
                            <div key={inv.id} className="card" style={{ padding: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    <div>
                                        <div style={{ fontSize: '1rem', fontWeight: 700 }}>{inv.invoiceNumber}</div>
                                        <div style={{ fontSize: '0.8125rem', color: '#334155', fontWeight: 600, marginTop: '0.125rem' }}>🏢 {inv.customer?.companyName}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                                            Düzenleme: {formatDate(inv.issueDate)} · Vade: {formatDate(inv.dueDate)}
                                            {inv.efaturaEttn && <> · ETTN: {String(inv.efaturaEttn).slice(0, 8)}…</>}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{formatCurrency(inv.totalAmount)}</div>
                                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                                            <span className={cn('badge', statusColor?.bg, statusColor?.text)} style={{ fontSize: '0.6875rem' }}>
                                                {INVOICE_STATUS_LABELS[inv.status as keyof typeof INVOICE_STATUS_LABELS]}
                                            </span>
                                            {eb && <span className="badge" style={{ fontSize: '0.6875rem', background: eb.b, color: eb.c }}>{eb.t}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.875rem', flexWrap: 'wrap' }}>
                                    <a className="btn btn-sm btn-outline" href={`/api/faturalar/${inv.id}/pdf`} target="_blank" rel="noopener"><Download size={14} /> PDF</a>
                                    {!inv.efaturaStatus || inv.efaturaStatus === 'HATA' ? (
                                        <button className="btn btn-sm btn-primary" disabled={sending === inv.id} onClick={() => sendEfatura(inv.id)}>
                                            {sending === inv.id ? <><Loader2 size={14} className="spin" /> Gönderiliyor…</> : <><FileCheck2 size={14} /> GİB&apos;e Gönder</>}
                                        </button>
                                    ) : (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>
                                            <CheckCircle2 size={14} /> e-Belge gönderildi
                                        </span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
