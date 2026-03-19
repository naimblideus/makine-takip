'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Plus, DollarSign, BarChart2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'

const CATEGORIES = ['KIRALAMA', 'YAKIT', 'BAKIM', 'SIGORTA', 'NAKLIYE', 'PERSONEL', 'VERGI', 'DIGER']
const CAT_LABELS: Record<string, string> = {
    KIRALAMA: 'Kiralama', YAKIT: 'Yakıt', BAKIM: 'Bakım', SIGORTA: 'Sigorta',
    NAKLIYE: 'Nakliye', PERSONEL: 'Personel', VERGI: 'Vergi', DIGER: 'Diğer',
}

export default function GelirGiderPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [typeFilter, setTypeFilter] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState({ type: 'GIDER', category: 'YAKIT', description: '', amount: '', date: new Date().toISOString().slice(0, 10), notes: '' })

    const load = async () => {
        setLoading(true)
        const params = new URLSearchParams()
        if (typeFilter) params.set('type', typeFilter)
        const res = await fetch(`/api/gelir-gider?${params}`)
        setData(await res.json())
        setLoading(false)
    }

    useEffect(() => { load() }, [typeFilter])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await fetch('/api/gelir-gider', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        })
        setShowModal(false)
        load()
    }

    if (loading) return <div className="spinner" style={{ margin: '3rem auto' }} />
    const { entries = [], summary = {}, monthlyTrend = [] } = data || {}

    const catBreakdown = Object.entries(summary.categoryBreakdown || {})
        .sort(([, a], [, b]) => Number(b) - Number(a))
        .slice(0, 6)

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Gelir & Gider</h1>
                    <p className="page-subtitle">Finansal performans ve marj analizi</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Kayıt Ekle</button>
            </div>

            {/* P&L Özet */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="stat-card-icon" style={{ background: '#d1fae5', color: '#059669' }}><TrendingUp size={20} /></div>
                    <div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.1rem' }}>Toplam Gelir</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669' }}>{formatCurrency(summary.totalGelir || 0)}</div>
                    </div>
                </div>
                <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="stat-card-icon" style={{ background: '#fee2e2', color: '#dc2626' }}><TrendingDown size={20} /></div>
                    <div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.1rem' }}>Toplam Gider</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#dc2626' }}>{formatCurrency(summary.totalGider || 0)}</div>
                    </div>
                </div>
                <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="stat-card-icon" style={{ background: (summary.netKar || 0) >= 0 ? '#d1fae5' : '#fee2e2', color: (summary.netKar || 0) >= 0 ? '#059669' : '#dc2626' }}>
                        <DollarSign size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.1rem' }}>Net Kâr</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: (summary.netKar || 0) >= 0 ? '#059669' : '#dc2626' }}>
                            {formatCurrency(summary.netKar || 0)}
                        </div>
                    </div>
                </div>
                <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="stat-card-icon" style={{ background: '#e0f2fe', color: '#0369a1' }}><BarChart2 size={20} /></div>
                    <div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.1rem' }}>Kâr Marjı</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0369a1' }}>
                            {summary.totalGelir > 0 ? `%${Math.round((summary.netKar / summary.totalGelir) * 100)}` : '%0'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Grafikler */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="card" style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>📊 Aylık Trend (Son 6 Ay)</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={monthlyTrend} margin={{ left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
                            <Tooltip formatter={(v: any) => formatCurrency(Number(v))} contentStyle={{ fontSize: '0.8rem', borderRadius: '0.5rem' }} />
                            <Bar dataKey="gelir" fill="#10b981" radius={[3, 3, 0, 0]} name="Gelir" />
                            <Bar dataKey="gider" fill="#ef4444" radius={[3, 3, 0, 0]} name="Gider" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="card" style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>💸 Gider Kategorileri</h3>
                    {catBreakdown.map(([cat, amount]: any) => (
                        <div key={cat} style={{ marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.2rem' }}>
                                <span>{CAT_LABELS[cat] || cat}</span>
                                <span style={{ fontWeight: 600 }}>{formatCurrency(amount)}</span>
                            </div>
                            <div style={{ height: '6px', borderRadius: '9999px', background: '#f1f5f9', overflow: 'hidden' }}>
                                <div style={{ height: '100%', borderRadius: '9999px', background: '#ef4444', width: `${Math.min((amount / summary.totalGider) * 100, 100)}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Filtre + Tablo */}
            <div className="card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
                {[{ v: '', l: 'Tümü' }, { v: 'GELIR', l: '💚 Gelirler' }, { v: 'GIDER', l: '🔴 Giderler' }].map(t => (
                    <button key={t.v} onClick={() => setTypeFilter(t.v)}
                        style={{
                            padding: '0.25rem 0.75rem', borderRadius: '9999px', border: 'none', cursor: 'pointer',
                            fontSize: '0.8125rem',  background: typeFilter === t.v ? '#2563eb' : '#f1f5f9',
                            color: typeFilter === t.v ? '#fff' : '#64748b', fontWeight: 500,
                        }}>
                        {t.l}
                    </button>
                ))}
            </div>

            <div className="card">
                <table className="table">
                    <thead>
                        <tr><th>Tarih</th><th>Açıklama</th><th>Kategori</th><th>Tür</th><th>Tutar</th></tr>
                    </thead>
                    <tbody>
                        {entries.slice(0, 50).map((e: any) => (
                            <tr key={e.id}>
                                <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{new Date(e.date).toLocaleDateString('tr-TR')}</td>
                                <td style={{ fontSize: '0.85rem' }}>{e.description}</td>
                                <td><span style={{ padding: '0.15rem 0.55rem', borderRadius: '9999px', fontSize: '0.7rem', background: '#e0f2fe', color: '#0369a1' }}>{CAT_LABELS[e.category] || e.category}</span></td>
                                <td>
                                    <span style={{ padding: '0.15rem 0.55rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600, background: e.type === 'GELIR' ? '#d1fae5' : '#fee2e2', color: e.type === 'GELIR' ? '#059669' : '#dc2626' }}>
                                        {e.type === 'GELIR' ? '↑ Gelir' : '↓ Gider'}
                                    </span>
                                </td>
                                <td style={{ fontWeight: 700, color: e.type === 'GELIR' ? '#059669' : '#dc2626' }}>{formatCurrency(Number(e.amount))}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
                    <div className="card" style={{ width: '100%', maxWidth: 440, padding: '1.5rem' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Yeni Kayıt Ekle</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label className="form-label">Tür</label>
                                    <select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                        <option value="GELIR">Gelir</option>
                                        <option value="GIDER">Gider</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Kategori</label>
                                    <select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                        {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
                                    </select>
                                </div>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label className="form-label">Açıklama</label>
                                    <input className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="form-label">Tutar (₺)</label>
                                    <input type="number" className="form-input" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="form-label">Tarih</label>
                                    <input type="date" className="form-input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
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
