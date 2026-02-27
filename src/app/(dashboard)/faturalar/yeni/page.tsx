'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileText } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

export default function YeniFaturaPage() {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [customers, setCustomers] = useState<any[]>([])
    const [rentals, setRentals] = useState<any[]>([])
    const [selectedCustomer, setSelectedCustomer] = useState('')

    const [subtotal, setSubtotal] = useState('')
    const [taxRate, setTaxRate] = useState('20')

    const taxAmount = subtotal ? (parseFloat(subtotal) * parseFloat(taxRate || '0')) / 100 : 0
    const totalAmount = subtotal ? parseFloat(subtotal) + taxAmount : 0

    useEffect(() => {
        fetch('/api/musteriler').then(r => r.json()).then(setCustomers)
    }, [])

    useEffect(() => {
        if (selectedCustomer) {
            fetch(`/api/kiralamalar?status=AKTIF`)
                .then(r => r.json())
                .then((all: any[]) => setRentals(all.filter(r => r.customer?.companyName)))
                .catch(() => setRentals([]))
        }
    }, [selectedCustomer])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setSaving(true)
        setError('')

        const form = new FormData(e.currentTarget)
        const data = {
            customerId: form.get('customerId'),
            rentalId: form.get('rentalId') || null,
            issueDate: form.get('issueDate'),
            dueDate: form.get('dueDate'),
            subtotal,
            taxRate,
            taxAmount: taxAmount.toFixed(2),
            totalAmount: totalAmount.toFixed(2),
            notes: form.get('notes'),
        }

        try {
            const res = await fetch('/api/faturalar/olustur', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error((await res.json()).error)
            router.push('/faturalar')
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div style={{ maxWidth: '40rem', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Link href="/faturalar" className="btn btn-ghost btn-icon btn-sm"><ArrowLeft size={18} /></Link>
                <div>
                    <h1 className="page-title">Yeni Fatura</h1>
                    <p className="page-subtitle">Fatura taslağı oluşturun</p>
                </div>
            </div>

            {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>Fatura Bilgileri</h3>
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
                            <label className="label">İlgili Kiralama</label>
                            <select name="rentalId" className="input select">
                                <option value="">Opsiyonel...</option>
                                {rentals.map((r: any) => (
                                    <option key={r.id} value={r.id}>
                                        {r.machine?.brand} {r.machine?.model} — {r.customer?.companyName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="label">Düzenleme Tarihi *</label>
                                <input name="issueDate" type="date" className="input" required defaultValue={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div>
                                <label className="label">Vade Tarihi *</label>
                                <input name="dueDate" type="date" className="input" required defaultValue={new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>Tutar</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label className="label">Ara Toplam (₺) *</label>
                            <input
                                type="number"
                                className="input"
                                required
                                step="0.01"
                                value={subtotal}
                                onChange={(e) => setSubtotal(e.target.value)}
                                placeholder="0"
                                style={{ fontSize: '1.125rem', fontWeight: 600 }}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="label">KDV Oranı (%)</label>
                                <select className="input select" value={taxRate} onChange={(e) => setTaxRate(e.target.value)}>
                                    <option value="0">%0</option>
                                    <option value="1">%1</option>
                                    <option value="10">%10</option>
                                    <option value="20">%20</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">KDV Tutarı</label>
                                <div style={{ padding: '0.625rem', background: '#f8fafc', borderRadius: '0.5rem', fontWeight: 600 }}>
                                    {formatCurrency(taxAmount)}
                                </div>
                            </div>
                        </div>
                        {/* Toplam */}
                        <div style={{ padding: '1rem', borderRadius: '0.75rem', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: '#fff', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.6875rem', opacity: 0.8, marginBottom: '0.25rem' }}>GENEL TOPLAM</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{formatCurrency(totalAmount)}</div>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <label className="label">Notlar</label>
                    <textarea name="notes" className="input" rows={2} placeholder="Fatura notu..." style={{ resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <Link href="/faturalar" className="btn btn-outline">İptal</Link>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Oluşturuluyor...' : <><FileText size={18} />Fatura Oluştur</>}
                    </button>
                </div>
            </form>
        </div>
    )
}
