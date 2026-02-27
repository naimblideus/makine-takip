'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { MACHINE_TYPE_LABELS, MACHINE_STATUS_LABELS } from '@/lib/constants'

export default function MakineDuzenlePage() {
    const router = useRouter()
    const { id } = useParams()
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState<any>({})

    useEffect(() => {
        fetch(`/api/makineler/${id}`)
            .then(r => r.json())
            .then((data) => {
                setForm({
                    brand: data.brand || '',
                    model: data.model || '',
                    serialNumber: data.serialNumber || '',
                    plate: data.plate || '',
                    year: data.year || '',
                    type: data.type || 'EKSAVATOR',
                    status: data.status || 'MUSAIT',
                    dailyRate: data.dailyRate ? Number(data.dailyRate) : '',
                    weeklyRate: data.weeklyRate ? Number(data.weeklyRate) : '',
                    monthlyRate: data.monthlyRate ? Number(data.monthlyRate) : '',
                    hourlyRate: data.hourlyRate ? Number(data.hourlyRate) : '',
                    meterReading: data.meterReading || '',
                    insuranceExpiry: data.insuranceExpiry ? data.insuranceExpiry.split('T')[0] : '',
                    inspectionExpiry: data.inspectionExpiry ? data.inspectionExpiry.split('T')[0] : '',
                    notes: data.notes || '',
                })
            })
            .catch(() => setError('Makine bulunamadı'))
            .finally(() => setLoading(false))
    }, [id])

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        setError('')

        try {
            const res = await fetch(`/api/makineler/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            if (!res.ok) throw new Error((await res.json()).error)
            router.push(`/makineler/${id}`)
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
                <Link href={`/makineler/${id}`} className="btn btn-ghost btn-icon btn-sm"><ArrowLeft size={18} /></Link>
                <div>
                    <h1 className="page-title">Makine Düzenle</h1>
                    <p className="page-subtitle">{form.brand} {form.model}</p>
                </div>
            </div>

            {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>Kimlik</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div><label className="label">Marka *</label><input name="brand" className="input" required value={form.brand} onChange={handleChange} /></div>
                            <div><label className="label">Model *</label><input name="model" className="input" required value={form.model} onChange={handleChange} /></div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div><label className="label">Seri No</label><input name="serialNumber" className="input" value={form.serialNumber} onChange={handleChange} /></div>
                            <div><label className="label">Plaka</label><input name="plate" className="input" value={form.plate} onChange={handleChange} /></div>
                            <div><label className="label">Yıl</label><input name="year" type="number" className="input" value={form.year} onChange={handleChange} /></div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="label">Tip *</label>
                                <select name="type" className="input select" value={form.type} onChange={handleChange}>
                                    {Object.entries(MACHINE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="label">Durum *</label>
                                <select name="status" className="input select" value={form.status} onChange={handleChange}>
                                    {Object.entries(MACHINE_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>Fiyatlandırma</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
                        <div><label className="label">Saatlik (₺)</label><input name="hourlyRate" type="number" className="input" step="0.01" value={form.hourlyRate} onChange={handleChange} /></div>
                        <div><label className="label">Günlük (₺)</label><input name="dailyRate" type="number" className="input" step="0.01" value={form.dailyRate} onChange={handleChange} /></div>
                        <div><label className="label">Haftalık (₺)</label><input name="weeklyRate" type="number" className="input" step="0.01" value={form.weeklyRate} onChange={handleChange} /></div>
                        <div><label className="label">Aylık (₺)</label><input name="monthlyRate" type="number" className="input" step="0.01" value={form.monthlyRate} onChange={handleChange} /></div>
                    </div>
                </div>

                <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>Belgeler & Sayaç</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <div><label className="label">Sayaç (saat)</label><input name="meterReading" type="number" className="input" value={form.meterReading} onChange={handleChange} /></div>
                        <div><label className="label">Sigorta Bitiş</label><input name="insuranceExpiry" type="date" className="input" value={form.insuranceExpiry} onChange={handleChange} /></div>
                        <div><label className="label">Muayene Bitiş</label><input name="inspectionExpiry" type="date" className="input" value={form.inspectionExpiry} onChange={handleChange} /></div>
                    </div>
                </div>

                <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <label className="label">Notlar</label>
                    <textarea name="notes" className="input" rows={3} value={form.notes} onChange={handleChange} style={{ resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <Link href={`/makineler/${id}`} className="btn btn-outline">İptal</Link>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Kaydediliyor...' : <><Save size={18} />Değişiklikleri Kaydet</>}
                    </button>
                </div>
            </form>
        </div>
    )
}
