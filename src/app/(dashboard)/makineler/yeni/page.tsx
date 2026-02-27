'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { MACHINE_TYPE_LABELS } from '@/lib/constants'

export default function YeniMakinePage() {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setSaving(true)
        setError('')

        const form = new FormData(e.currentTarget)
        const data = {
            plate: form.get('plate'),
            serialNumber: form.get('serialNumber'),
            brand: form.get('brand'),
            model: form.get('model'),
            year: form.get('year'),
            type: form.get('type'),
            dailyRate: form.get('dailyRate'),
            weeklyRate: form.get('weeklyRate'),
            monthlyRate: form.get('monthlyRate'),
            hourlyRate: form.get('hourlyRate'),
            operatorIncRate: form.get('operatorIncRate'),
            totalHours: form.get('totalHours'),
            insuranceExpiry: form.get('insuranceExpiry'),
            inspectionExpiry: form.get('inspectionExpiry'),
            notes: form.get('notes'),
        }

        try {
            const res = await fetch('/api/makineler', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Bir hata oluştu')
            }

            router.push('/makineler')
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
            {/* Başlık */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Link href="/makineler" className="btn btn-ghost btn-icon btn-sm">
                    <ArrowLeft size={18} />
                </Link>
                <div>
                    <h1 className="page-title">Yeni Makine Ekle</h1>
                    <p className="page-subtitle">Filonuza yeni bir makine ekleyin</p>
                </div>
            </div>

            {error && (
                <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Kimlik Bilgileri */}
                <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>Kimlik Bilgileri</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div>
                            <label className="label">Marka *</label>
                            <input name="brand" className="input" placeholder="CAT, Komatsu, Volvo..." required />
                        </div>
                        <div>
                            <label className="label">Model *</label>
                            <input name="model" className="input" placeholder="320F, PC200..." required />
                        </div>
                        <div>
                            <label className="label">Tip *</label>
                            <select name="type" className="input select" required>
                                <option value="">Seçin...</option>
                                {Object.entries(MACHINE_TYPE_LABELS).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="label">Yıl</label>
                            <input name="year" type="number" className="input" placeholder="2023" min="1990" max="2030" />
                        </div>
                        <div>
                            <label className="label">Plaka</label>
                            <input name="plate" className="input" placeholder="06 MK 001" />
                        </div>
                        <div>
                            <label className="label">Seri No</label>
                            <input name="serialNumber" className="input" placeholder="Plakası yoksa seri no" />
                        </div>
                    </div>
                </div>

                {/* Fiyatlar */}
                <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>Fiyatlar (₺)</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                        <div>
                            <label className="label">Saatlik</label>
                            <input name="hourlyRate" type="number" className="input" placeholder="0" step="0.01" />
                        </div>
                        <div>
                            <label className="label">Günlük</label>
                            <input name="dailyRate" type="number" className="input" placeholder="0" step="0.01" />
                        </div>
                        <div>
                            <label className="label">Haftalık</label>
                            <input name="weeklyRate" type="number" className="input" placeholder="0" step="0.01" />
                        </div>
                        <div>
                            <label className="label">Aylık</label>
                            <input name="monthlyRate" type="number" className="input" placeholder="0" step="0.01" />
                        </div>
                        <div>
                            <label className="label">Operatör Dahil Fark</label>
                            <input name="operatorIncRate" type="number" className="input" placeholder="0" step="0.01" />
                        </div>
                    </div>
                </div>

                {/* Belgeler & Sayaç */}
                <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>Belgeler & Sayaç</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div>
                            <label className="label">Sigorta Bitiş Tarihi</label>
                            <input name="insuranceExpiry" type="date" className="input" />
                        </div>
                        <div>
                            <label className="label">Muayene Bitiş Tarihi</label>
                            <input name="inspectionExpiry" type="date" className="input" />
                        </div>
                        <div>
                            <label className="label">Toplam Çalışma Saati</label>
                            <input name="totalHours" type="number" className="input" placeholder="0" step="0.1" />
                        </div>
                    </div>
                </div>

                {/* Notlar */}
                <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>Notlar</h3>
                    <textarea name="notes" className="input" rows={3} placeholder="Ek bilgiler..." style={{ resize: 'vertical' }} />
                </div>

                {/* Kaydet */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <Link href="/makineler" className="btn btn-outline">İptal</Link>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? (
                            <>
                                <div className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} />
                                Kaydediliyor...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Kaydet
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
