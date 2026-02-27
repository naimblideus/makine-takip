'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function YeniYakitPage() {
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
            const res = await fetch('/api/yakit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error((await res.json()).error)
            router.push('/yakit')
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
                <Link href="/yakit" className="btn btn-ghost btn-icon btn-sm"><ArrowLeft size={18} /></Link>
                <div>
                    <h1 className="page-title">Yakıt Girişi</h1>
                    <p className="page-subtitle">Yeni bir yakıt kaydı oluşturun</p>
                </div>
            </div>

            {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
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
                                <label className="label">Tarih *</label>
                                <input name="date" type="date" className="input" required defaultValue={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div>
                                <label className="label">Yakıt Seviyesi</label>
                                <select name="fuelLevel" className="input select">
                                    <option value="">Seçin...</option>
                                    <option value="BOS">Boş</option>
                                    <option value="DORTTEBIR">1/4</option>
                                    <option value="YARI">Yarı</option>
                                    <option value="DORTTEUC">3/4</option>
                                    <option value="TAM">Tam</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="label">Litre *</label>
                                <input name="liters" type="number" className="input" required step="0.01" placeholder="0" />
                            </div>
                            <div>
                                <label className="label">Tutar (₺) *</label>
                                <input name="cost" type="number" className="input" required step="0.01" placeholder="0" />
                            </div>
                        </div>
                        <div>
                            <label className="label">İstasyon / Tedarikçi</label>
                            <input name="supplier" className="input" placeholder="İstasyon adı" />
                        </div>
                        <div>
                            <label className="label">Not</label>
                            <textarea name="notes" className="input" rows={2} placeholder="Ek bilgi..." style={{ resize: 'vertical' }} />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <Link href="/yakit" className="btn btn-outline">İptal</Link>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Kaydediliyor...' : <><Save size={18} />Kaydet</>}
                    </button>
                </div>
            </form>
        </div>
    )
}
