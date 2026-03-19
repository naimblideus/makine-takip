'use client'

import { useEffect, useState } from 'react'
import { Plus, TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const MACHINE_TYPES: Record<string, string> = { FORKLIFT: 'Forklift', EKSAVATOR: 'Ekskavatör', VINC: 'Vinç', DOZER: 'Dozer', KEPCE: 'Kepçe', GREYDER: 'Greyder', SILINDIR: 'Silindir', KAMYON: 'Kamyon', BEKO_LODER: 'Beko Loder', DIGER: 'Diğer' }

export default function AmortismanPage() {
    const [data, setData] = useState<any>({})
    const [machines, setMachines] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState({ machineId: '', purchasePrice: '', purchaseDate: '', usefulLifeYears: '10', residualValue: '', depreciationMethod: 'DOGHRUSAL', notes: '' })

    const load = async () => {
        setLoading(true)
        const [aRes, mRes] = await Promise.all([fetch('/api/amortisman'), fetch('/api/makineler')])
        const a = await aRes.json(); const m = await mRes.json()
        setData(a); setMachines(m.machines || [])
        setLoading(false)
    }
    useEffect(() => { load() }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await fetch('/api/amortisman', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        setShowModal(false); load()
    }

    if (loading) return <div className="spinner" style={{ margin: '3rem auto' }} />
    const { amortizations = [], totalFleetValue = 0, totalPurchaseValue = 0 } = data
    const totalDepreciated = totalPurchaseValue - totalFleetValue

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Amortisman Yönetimi</h1>
                    <p className="page-subtitle">Makine varlık değerleri ve yıllık yıpranma takibi</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Amortisman Ekle</button>
            </div>

            {/* Özet */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                    { label: 'Alış Değeri', value: formatCurrency(totalPurchaseValue), color: '#2563eb', icon: '🏭' },
                    { label: 'Güncel Filo Değeri', value: formatCurrency(totalFleetValue), color: '#059669', icon: '✅' },
                    { label: 'Toplam Yıpranma', value: formatCurrency(totalDepreciated), color: '#dc2626', icon: '📉' },
                    { label: 'Ortalama Yıpranma', value: `%${amortizations.length > 0 ? Math.round(amortizations.reduce((s: number, a: any) => s + a.depreciationPct, 0) / amortizations.length) : 0}`, color: '#d97706', icon: '📊' },
                ].map(k => (
                    <div key={k.label} className="stat-card" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <div style={{ fontSize: '1.5rem' }}>{k.icon}</div>
                        <div><div style={{ fontSize: '1rem', fontWeight: 800, color: k.color }}>{k.value}</div><div className="stat-card-label">{k.label}</div></div>
                    </div>
                ))}
            </div>

            {/* Makine Listesi */}
            {amortizations.length === 0 ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    <TrendingDown size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <div>Henüz amortisman kaydı yok</div>
                    <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Her makine için alış değeri ve kullanım ömrü girerek varlık değerini takip edin</div>
                </div>
            ) : (
                <div className="card">
                    <table className="table">
                        <thead><tr><th>Makine</th><th>Alış Değeri</th><th>Yıllık Amortisman</th><th>Yıpranma</th><th>Güncel Değer</th><th>Kalan Ömür</th></tr></thead>
                        <tbody>
                            {amortizations.map((a: any) => {
                                const yearsUsed = (Date.now() - new Date(a.purchaseDate).getTime()) / (365.25 * 86400000)
                                const remaining = Math.max(Number(a.usefulLifeYears) - yearsUsed, 0)
                                return (
                                    <tr key={a.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{a.machine?.brand} {a.machine?.model}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{MACHINE_TYPES[a.machine?.type] || a.machine?.type}</div>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{formatCurrency(Number(a.purchasePrice))}</td>
                                        <td style={{ color: '#dc2626', fontWeight: 600 }}>{formatCurrency(a.annualDepreciation)}<div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>/ yıl</div></td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ flex: 1, height: '6px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', borderRadius: '9999px', background: a.depreciationPct > 80 ? '#dc2626' : a.depreciationPct > 50 ? '#d97706' : '#10b981', width: `${a.depreciationPct}%` }} />
                                                </div>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: a.depreciationPct > 80 ? '#dc2626' : '#64748b', whiteSpace: 'nowrap' }}>%{a.depreciationPct}</span>
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 700, color: '#059669' }}>{formatCurrency(a.currentValue)}</td>
                                        <td style={{ fontSize: '0.8rem', color: remaining < 2 ? '#dc2626' : '#64748b' }}>{remaining.toFixed(1)} yıl</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
                    <div className="card" style={{ width: '100%', maxWidth: 500, padding: '1.5rem' }}>
                        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>Amortisman Kaydı Ekle / Güncelle</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div><label className="form-label">Makine</label>
                                <select className="form-input" value={form.machineId} onChange={e => setForm({ ...form, machineId: e.target.value })} required>
                                    <option value="">Seçiniz</option>
                                    {machines.map((m: any) => <option key={m.id} value={m.id}>{m.brand} {m.model} {m.plate ? `(${m.plate})` : ''}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div><label className="form-label">Alış Fiyatı (₺)</label><input type="number" className="form-input" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} required /></div>
                                <div><label className="form-label">Alış Tarihi</label><input type="date" className="form-input" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} required /></div>
                                <div><label className="form-label">Kullanım Ömrü (yıl)</label><input type="number" className="form-input" value={form.usefulLifeYears} onChange={e => setForm({ ...form, usefulLifeYears: e.target.value })} /></div>
                                <div><label className="form-label">Hurda Değeri (₺)</label><input type="number" className="form-input" value={form.residualValue} onChange={e => setForm({ ...form, residualValue: e.target.value })} /></div>
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
