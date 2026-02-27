'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { MACHINE_TYPE_LABELS } from '@/lib/constants'

export default function YeniOperatorPage() {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [selectedTypes, setSelectedTypes] = useState<string[]>([])

    function toggleType(type: string) {
        setSelectedTypes((prev) =>
            prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
        )
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setSaving(true)
        setError('')

        const form = new FormData(e.currentTarget)
        const data = {
            name: form.get('name'),
            tcNumber: form.get('tcNumber'),
            phone: form.get('phone'),
            licenseClass: form.get('licenseClass'),
            licenseExpiry: form.get('licenseExpiry'),
            dailyWage: form.get('dailyWage'),
            machineTypes: selectedTypes,
            notes: form.get('notes'),
        }

        try {
            const res = await fetch('/api/operatorler', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error((await res.json()).error)
            router.push('/operatorler')
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
                <Link href="/operatorler" className="btn btn-ghost btn-icon btn-sm"><ArrowLeft size={18} /></Link>
                <div>
                    <h1 className="page-title">Yeni Operatör Ekle</h1>
                    <p className="page-subtitle">Filonuza yeni bir operatör ekleyin</p>
                </div>
            </div>

            {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>Kişisel Bilgiler</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div>
                            <label className="label">Ad Soyad *</label>
                            <input name="name" className="input" placeholder="Ad Soyad" required />
                        </div>
                        <div>
                            <label className="label">TC Kimlik No</label>
                            <input name="tcNumber" className="input" placeholder="12345678901" maxLength={11} />
                        </div>
                        <div>
                            <label className="label">Telefon</label>
                            <input name="phone" className="input" placeholder="0555 000 00 00" />
                        </div>
                        <div>
                            <label className="label">Günlük Ücret (₺)</label>
                            <input name="dailyWage" type="number" className="input" placeholder="0" step="0.01" />
                        </div>
                    </div>
                </div>

                <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>Ehliyet Bilgileri</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div>
                            <label className="label">Ehliyet Sınıfı</label>
                            <select name="licenseClass" className="input select">
                                <option value="">Seçin...</option>
                                <option value="B">B</option>
                                <option value="B2">B2</option>
                                <option value="C">C</option>
                                <option value="D">D</option>
                                <option value="E">E</option>
                                <option value="G">G (İş Makinesi)</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Ehliyet Bitiş Tarihi</label>
                            <input name="licenseExpiry" type="date" className="input" />
                        </div>
                    </div>
                </div>

                <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>Kullanabildiği Makine Tipleri</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {Object.entries(MACHINE_TYPE_LABELS).map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => toggleType(key)}
                                style={{
                                    padding: '0.5rem 0.875rem',
                                    borderRadius: '9999px',
                                    border: '1px solid',
                                    borderColor: selectedTypes.includes(key) ? '#2563eb' : '#e2e8f0',
                                    background: selectedTypes.includes(key) ? '#dbeafe' : '#fff',
                                    color: selectedTypes.includes(key) ? '#1e40af' : '#64748b',
                                    fontSize: '0.8125rem',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                }}
                            >
                                {selectedTypes.includes(key) ? '✓ ' : ''}{label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>Notlar</h3>
                    <textarea name="notes" className="input" rows={3} placeholder="Ek bilgiler..." style={{ resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <Link href="/operatorler" className="btn btn-outline">İptal</Link>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? <><div className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} />Kaydediliyor...</> : <><Save size={18} />Kaydet</>}
                    </button>
                </div>
            </form>
        </div>
    )
}
