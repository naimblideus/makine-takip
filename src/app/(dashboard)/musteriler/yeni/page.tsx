'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function YeniMusteriPage() {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setSaving(true)
        setError('')

        const form = new FormData(e.currentTarget)
        const data = Object.fromEntries(form)

        try {
            const res = await fetch('/api/musteriler', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error((await res.json()).error)
            router.push('/musteriler')
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Link href="/musteriler" className="btn btn-ghost btn-icon btn-sm"><ArrowLeft size={18} /></Link>
                <div>
                    <h1 className="page-title">Yeni Müşteri Ekle</h1>
                    <p className="page-subtitle">Yeni bir müşteri kaydı oluşturun</p>
                </div>
            </div>

            {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>Firma Bilgileri</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label className="label">Firma Adı *</label>
                            <input name="companyName" className="input" placeholder="Firma adı" required />
                        </div>
                        <div>
                            <label className="label">Yetkili Kişi</label>
                            <input name="contactPerson" className="input" placeholder="Ad Soyad" />
                        </div>
                        <div>
                            <label className="label">Telefon</label>
                            <input name="phone" className="input" placeholder="0532 000 00 00" />
                        </div>
                        <div>
                            <label className="label">E-posta</label>
                            <input name="email" type="email" className="input" placeholder="info@firma.com" />
                        </div>
                        <div>
                            <label className="label">Adres</label>
                            <input name="address" className="input" placeholder="Firma adresi" />
                        </div>
                    </div>
                </div>

                <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>Vergi Bilgileri</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div>
                            <label className="label">Vergi Dairesi</label>
                            <input name="taxOffice" className="input" placeholder="Vergi dairesi" />
                        </div>
                        <div>
                            <label className="label">Vergi / TC No</label>
                            <input name="taxNumber" className="input" placeholder="1234567890" />
                        </div>
                    </div>
                </div>

                <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>Notlar</h3>
                    <textarea name="notes" className="input" rows={3} placeholder="Ek notlar..." style={{ resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <Link href="/musteriler" className="btn btn-outline">İptal</Link>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? <><div className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} />Kaydediliyor...</> : <><Save size={18} />Kaydet</>}
                    </button>
                </div>
            </form>
        </div>
    )
}
