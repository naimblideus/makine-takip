'use client'

import { useEffect, useState } from 'react'
import { DollarSign, Plus, Tag } from 'lucide-react'

const MACHINE_TYPE_LABELS: Record<string, string> = {
    FORKLIFT: 'Forklift', EKSAVATOR: 'Ekskavatör', VINC: 'Vinç', DOZER: 'Dozer',
    KEPCE: 'Kepçe', GREYDER: 'Greyder', SILINDIR: 'Silindir', KAMYON: 'Kamyon',
    BEKO_LODER: 'Beko Loder', DIGER: 'Diğer',
}
const PERIOD_LABELS: Record<string, string> = {
    SAATLIK: 'Saatlik', GUNLUK: 'Günlük', HAFTALIK: 'Haftalık', AYLIK: 'Aylık',
}
const MACHINE_TYPES = Object.entries(MACHINE_TYPE_LABELS)
const PERIOD_TYPES = Object.entries(PERIOD_LABELS)

export default function FiyatlamaPage() {
    const [rules, setRules] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState({
        machineType: 'FORKLIFT', periodType: 'GUNLUK', basePrice: '',
        seasonMultiplier: '1', longTermDiscount: '0', loyaltyDiscount: '0',
        operatorIncRate: '0', minRentalDays: '', notes: '',
    })

    const load = async () => {
        setLoading(true)
        const res = await fetch('/api/fiyatlama')
        const json = await res.json()
        setRules(json.rules || [])
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await fetch('/api/fiyatlama', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        })
        setShowModal(false)
        load()
    }

    if (loading) return <div className="spinner" style={{ margin: '3rem auto' }} />

    // Makine tipi bazlı gruplama
    const grouped: Record<string, any[]> = {}
    rules.forEach(r => {
        if (!grouped[r.machineType]) grouped[r.machineType] = []
        grouped[r.machineType].push(r)
    })

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Akıllı Fiyatlama</h1>
                    <p className="page-subtitle">Makine tipi ve dönem bazlı fiyat kuralları</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Kural Ekle</button>
            </div>

            {rules.length === 0 ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    <Tag size={40} style={{ opacity: 0.4, marginBottom: '1rem' }} />
                    <div style={{ fontWeight: 600 }}>Henüz fiyatlama kuralı yok</div>
                    <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Her makine tipi için dönem bazlı standart fiyatlar belirleyin</div>
                </div>
            ) : (
                Object.entries(grouped).map(([type, typeRules]) => (
                    <div key={type} className="card" style={{ marginBottom: '1rem' }}>
                        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            🚛 {MACHINE_TYPE_LABELS[type] || type}
                        </div>
                        <table className="table">
                            <thead>
                                <tr><th>Dönem</th><th>Taban Fiyat</th><th>Sezon Çarpanı</th><th>Uzun Dönem İndirimi</th><th>Sadakat İndirimi</th><th>Op. Dahil Fark</th></tr>
                            </thead>
                            <tbody>
                                {typeRules.map((r: any) => (
                                    <tr key={r.id}>
                                        <td><span style={{ padding: '0.2rem 0.6rem', borderRadius: '9999px', background: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem', fontWeight: 600 }}>{PERIOD_LABELS[r.periodType] || r.periodType}</span></td>
                                        <td style={{ fontWeight: 700, color: '#059669' }}>₺{Number(r.basePrice).toLocaleString('tr-TR')}</td>
                                        <td style={{ fontSize: '0.85rem' }}>×{Number(r.seasonMultiplier).toFixed(2)}</td>
                                        <td style={{ fontSize: '0.85rem', color: '#2563eb' }}>%{Number(r.longTermDiscount)}</td>
                                        <td style={{ fontSize: '0.85rem', color: '#7c3aed' }}>%{Number(r.loyaltyDiscount)}</td>
                                        <td style={{ fontSize: '0.85rem' }}>{Number(r.operatorIncRate) > 0 ? `₺${Number(r.operatorIncRate).toLocaleString('tr-TR')}` : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))
            )}

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
                    <div className="card" style={{ width: '100%', maxWidth: 540, padding: '1.5rem', maxHeight: '90vh', overflow: 'auto' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Fiyatlama Kuralı Ekle</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label className="form-label">Makine Tipi</label>
                                    <select className="form-input" value={form.machineType} onChange={e => setForm({ ...form, machineType: e.target.value })}>
                                        {MACHINE_TYPES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Dönem Tipi</label>
                                    <select className="form-input" value={form.periodType} onChange={e => setForm({ ...form, periodType: e.target.value })}>
                                        {PERIOD_TYPES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Taban Fiyat (₺)</label>
                                    <input type="number" className="form-input" value={form.basePrice} onChange={e => setForm({ ...form, basePrice: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="form-label">Sezon Çarpanı <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>1.0 = normal</span></label>
                                    <input type="number" step="0.01" className="form-input" value={form.seasonMultiplier} onChange={e => setForm({ ...form, seasonMultiplier: e.target.value })} />
                                </div>
                                <div>
                                    <label className="form-label">Uzun Dönem İndirimi (%) <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>30+ gün</span></label>
                                    <input type="number" className="form-input" value={form.longTermDiscount} onChange={e => setForm({ ...form, longTermDiscount: e.target.value })} />
                                </div>
                                <div>
                                    <label className="form-label">Sadakat İndirimi (%) <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>5+ kiralama</span></label>
                                    <input type="number" className="form-input" value={form.loyaltyDiscount} onChange={e => setForm({ ...form, loyaltyDiscount: e.target.value })} />
                                </div>
                                <div>
                                    <label className="form-label">Op. Dahil Fark (₺/gün)</label>
                                    <input type="number" className="form-input" value={form.operatorIncRate} onChange={e => setForm({ ...form, operatorIncRate: e.target.value })} />
                                </div>
                                <div>
                                    <label className="form-label">Min Kiralama (gün)</label>
                                    <input type="number" className="form-input" value={form.minRentalDays} onChange={e => setForm({ ...form, minRentalDays: e.target.value })} />
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
