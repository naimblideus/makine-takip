'use client'

import { useEffect, useState } from 'react'
import { Shield, Plus, AlertTriangle, Clock, CheckCircle, Filter } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const DOC_TYPES: Record<string, string> = {
    RUHSAT: 'Ruhsat', SIGORTA: 'Sigorta Poliçesi', MUAYENE: 'Muayene Belgesi',
    EHLIYET: 'Ehliyet', OPERATOR_BELGESI: 'Operatör Belgesi', ISGUVENLIGI: 'İş Güvenliği Sertifikası',
    SOZLESME: 'Sözleşme', TESLIM_TUTANAGI: 'Teslim Tutanağı', SAGLIK_RAPORU: 'Sağlık Raporu',
    CE_BELGESI: 'CE Belgesi', VERGI_LEVHASI: 'Vergi Levhası', DIGER: 'Diğer',
}

const ENTITY_TYPES = [
    { value: 'MACHINE', label: 'Makine' },
    { value: 'OPERATOR', label: 'Operatör' },
    { value: 'CUSTOMER', label: 'Müşteri' },
]

export default function BelgelerPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [entityFilter, setEntityFilter] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState({ entityType: 'MACHINE', entityId: '', type: 'SIGORTA', title: '', expiryDate: '', alertDays: '30', notes: '' })
    const [entities, setEntities] = useState<any[]>([])

    const load = async () => {
        setLoading(true)
        const params = new URLSearchParams()
        if (entityFilter) params.set('entityType', entityFilter)
        const res = await fetch(`/api/belgeler?${params}&daysAhead=60`)
        const json = await res.json()
        setData(json)
        setLoading(false)
    }

    useEffect(() => { load() }, [entityFilter])

    useEffect(() => {
        const loadEntities = async () => {
            const type = form.entityType
            let url = type === 'MACHINE' ? '/api/makineler' : type === 'OPERATOR' ? '/api/operatorler' : '/api/musteriler'
            const res = await fetch(url)
            const json = await res.json()
            setEntities(json.makineler || json.operatorler || json.musteriler || [])
        }
        loadEntities()
    }, [form.entityType])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await fetch('/api/belgeler', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        })
        setShowModal(false)
        load()
    }

    if (loading) return <div className="spinner" style={{ margin: '3rem auto' }} />
    const { documents = [], stats = {} } = data || {}

    const expired = documents.filter((d: any) => d.isExpired)
    const expiringSoon = documents.filter((d: any) => d.isExpiringSoon)
    const ok = documents.filter((d: any) => !d.isExpired && !d.isExpiringSoon)

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Belge & Sertifika Yönetimi</h1>
                    <p className="page-subtitle">Makine, operatör ve müşteri belgelerini takip edin</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={16} /> Belge Ekle
                </button>
            </div>

            {/* Özet */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                    { label: 'Süresi Dolmuş', value: stats.expired || 0, color: '#dc2626', bg: '#fee2e2', icon: <AlertTriangle size={18} /> },
                    { label: 'Yakında Dolacak', value: stats.expiringSoon || 0, color: '#d97706', bg: '#fef3c7', icon: <Clock size={18} /> },
                    { label: 'Geçerli', value: ok.length, color: '#059669', bg: '#d1fae5', icon: <CheckCircle size={18} /> },
                    { label: 'Toplam', value: stats.total || 0, color: '#2563eb', bg: '#dbeafe', icon: <Shield size={18} /> },
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
            {(expired.length > 0 || expiringSoon.length > 0) && (
                <div style={{ marginBottom: '1rem' }}>
                    {expired.slice(0, 3).map((d: any) => (
                        <div key={d.id} className="alert alert-danger" style={{ marginBottom: '0.5rem' }}>
                            <AlertTriangle size={15} />
                            <strong>{d.title}</strong> — Süresi doldu! ({formatDate(d.expiryDate)})
                        </div>
                    ))}
                    {expiringSoon.slice(0, 3).map((d: any) => (
                        <div key={d.id} className="alert alert-warning" style={{ marginBottom: '0.5rem' }}>
                            <Clock size={15} />
                            <strong>{d.title}</strong> — {d.daysLeft} gün içinde doluyor ({formatDate(d.expiryDate)})
                        </div>
                    ))}
                </div>
            )}

            {/* Filtre */}
            <div className="card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
                {[{ value: '', label: 'Tümü' }, ...ENTITY_TYPES].map(t => (
                    <button key={t.value} onClick={() => setEntityFilter(t.value)}
                        style={{
                            padding: '0.25rem 0.75rem', borderRadius: '9999px', border: 'none', cursor: 'pointer',
                            fontSize: '0.8125rem', fontWeight: 500,
                            background: entityFilter === t.value ? '#2563eb' : '#f1f5f9',
                            color: entityFilter === t.value ? '#fff' : '#64748b',
                        }}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Tablo */}
            <div className="card">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Belge</th>
                            <th>Tür</th>
                            <th>Varlık Tipi</th>
                            <th>Son Geçerlilik</th>
                            <th>Durum</th>
                        </tr>
                    </thead>
                    <tbody>
                        {documents.map((d: any) => (
                            <tr key={d.id}>
                                <td style={{ fontWeight: 600 }}>{d.title}</td>
                                <td style={{ fontSize: '0.8rem' }}>{DOC_TYPES[d.type] || d.type}</td>
                                <td>
                                    <span style={{ padding: '0.15rem 0.55rem', borderRadius: '9999px', fontSize: '0.7rem', background: '#e0f2fe', color: '#0369a1' }}>
                                        {d.entityType}
                                    </span>
                                </td>
                                <td style={{ fontSize: '0.8125rem', color: '#64748b' }}>{d.expiryDate ? formatDate(d.expiryDate) : '—'}</td>
                                <td>
                                    {d.isExpired ? (
                                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', background: '#fee2e2', color: '#dc2626', fontWeight: 600 }}>❌ Süresi Doldu</span>
                                    ) : d.isExpiringSoon ? (
                                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', background: '#fef3c7', color: '#d97706', fontWeight: 600 }}>⚠️ {d.daysLeft} gün</span>
                                    ) : (
                                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', background: '#d1fae5', color: '#059669', fontWeight: 600 }}>✅ Geçerli</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
                    <div className="card" style={{ width: '100%', maxWidth: 480, padding: '1.5rem' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Yeni Belge Ekle</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label className="form-label">Varlık Tipi</label>
                                    <select className="form-input" value={form.entityType} onChange={e => setForm({ ...form, entityType: e.target.value, entityId: '' })}>
                                        {ENTITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Varlık Seç</label>
                                    <select className="form-input" value={form.entityId} onChange={e => setForm({ ...form, entityId: e.target.value })} required>
                                        <option value="">Seçin...</option>
                                        {entities.map((e: any) => (
                                            <option key={e.id} value={e.id}>
                                                {e.brand ? `${e.brand} ${e.model} (${e.plate || ''})` : e.name || e.companyName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Belge Türü</label>
                                    <select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                        {Object.entries(DOC_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Başlık</label>
                                    <input className="form-input" placeholder="Belge adı" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="form-label">Son Geçerlilik</label>
                                    <input type="date" className="form-input" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} />
                                </div>
                                <div>
                                    <label className="form-label">Uyarı (gün önce)</label>
                                    <input type="number" className="form-input" value={form.alertDays} onChange={e => setForm({ ...form, alertDays: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="form-label">Notlar</label>
                                <textarea className="form-input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
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
