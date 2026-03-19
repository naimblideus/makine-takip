'use client'

import { useEffect, useState } from 'react'
import { Plus, Truck, MapPin } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'

export default function TransferlerPage() {
    const [transfers, setTransfers] = useState<any[]>([])
    const [machines, setMachines] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState({ machineId: '', fromLocation: '', toLocation: '', transferDate: new Date().toISOString().slice(0, 10), driver: '', vehiclePlate: '', cost: '', distance: '', notes: '' })

    const load = async () => {
        setLoading(true)
        const [tRes, mRes] = await Promise.all([fetch('/api/transferler'), fetch('/api/makineler')])
        const tData = await tRes.json()
        const mData = await mRes.json()
        setTransfers(tData.transfers || [])
        setMachines(mData.machines || [])
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await fetch('/api/transferler', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        setShowModal(false)
        load()
    }

    if (loading) return <div className="spinner" style={{ margin: '3rem auto' }} />

    const totalCost = transfers.reduce((s, t) => s + Number(t.cost || 0), 0)
    const totalDist = transfers.reduce((s, t) => s + Number(t.distance || 0), 0)

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Makine Nakliyeleri</h1>
                    <p className="page-subtitle">Makine lokasyon transferleri ve nakliye kayıtları</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Transfer Ekle</button>
            </div>

            {/* Özet */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                    { label: 'Toplam Transfer', value: `${transfers.length}`, icon: '🚛', color: '#2563eb' },
                    { label: 'Toplam Maliyet', value: formatCurrency(totalCost), icon: '💰', color: '#dc2626' },
                    { label: 'Toplam Mesafe', value: `${totalDist.toFixed(0)} km`, icon: '📍', color: '#059669' },
                ].map(k => (
                    <div key={k.label} className="stat-card" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <div style={{ fontSize: '1.5rem' }}>{k.icon}</div>
                        <div><div style={{ fontSize: '1.1rem', fontWeight: 800, color: k.color }}>{k.value}</div><div className="stat-card-label">{k.label}</div></div>
                    </div>
                ))}
            </div>

            {/* Tablo */}
            <div className="card">
                {transfers.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                        <Truck size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                        <div>Henüz transfer kaydı yok</div>
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr><th>Makine</th><th>Nereden</th><th>Nereye</th><th>Tarih</th><th>Şoför</th><th>Mesafe</th><th>Maliyet</th></tr>
                        </thead>
                        <tbody>
                            {transfers.map((t: any) => (
                                <tr key={t.id}>
                                    <td style={{ fontWeight: 600 }}>{t.machine?.brand} {t.machine?.model}<div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{t.machine?.plate}</div></td>
                                    <td style={{ fontSize: '0.8rem' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={12} color="#94a3b8" />{t.fromLocation}</div></td>
                                    <td style={{ fontSize: '0.8rem' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={12} color="#2563eb" />{t.toLocation}</div></td>
                                    <td style={{ fontSize: '0.8rem' }}>{formatDate(t.transferDate)}</td>
                                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{t.driver || '—'}</td>
                                    <td style={{ fontSize: '0.8rem' }}>{t.distance ? `${Number(t.distance).toFixed(0)} km` : '—'}</td>
                                    <td style={{ fontWeight: 600, color: '#dc2626' }}>{t.cost ? formatCurrency(Number(t.cost)) : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
                    <div className="card" style={{ width: '100%', maxWidth: 520, padding: '1.5rem', maxHeight: '90vh', overflow: 'auto' }}>
                        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>Transfer Kaydı Ekle</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div><label className="form-label">Makine</label>
                                <select className="form-input" value={form.machineId} onChange={e => setForm({ ...form, machineId: e.target.value })} required>
                                    <option value="">Seçiniz</option>
                                    {machines.map((m: any) => <option key={m.id} value={m.id}>{m.brand} {m.model} {m.plate ? `(${m.plate})` : ''}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div><label className="form-label">Çıkış Yeri</label><input className="form-input" required value={form.fromLocation} onChange={e => setForm({ ...form, fromLocation: e.target.value })} /></div>
                                <div><label className="form-label">Varış Yeri</label><input className="form-input" required value={form.toLocation} onChange={e => setForm({ ...form, toLocation: e.target.value })} /></div>
                                <div><label className="form-label">Transfer Tarihi</label><input type="date" className="form-input" value={form.transferDate} onChange={e => setForm({ ...form, transferDate: e.target.value })} /></div>
                                <div><label className="form-label">Şoför</label><input className="form-input" value={form.driver} onChange={e => setForm({ ...form, driver: e.target.value })} /></div>
                                <div><label className="form-label">Araç Plaka</label><input className="form-input" value={form.vehiclePlate} onChange={e => setForm({ ...form, vehiclePlate: e.target.value })} /></div>
                                <div><label className="form-label">Mesafe (km)</label><input type="number" className="form-input" value={form.distance} onChange={e => setForm({ ...form, distance: e.target.value })} /></div>
                                <div><label className="form-label">Maliyet (₺)</label><input type="number" className="form-input" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} /></div>
                            </div>
                            <div><label className="form-label">Notlar</label><textarea className="form-input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
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
