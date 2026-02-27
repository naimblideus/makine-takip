'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { PAYMENT_METHOD_LABELS } from '@/lib/constants'

export default function YeniOdemePage() {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [customers, setCustomers] = useState<any[]>([])
    const [invoices, setInvoices] = useState<any[]>([])
    const [selectedCustomer, setSelectedCustomer] = useState('')

    useEffect(() => {
        fetch('/api/musteriler').then(r => r.json()).then(setCustomers)
        fetch('/api/faturalar').then(r => r.json()).then(setInvoices)
    }, [])

    const customerInvoices = invoices.filter((inv: any) => inv.customerId === selectedCustomer)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setSaving(true)
        setError('')

        const form = new FormData(e.currentTarget)
        const data = Object.fromEntries(form)

        try {
            const res = await fetch('/api/odemeler', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error((await res.json()).error)
            router.push('/odemeler')
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div style={{ maxWidth: '36rem', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Link href="/odemeler" className="btn btn-ghost btn-icon btn-sm"><ArrowLeft size={18} /></Link>
                <div>
                    <h1 className="page-title">Ödeme Kaydet</h1>
                    <p className="page-subtitle">Müşteriden alınan ödemeyi kaydedin</p>
                </div>
            </div>

            {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label className="label">Müşteri *</label>
                            <select
                                name="customerId"
                                className="input select"
                                required
                                value={selectedCustomer}
                                onChange={(e) => setSelectedCustomer(e.target.value)}
                            >
                                <option value="">Müşteri seçin...</option>
                                {customers.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.companyName}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="label">İlgili Fatura</label>
                            <select name="invoiceId" className="input select">
                                <option value="">Fatura seçin (opsiyonel)...</option>
                                {customerInvoices.map((inv: any) => (
                                    <option key={inv.id} value={inv.id}>
                                        {inv.invoiceNumber} — ₺{Number(inv.totalAmount).toLocaleString('tr-TR')}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="label">Tutar (₺) *</label>
                                <input name="amount" type="number" className="input" required step="0.01" placeholder="0" style={{ fontSize: '1.125rem', fontWeight: 600 }} />
                            </div>
                            <div>
                                <label className="label">Ödeme Yöntemi *</label>
                                <select name="method" className="input select" required>
                                    {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="label">Ödeme Tarihi *</label>
                            <input name="paidAt" type="date" className="input" required defaultValue={new Date().toISOString().split('T')[0]} />
                        </div>
                        <div>
                            <label className="label">Not</label>
                            <textarea name="notes" className="input" rows={2} placeholder="Ek bilgi..." style={{ resize: 'vertical' }} />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <Link href="/odemeler" className="btn btn-outline">İptal</Link>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Kaydediliyor...' : <><CreditCard size={18} />Ödemeyi Kaydet</>}
                    </button>
                </div>
            </form>
        </div>
    )
}
