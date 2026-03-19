'use client'

import { useEffect, useState } from 'react'
import { Wrench, Plus, AlertTriangle, Clock, CheckCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { MAINTENANCE_TYPE_LABELS } from '@/lib/constants'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    GECIKTI: { label: 'GECİKTİ', color: '#dc2626', bg: '#fee2e2' },
    ACIL: { label: 'ACİL', color: '#d97706', bg: '#fef3c7' },
    YAKLASIYOR: { label: 'YAKLAŞIYOR', color: '#7c3aed', bg: '#ede9fe' },
    NORMAL: { label: 'NORMAL', color: '#059669', bg: '#d1fae5' },
    PLANSIZ: { label: 'PLANSIZ', color: '#64748b', bg: '#f1f5f9' },
}

export default function BakimTakvimiPage() {
    const [schedules, setSchedules] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [machines, setMachines] = useState<any[]>([])
    const [form, setForm] = useState({
        machineId: '', type: 'YAG_DEGISIMI', description: '',
        intervalHours: '', intervalDays: '', nextDueDate: '', nextDueHours: '', estimatedCost: '',
    })

    const load = async () => {
        setLoading(true)
        const res = await fetch('/api/bakim-takvimi')
        const json = await res.json()
        setSchedules(json.schedules || [])
        setLoading(false)
    }

    useEffect(() => { load() }, [])
    useEffect(() => {
        fetch('/api/makineler').then(r => r.json()).then(j => setMachines(j.makineler || []))
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await fetch('/api/bakim-takvimi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        })
        setShowModal(false)
        load()
    }

    if (loading) return <div className="spinner" style={{ margin: '3rem auto' }} />

    const gecikti = schedules.filter(s => s.alertStatus === 'GECIKTI')
    const acil = schedules.filter(s => s.alertStatus === 'ACIL')
    const yaklasiyor = schedules.filter(s => s.alertStatus === 'YAKLASIYOR')

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Bakım Takvimi</h1>
                    <p className="page-subtitle">Periyodik bakım planlarını takip edin</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Plan Ekle</button>
            </div>

            {/* Uyarılar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
            { label: 'Gecikmiş', value: gecikti.length, color: '#dc2626', bg: '#fee2e2', icon: <AlertTriangle size={18} /> },
                    { label: 'Acil', value: acil.length, color: '#d97706', bg: '#fef3c7', icon: <AlertTriangle size={18} /> },
                    { label: 'Yaklaşıyor', value: yaklasiyor.length, color: '#7c3aed', bg: '#ede9fe', icon: <Clock size={18} /> },
                    { label: 'Normal', value: schedules.filter(s => s.alertStatus === 'NORMAL').length, color: '#059669', bg: '#d1fae5', icon: <CheckCircle size={18} /> },
                ].map(k => (
                    <div key={k.label} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="stat-card-icon" style={{ background: k.bg, color: k.color }}>{k.icon}</div>
                        <div>
                            <div className="stat-card-value" style={{ color: k.color }}>{k.value}</div>
                            <div className="stat-card-label">{k.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Kritik uyarılar */}
            {gecikti.slice(0, 3).map((s: any) => (
                <div key={s.id} className="alert alert-danger" style={{ marginBottom: '0.5rem' }}>
                    <AlertTriangle size={15} />
                    <strong>{s.machine?.brand} {s.machine?.model} ({s.machine?.plate})</strong>
                    {' — '}{(MAINTENANCE_TYPE_LABELS as any)[s.type] || s.type} bakımı {Math.abs(s.daysLeft)} gün gecikti!
                </div>
            ))}
            {acil.slice(0, 3).map((s: any) => (
                <div key={s.id} className="alert alert-warning" style={{ marginBottom: '0.5rem' }}>
                    <Clock size={15} />
                    <strong>{s.machine?.brand} {s.machine?.model}</strong>
                    {' — '}{(MAINTENANCE_TYPE_LABELS as any)[s.type] || s.type} — {s.daysLeft} gün içinde!
                </div>
            ))}

            {/* Tablo */}
            <div className="card">
                <table className="table">
                    <thead>
                        <tr><th>Makine</th><th>Bakım Türü</th><th>Periyot</th><th>Sonraki Tarih</th><th>Tahmini Maliyet</th><th>Durum</th></tr>
                    </thead>
                    <tbody>
                        {schedules.map((s: any) => {
                            const st = STATUS_CONFIG[s.alertStatus] || STATUS_CONFIG.PLANSIZ
                            return (
                                <tr key={s.id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{s.machine?.brand} {s.machine?.model}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{s.machine?.plate}</div>
                                    </td>
                                    <td style={{ fontSize: '0.85rem' }}>{(MAINTENANCE_TYPE_LABELS as any)[s.type] || s.type}</td>
                                    <td style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                        {s.intervalHours && `Her ${s.intervalHours}s`}
                                        {s.intervalDays && `Her ${s.intervalDays} gün`}
                                    </td>
                                    <td style={{ fontSize: '0.8cm' }}>
                                        {s.nextDueDate ? formatDate(s.nextDueDate) : (s.nextDueHours ? `${s.nextDueHours}s` : '—')}
                                    </td>
                                    <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                        {s.estimatedCost ? `₺${Number(s.estimatedCost).toLocaleString('tr-TR')}` : '—'}
                                    </td>
                                    <td>
                                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600, background: st.bg, color: st.color }}>
                                            {st.label}
                                        </span>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
                    <div className="card" style={{ width: '100%', maxWidth: 500, padding: '1.5rem' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Bakım Planı Ekle</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label className="form-label">Makine</label>
                                    <select className="form-input" value={form.machineId} onChange={e => setForm({ ...form, machineId: e.target.value })} required>
                                        <option value="">Seçin...</option>
                                        {machines.map((m: any) => <option key={m.id} value={m.id}>{m.brand} {m.model} ({m.plate})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Bakım Türü</label>
                                    <select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                        {Object.entries(MAINTENANCE_TYPE_LABELS as any).map(([k, v]: any) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Her Kaç Saatte (saat)</label>
                                    <input type="number" className="form-input" placeholder="örn: 250" value={form.intervalHours} onChange={e => setForm({ ...form, intervalHours: e.target.value })} />
                                </div>
                                <div>
                                    <label className="form-label">Sonraki Bakım Tarihi</label>
                                    <input type="date" className="form-input" value={form.nextDueDate} onChange={e => setForm({ ...form, nextDueDate: e.target.value })} />
                                </div>
                                <div>
                                    <label className="form-label">Tahmini Maliyet (₺)</label>
                                    <input type="number" className="form-input" value={form.estimatedCost} onChange={e => setForm({ ...form, estimatedCost: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>İptal</button>
                                <button type="submit" className="btn btn-primary">Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
