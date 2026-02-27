'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { TIMESHEET_TYPE_LABELS } from '@/lib/constants'

export default function YeniPuantajPage() {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [operators, setOperators] = useState<any[]>([])
    const [rentals, setRentals] = useState<any[]>([])

    useEffect(() => {
        Promise.all([
            fetch('/api/operatorler').then(r => r.json()),
            fetch('/api/kiralamalar?status=AKTIF').then(r => r.json()),
        ]).then(([o, r]) => {
            setOperators(o)
            setRentals(r)
        })
    }, [])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setSaving(true)
        setError('')

        const form = new FormData(e.currentTarget)
        const data = Object.fromEntries(form)

        try {
            const res = await fetch('/api/puantaj', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error((await res.json()).error)
            router.push('/puantaj')
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
                <Link href="/puantaj" className="btn btn-ghost btn-icon btn-sm"><ArrowLeft size={18} /></Link>
                <div>
                    <h1 className="page-title">Puantaj Girişi</h1>
                    <p className="page-subtitle">Operatör çalışma saati kaydı</p>
                </div>
            </div>

            {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label className="label">Operatör *</label>
                            <select name="operatorId" className="input select" required>
                                <option value="">Operatör seçin...</option>
                                {operators.map((o: any) => (
                                    <option key={o.id} value={o.id}>{o.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="label">Kiralama *</label>
                            <select name="rentalId" className="input select" required>
                                <option value="">Aktif kiralama seçin...</option>
                                {rentals.map((r: any) => (
                                    <option key={r.id} value={r.id}>
                                        {r.machine?.brand} {r.machine?.model} — {r.customer?.companyName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="label">Tarih *</label>
                                <input name="date" type="date" className="input" required defaultValue={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div>
                                <label className="label">Çalışma Saati *</label>
                                <input name="hoursWorked" type="number" className="input" required step="0.5" min="0.5" max="24" placeholder="8" />
                            </div>
                            <div>
                                <label className="label">Tip *</label>
                                <select name="type" className="input select" required>
                                    {Object.entries(TIMESHEET_TYPE_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="label">Not</label>
                            <textarea name="notes" className="input" rows={2} placeholder="Ek bilgi..." style={{ resize: 'vertical' }} />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <Link href="/puantaj" className="btn btn-outline">İptal</Link>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Kaydediliyor...' : <><Save size={18} />Kaydet</>}
                    </button>
                </div>
            </form>
        </div>
    )
}
