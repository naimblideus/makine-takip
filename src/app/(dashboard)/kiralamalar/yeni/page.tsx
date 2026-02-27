'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { MACHINE_TYPE_LABELS, RENTAL_PERIOD_LABELS } from '@/lib/constants'

export default function YeniKiralamaPage() {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const [machines, setMachines] = useState<any[]>([])
    const [customers, setCustomers] = useState<any[]>([])
    const [operators, setOperators] = useState<any[]>([])
    const [sites, setSites] = useState<any[]>([])

    const [selectedMachine, setSelectedMachine] = useState('')
    const [selectedCustomer, setSelectedCustomer] = useState('')
    const [operatorIncluded, setOperatorIncluded] = useState(false)

    useEffect(() => {
        Promise.all([
            fetch('/api/makineler?status=MUSAIT').then(r => r.json()),
            fetch('/api/musteriler').then(r => r.json()),
            fetch('/api/operatorler').then(r => r.json()),
        ]).then(([m, c, o]) => {
            setMachines(m)
            setCustomers(c)
            setOperators(o)
        })
    }, [])

    // Müşteri seçilince şantiyeleri getir
    useEffect(() => {
        if (selectedCustomer) {
            fetch(`/api/santiyeler?customerId=${selectedCustomer}`)
                .then(r => r.json())
                .then(setSites)
                .catch(() => setSites([]))
        } else {
            setSites([])
        }
    }, [selectedCustomer])

    const machine = machines.find(m => m.id === selectedMachine)
    const customer = customers.find(c => c.id === selectedCustomer)
    const blacklisted = customer?.isBlacklisted

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setSaving(true)
        setError('')

        const form = new FormData(e.currentTarget)
        const data = {
            machineId: form.get('machineId'),
            customerId: form.get('customerId'),
            siteId: form.get('siteId') || null,
            operatorId: form.get('operatorId') || null,
            periodType: form.get('periodType'),
            unitPrice: form.get('unitPrice'),
            operatorIncluded,
            startDate: form.get('startDate'),
            deliveryHours: form.get('deliveryHours'),
            deliveryFuel: form.get('deliveryFuel'),
            deposit: form.get('deposit'),
            notes: form.get('notes'),
        }

        try {
            const res = await fetch('/api/kiralamalar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error((await res.json()).error)
            router.push('/kiralamalar')
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
                <Link href="/kiralamalar" className="btn btn-ghost btn-icon btn-sm"><ArrowLeft size={18} /></Link>
                <div>
                    <h1 className="page-title">Yeni Kiralama</h1>
                    <p className="page-subtitle">Bir makineyi müşteriye kiralayın</p>
                </div>
            </div>

            {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
                {/* 1. Makine Seçimi */}
                <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>1️⃣ Makine Seçin</h3>
                    <select
                        name="machineId"
                        className="input select"
                        required
                        value={selectedMachine}
                        onChange={(e) => setSelectedMachine(e.target.value)}
                    >
                        <option value="">Müsait makine seçin...</option>
                        {machines.map((m: any) => (
                            <option key={m.id} value={m.id}>
                                {m.brand} {m.model} ({m.plate || m.serialNumber}) — {MACHINE_TYPE_LABELS[m.type as keyof typeof MACHINE_TYPE_LABELS]}
                            </option>
                        ))}
                    </select>

                    {machine && (
                        <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: '0.5rem', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#166534' }}>
                                ✅ {machine.brand} {machine.model} — {machine.plate}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#166534', marginTop: '0.25rem' }}>
                                {machine.dailyRate && `Günlük: ${formatCurrency(machine.dailyRate)}`}
                                {machine.weeklyRate && ` · Haftalık: ${formatCurrency(machine.weeklyRate)}`}
                                {machine.monthlyRate && ` · Aylık: ${formatCurrency(machine.monthlyRate)}`}
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. Müşteri */}
                <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>2️⃣ Müşteri & Şantiye</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
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
                                    <option key={c.id} value={c.id} disabled={c.isBlacklisted}>
                                        {c.companyName} {c.isBlacklisted ? '🚫 KARA LİSTE' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="label">Şantiye</label>
                            <select name="siteId" className="input select">
                                <option value="">Şantiye seçin (opsiyonel)</option>
                                {sites.map((s: any) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {blacklisted && (
                        <div className="alert alert-danger" style={{ marginTop: '0.75rem' }}>
                            <AlertTriangle size={16} />
                            <span>Bu müşteri kara listede! Kiralama yapılamaz.</span>
                        </div>
                    )}
                </div>

                {/* 3. Kiralama Detayları */}
                <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>3️⃣ Kiralama Detayları</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                        <div>
                            <label className="label">Dönem Tipi *</label>
                            <select name="periodType" className="input select" required>
                                {Object.entries(RENTAL_PERIOD_LABELS).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="label">Birim Fiyat (₺) *</label>
                            <input name="unitPrice" type="number" className="input" required step="0.01" placeholder="0" />
                        </div>
                        <div>
                            <label className="label">Başlangıç Tarihi *</label>
                            <input name="startDate" type="date" className="input" required defaultValue={new Date().toISOString().split('T')[0]} />
                        </div>
                        <div>
                            <label className="label">Depozito (₺)</label>
                            <input name="deposit" type="number" className="input" step="0.01" placeholder="0" />
                        </div>
                    </div>

                    {/* Operatör */}
                    <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '0.5rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
                            <input
                                type="checkbox"
                                checked={operatorIncluded}
                                onChange={(e) => setOperatorIncluded(e.target.checked)}
                                style={{ width: '1rem', height: '1rem' }}
                            />
                            Operatör dahil
                        </label>
                        {operatorIncluded && (
                            <div style={{ marginTop: '0.75rem' }}>
                                <select name="operatorId" className="input select">
                                    <option value="">Operatör seçin...</option>
                                    {operators.map((o: any) => (
                                        <option key={o.id} value={o.id}>{o.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. Teslim Bilgileri */}
                <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>4️⃣ Teslim Bilgileri</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                        <div>
                            <label className="label">Teslim Saati (saat)</label>
                            <input name="deliveryHours" type="number" className="input" placeholder="Makine saat sayacı" />
                        </div>
                        <div>
                            <label className="label">Teslim Yakıt Durumu</label>
                            <select name="deliveryFuel" className="input select">
                                <option value="">Seçin...</option>
                                <option value="TAM">Tam</option>
                                <option value="DORTTEUC">3/4</option>
                                <option value="YARI">Yarı</option>
                                <option value="DORTTEBIR">1/4</option>
                                <option value="BOS">Boş</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Notlar */}
                <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>Notlar</h3>
                    <textarea name="notes" className="input" rows={3} placeholder="Kiralama hakkında ek bilgiler..." style={{ resize: 'vertical' }} />
                </div>

                {/* Kaydet */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <Link href="/kiralamalar" className="btn btn-outline">İptal</Link>
                    <button type="submit" className="btn btn-primary" disabled={saving || blacklisted}>
                        {saving ? (
                            <><div className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} />Oluşturuluyor...</>
                        ) : (
                            <><Save size={18} />Kiralamayı Oluştur</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
