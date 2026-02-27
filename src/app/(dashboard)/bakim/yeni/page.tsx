'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { MAINTENANCE_TYPE_LABELS } from '@/lib/constants'

export default function YeniBakimPage() {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [machines, setMachines] = useState<any[]>([])

    useEffect(() => {
        fetch('/api/makineler').then(r => r.json()).then(setMachines)
    }, [])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setSaving(true)
        setError('')

        const form = new FormData(e.currentTarget)
        const data = Object.fromEntries(form)

        try {
            const res = await fetch('/api/bakim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error((await res.json()).error)
            router.push('/bakim')
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
                <Link href="/bakim" className="btn btn-ghost btn-icon btn-sm"><ArrowLeft size={18} /></Link>
                <div>
                    <h1 className="page-title">Bakım Kaydı</h1>
                    <p className="page-subtitle">Yeni bir bakım kaydı oluşturun</p>
                </div>
            </div>

            {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label className="label">Makine *</label>
                            <select name="machineId" className="input select" required>
                                <option value="">Makine seçin...</option>
                                {machines.map((m: any) => (
                                    <option key={m.id} value={m.id}>{m.brand} {m.model} ({m.plate || m.serialNumber})</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="label">Bakım Tipi *</label>
                                <select name="type" className="input select" required>
                                    {Object.entries(MAINTENANCE_TYPE_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="label">Tarih *</label>
                                <input name="performedAt" type="date" className="input" required defaultValue={new Date().toISOString().split('T')[0]} />
                            </div>
                        </div>
                        <div>
                            <label className="label">Açıklama</label>
                            <textarea name="description" className="input" rows={2} placeholder="Yapılan işlemler..." style={{ resize: 'vertical' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="label">Maliyet (₺)</label>
                                <input name="cost" type="number" className="input" step="0.01" placeholder="0" />
                            </div>
                            <div>
                                <label className="label">Makine Saati</label>
                                <input name="machineHoursAt" type="number" className="input" placeholder="Bakım anındaki saat" />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="label">Kullanılan Parçalar</label>
                                <input name="parts" className="input" placeholder="Filtre, yağ vb." />
                            </div>
                            <div>
                                <label className="label">Servis Adı</label>
                                <input name="serviceName" className="input" placeholder="Servis firması" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>Sonraki Bakım Planı</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label className="label">Sonraki Bakım Tarihi</label>
                            <input name="nextMaintenanceDate" type="date" className="input" />
                        </div>
                        <div>
                            <label className="label">Sonraki Bakım Saati</label>
                            <input name="nextMaintenanceHours" type="number" className="input" placeholder="Kaç saatte" />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <Link href="/bakim" className="btn btn-outline">İptal</Link>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Kaydediliyor...' : <><Save size={18} />Kaydet</>}
                    </button>
                </div>
            </form>
        </div>
    )
}
