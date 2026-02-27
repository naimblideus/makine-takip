'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function YeniSantiyePage() {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [customers, setCustomers] = useState<any[]>([])

    useEffect(() => {
        fetch('/api/musteriler').then(r => r.json()).then(setCustomers)
    }, [])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setSaving(true)
        setError('')

        const form = new FormData(e.currentTarget)
        const data = Object.fromEntries(form)

        try {
            const res = await fetch('/api/santiyeler/olustur', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error((await res.json()).error)
            router.push('/santiyeler')
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
                <Link href="/santiyeler" className="btn btn-ghost btn-icon btn-sm"><ArrowLeft size={18} /></Link>
                <div>
                    <h1 className="page-title">Yeni Şantiye</h1>
                    <p className="page-subtitle">Müşteriye ait bir şantiye ekleyin</p>
                </div>
            </div>

            {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label className="label">Müşteri *</label>
                            <select name="customerId" className="input select" required>
                                <option value="">Müşteri seçin...</option>
                                {customers.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.companyName}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="label">Şantiye Adı *</label>
                            <input name="name" className="input" required placeholder="Şantiye adı" />
                        </div>
                        <div>
                            <label className="label">Adres</label>
                            <input name="address" className="input" placeholder="Şantiye adresi" />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="label">Yetkili Kişi</label>
                                <input name="contactPerson" className="input" placeholder="Ad Soyad" />
                            </div>
                            <div>
                                <label className="label">Yetkili Telefon</label>
                                <input name="contactPhone" className="input" placeholder="0555 000 00 00" />
                            </div>
                        </div>
                        <div>
                            <label className="label">Not</label>
                            <textarea name="notes" className="input" rows={2} placeholder="Ek bilgi..." style={{ resize: 'vertical' }} />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <Link href="/santiyeler" className="btn btn-outline">İptal</Link>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Kaydediliyor...' : <><Save size={18} />Kaydet</>}
                    </button>
                </div>
            </form>
        </div>
    )
}
