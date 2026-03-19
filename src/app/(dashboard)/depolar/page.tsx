'use client'

import { useEffect, useState } from 'react'
import { Warehouse, MapPin, Plus, Phone } from 'lucide-react'

export default function DepoPage() {
    const [depots, setDepots] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState({ name: '', address: '', lat: '', lng: '', capacity: '', contactName: '', contactPhone: '', notes: '' })

    const load = async () => {
        setLoading(true)
        const res = await fetch('/api/depolar')
        const json = await res.json()
        setDepots(json.depots || [])
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await fetch('/api/depolar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        })
        setShowModal(false)
        load()
    }

    if (loading) return <div className="spinner" style={{ margin: '3rem auto' }} />

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Depo Yönetimi</h1>
                    <p className="page-subtitle">Makine stoklama noktaları</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Depo Ekle</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {depots.map((d: any) => (
                    <div key={d.id} className="card" style={{ padding: '1.125rem' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{d.name}</div>
                                {d.capacity && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Kapasite: {d.capacity} araç</div>}
                            </div>
                            <div style={{ background: '#dbeafe', color: '#2563eb', borderRadius: '0.5rem', padding: '0.375rem' }}>
                                <Warehouse size={20} />
                            </div>
                        </div>
                        {d.address && (
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.375rem', fontSize: '0.8125rem', color: '#64748b', marginBottom: '0.5rem' }}>
                                <MapPin size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                                <span>{d.address}</span>
                            </div>
                        )}
                        {d.contactName && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: '#64748b', marginBottom: '0.375rem' }}>
                                <Phone size={14} />
                                <span>{d.contactName} — {d.contactPhone}</span>
                            </div>
                        )}
                        {d.lat && d.lng && (
                            <a href={`https://maps.google.com/?q=${d.lat},${d.lng}`} target="_blank" rel="noreferrer"
                                className="btn btn-sm btn-outline" style={{ marginTop: '0.5rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
                                <MapPin size={13} /> Haritada Aç
                            </a>
                        )}
                    </div>
                ))}
                {depots.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                        <Warehouse size={40} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
                        <div>Henüz depo eklenmemiş</div>
                    </div>
                )}
            </div>

            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
                    <div className="card" style={{ width: '100%', maxWidth: 480, padding: '1.5rem' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Yeni Depo Ekle</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label className="form-label">Depo Adı</label>
                                    <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                                </div>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label className="form-label">Adres</label>
                                    <input className="form-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                                </div>
                                <div>
                                    <label className="form-label">Enlem (Lat)</label>
                                    <input type="number" step="any" className="form-input" value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} />
                                </div>
                                <div>
                                    <label className="form-label">Boylam (Lng)</label>
                                    <input type="number" step="any" className="form-input" value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })} />
                                </div>
                                <div>
                                    <label className="form-label">Kapasite (araç)</label>
                                    <input type="number" className="form-input" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} />
                                </div>
                                <div>
                                    <label className="form-label">Sorumlu Kişi</label>
                                    <input className="form-input" value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} />
                                </div>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label className="form-label">Telefon</label>
                                    <input className="form-input" value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} />
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
