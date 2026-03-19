'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText, Plus, Clock, CheckCircle, AlertTriangle, TrendingUp, Eye, Send, ChevronRight } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    TASLAK: { label: 'Taslak', color: '#64748b', bg: '#f1f5f9' },
    ONAY_BEKLIYOR: { label: 'Onay Bekliyor', color: '#d97706', bg: '#fef3c7' },
    ONAYLANDI: { label: 'Onaylandı', color: '#2563eb', bg: '#dbeafe' },
    MUSTERI_ONAY_BEKLIYOR: { label: 'Müşteri Onayı Bekliyor', color: '#7c3aed', bg: '#ede9fe' },
    MUSTERI_ONAYLADI: { label: 'Müşteri Onayladı', color: '#059669', bg: '#d1fae5' },
    FATURALANDI: { label: 'Faturalındı', color: '#0369a1', bg: '#e0f2fe' },
    REDDEDILDI: { label: 'Reddedildi', color: '#dc2626', bg: '#fee2e2' },
}

export default function HakedisPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [rentals, setRentals] = useState<any[]>([])
    const [form, setForm] = useState({
        rentalId: '', periodStart: '', periodEnd: '', periodLabel: '',
        totalHours: '', workingDays: '', unitPrice: '', periodType: 'GUNLUK',
        fuelCost: '', operatorCost: '', transportCost: '', discount: '', taxRate: '20', notes: '',
    })

    const load = async () => {
        setLoading(true)
        const params = new URLSearchParams()
        if (statusFilter) params.set('status', statusFilter)
        const res = await fetch(`/api/hakedis?${params}`)
        const json = await res.json()
        setData(json)
        setLoading(false)
    }

    useEffect(() => { load() }, [statusFilter])

    useEffect(() => {
        fetch('/api/kiralamalar?status=AKTIF').then(r => r.json()).then(j => setRentals(j.rentals || []))
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await fetch('/api/hakedis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        })
        setShowModal(false)
        load()
    }

    const handleStatusChange = async (id: string, status: string) => {
        await fetch(`/api/hakedis/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        })
        load()
    }

    if (loading) return <div className="spinner" style={{ margin: '3rem auto' }} />

    const { hakedisler = [], stats = {} } = data || {}

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Hakedişler</h1>
                    <p className="page-subtitle">Kiralama dönem fatura ve onay takibi</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={16} /> Yeni Hakediş
                </button>
            </div>

            {/* Özet Kartlar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                    { label: 'Taslak', value: stats.taslak || 0, color: '#64748b', bg: '#f1f5f9', icon: <FileText size={18} /> },
                    { label: 'Onay Bekliyor', value: stats.onayBekliyor || 0, color: '#d97706', bg: '#fef3c7', icon: <Clock size={18} /> },
                    { label: 'Onaylandı', value: stats.onaylandi || 0, color: '#059669', bg: '#d1fae5', icon: <CheckCircle size={18} /> },
                    { label: 'Faturalındı', value: stats.faturalandi || 0, color: '#2563eb', bg: '#dbeafe', icon: <TrendingUp size={18} /> },
                ].map(k => (
                    <div key={k.label} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="stat-card-icon" style={{ background: k.bg, color: k.color }}>{k.icon}</div>
                        <div>
                            <div className="stat-card-value" style={{ color: k.color }}>{k.value}</div>
                            <div className="stat-card-label">{k.label}</div>
                        </div>
                    </div>
                ))}
                <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="stat-card-icon" style={{ background: '#d1fae5', color: '#059669' }}><TrendingUp size={18} /></div>
                    <div>
                        <div className="stat-card-value" style={{ color: '#059669', fontSize: '1.1rem' }}>{formatCurrency(stats.toplamTutar || 0)}</div>
                        <div className="stat-card-label">Toplam Tutar</div>
                    </div>
                </div>
            </div>

            {/* Filtre */}
            <div className="card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['', ...Object.keys(STATUS_CONFIG)].map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                        style={{
                            padding: '0.25rem 0.75rem', borderRadius: '9999px', border: 'none', cursor: 'pointer',
                            fontSize: '0.8125rem', fontWeight: 500,
                            background: statusFilter === s ? '#2563eb' : '#f1f5f9',
                            color: statusFilter === s ? '#fff' : '#64748b',
                        }}>
                        {s ? STATUS_CONFIG[s].label : 'Tümü'}
                    </button>
                ))}
            </div>

            {/* Liste */}
            <div className="card">
                {hakedisler.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                        <FileText size={40} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
                        <div>Hakediş bulunamadı</div>
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Makine</th>
                                <th>Müşteri</th>
                                <th>Dönem</th>
                                <th>Saat / Gün</th>
                                <th>Tutar</th>
                                <th>Durum</th>
                                <th>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {hakedisler.map((h: any) => {
                                const st = STATUS_CONFIG[h.status] || STATUS_CONFIG.TASLAK
                                return (
                                    <tr key={h.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{h.rental?.machine?.brand} {h.rental?.machine?.model}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{h.rental?.machine?.plate}</div>
                                        </td>
                                        <td style={{ fontSize: '0.8125rem' }}>{h.rental?.customer?.companyName}</td>
                                        <td style={{ fontSize: '0.75rem', color: '#64748b' }}>{h.periodLabel}</td>
                                        <td style={{ fontSize: '0.8125rem' }}>
                                            {Number(h.totalHours) > 0 && <div>{Number(h.totalHours)}s</div>}
                                            {h.workingDays > 0 && <div style={{ color: '#94a3b8' }}>{h.workingDays} gün</div>}
                                        </td>
                                        <td style={{ fontWeight: 700, color: '#059669' }}>{formatCurrency(Number(h.totalAmount))}</td>
                                        <td>
                                            <span style={{ padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600, background: st.bg, color: st.color }}>
                                                {st.label}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.375rem' }}>
                                                {h.status === 'TASLAK' && (
                                                    <button className="btn btn-sm btn-outline" onClick={() => handleStatusChange(h.id, 'ONAY_BEKLIYOR')}>
                                                        Onaya Gönder
                                                    </button>
                                                )}
                                                {h.status === 'ONAY_BEKLIYOR' && (
                                                    <button className="btn btn-sm btn-primary" onClick={() => handleStatusChange(h.id, 'ONAYLANDI')}>
                                                        Onayla
                                                    </button>
                                                )}
                                                {h.status === 'ONAYLANDI' && (
                                                    <button className="btn btn-sm btn-outline" onClick={() => handleStatusChange(h.id, 'MUSTERI_ONAY_BEKLIYOR')}>
                                                        <Send size={13} /> Müşteriye Gönder
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
                    <div className="card" style={{ width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto', padding: '1.5rem' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Yeni Hakediş Oluştur</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                                <label className="form-label">Kiralama</label>
                                <select className="form-input" value={form.rentalId} onChange={e => setForm({ ...form, rentalId: e.target.value })} required>
                                    <option value="">Seçin...</option>
                                    {rentals.map((r: any) => (
                                        <option key={r.id} value={r.id}>{r.machine?.brand} {r.machine?.model} — {r.customer?.companyName}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label className="form-label">Dönem Başlangıç</label>
                                    <input type="date" className="form-input" value={form.periodStart} onChange={e => setForm({ ...form, periodStart: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="form-label">Dönem Bitiş</label>
                                    <input type="date" className="form-input" value={form.periodEnd} onChange={e => setForm({ ...form, periodEnd: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="form-label">Çalışma Saati</label>
                                    <input type="number" className="form-input" placeholder="0" value={form.totalHours} onChange={e => setForm({ ...form, totalHours: e.target.value })} />
                                </div>
                                <div>
                                    <label className="form-label">Çalışma Günü</label>
                                    <input type="number" className="form-input" placeholder="0" value={form.workingDays} onChange={e => setForm({ ...form, workingDays: e.target.value })} />
                                </div>
                                <div>
                                    <label className="form-label">Birim Fiyat (₺)</label>
                                    <input type="number" className="form-input" placeholder="0" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="form-label">Dönem Tipi</label>
                                    <select className="form-input" value={form.periodType} onChange={e => setForm({ ...form, periodType: e.target.value })}>
                                        <option value="SAATLIK">Saatlik</option>
                                        <option value="GUNLUK">Günlük</option>
                                        <option value="HAFTALIK">Haftalık</option>
                                        <option value="AYLIK">Aylık</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Yakıt (₺)</label>
                                    <input type="number" className="form-input" placeholder="0" value={form.fuelCost} onChange={e => setForm({ ...form, fuelCost: e.target.value })} />
                                </div>
                                <div>
                                    <label className="form-label">Operatör Ücreti (₺)</label>
                                    <input type="number" className="form-input" placeholder="0" value={form.operatorCost} onChange={e => setForm({ ...form, operatorCost: e.target.value })} />
                                </div>
                                <div>
                                    <label className="form-label">Nakliye (₺)</label>
                                    <input type="number" className="form-input" placeholder="0" value={form.transportCost} onChange={e => setForm({ ...form, transportCost: e.target.value })} />
                                </div>
                                <div>
                                    <label className="form-label">İndirim (₺)</label>
                                    <input type="number" className="form-input" placeholder="0" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="form-label">Notlar</label>
                                <textarea className="form-input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>İptal</button>
                                <button type="submit" className="btn btn-primary">Oluştur</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
