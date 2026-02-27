'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function MusteriDuzenlePage() {
    const router = useRouter()
    const { id } = useParams()
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState<any>({})

    useEffect(() => {
        fetch(`/api/musteriler/${id}`)
            .then(r => r.json())
            .then((data) => {
                setForm({
                    companyName: data.companyName || '',
                    contactPerson: data.contactPerson || '',
                    phone: data.phone || '',
                    email: data.email || '',
                    taxNumber: data.taxNumber || '',
                    taxOffice: data.taxOffice || '',
                    address: data.address || '',
                    isBlacklisted: data.isBlacklisted || false,
                    notes: data.notes || '',
                })
            })
            .catch(() => setError('Müşteri bulunamadı'))
            .finally(() => setLoading(false))
    }, [id])

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        const { name, value, type } = e.target
        setForm({ ...form, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value })
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        setError('')

        try {
            const res = await fetch(`/api/musteriler/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            if (!res.ok) throw new Error((await res.json()).error)
            router.push(`/musteriler/${id}`)
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}><div className="spinner" /></div>

    return (
        <div style={{ maxWidth: '40rem', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Link href={`/musteriler/${id}`} className="btn btn-ghost btn-icon btn-sm"><ArrowLeft size={18} /></Link>
                <div>
                    <h1 className="page-title">Müşteri Düzenle</h1>
                    <p className="page-subtitle">{form.companyName}</p>
                </div>
            </div>

            {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>Firma Bilgileri</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label className="label">Firma Adı *</label>
                            <input name="companyName" className="input" required value={form.companyName} onChange={handleChange} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div><label className="label">Yetkili Kişi</label><input name="contactPerson" className="input" value={form.contactPerson} onChange={handleChange} /></div>
                            <div><label className="label">Telefon</label><input name="phone" className="input" value={form.phone} onChange={handleChange} /></div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div><label className="label">E-posta</label><input name="email" type="email" className="input" value={form.email} onChange={handleChange} /></div>
                            <div><label className="label">Adres</label><input name="address" className="input" value={form.address} onChange={handleChange} /></div>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>Vergi Bilgileri</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div><label className="label">Vergi No</label><input name="taxNumber" className="input" value={form.taxNumber} onChange={handleChange} /></div>
                        <div><label className="label">Vergi Dairesi</label><input name="taxOffice" className="input" value={form.taxOffice} onChange={handleChange} /></div>
                    </div>
                </div>

                <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertTriangle size={16} color="#dc2626" />
                            <span style={{ fontWeight: 600 }}>Kara Liste</span>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                name="isBlacklisted"
                                checked={form.isBlacklisted}
                                onChange={handleChange}
                                style={{ width: '1.125rem', height: '1.125rem', accentColor: '#dc2626' }}
                            />
                            <span style={{ fontSize: '0.8125rem', color: form.isBlacklisted ? '#dc2626' : '#64748b' }}>
                                {form.isBlacklisted ? 'Kara listede' : 'Kara listede değil'}
                            </span>
                        </label>
                    </div>
                </div>

                <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <label className="label">Notlar</label>
                    <textarea name="notes" className="input" rows={3} value={form.notes} onChange={handleChange} style={{ resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <Link href={`/musteriler/${id}`} className="btn btn-outline">İptal</Link>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Kaydediliyor...' : <><Save size={18} />Değişiklikleri Kaydet</>}
                    </button>
                </div>
            </form>
        </div>
    )
}
