'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Phone, Mail, Building2, AlertTriangle, Plus, MessageSquare } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

const INTERACTION_TYPES: Record<string, string> = {
    TELEFON: '📞 Telefon', EMAIL: '📧 E-posta', TOPLANTI: '🤝 Toplantı',
    TEKLIF: '📄 Teklif', ZIYARET: '🚗 Ziyaret', DIGER: '💬 Diğer',
}

export default function MusteriCRMPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [customer, setCustomer] = useState<any>(null)
    const [interactions, setInteractions] = useState<any[]>([])
    const [crmSummary, setCrmSummary] = useState<any>({})
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState<'genel' | 'kiralamalar' | 'belgeler' | 'etkilesimler'>('genel')
    const [showInterModal, setShowInterModal] = useState(false)
    const [interForm, setInterForm] = useState({ type: 'TELEFON', title: '', description: '', nextAction: '', nextActionDate: '' })

    const load = async () => {
        const [custRes, crmRes] = await Promise.all([
            fetch(`/api/musteriler/${id}`),
            fetch(`/api/musteriler/${id}/crm`),
        ])
        const cust = await custRes.json()
        const crm = await crmRes.json()
        setCustomer(cust)
        setInteractions(crm.interactions || [])
        setCrmSummary(crm.crmSummary || {})
        setLoading(false)
    }

    useEffect(() => { load() }, [id])

    const addInteraction = async (e: React.FormEvent) => {
        e.preventDefault()
        await fetch(`/api/musteriler/${id}/crm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(interForm),
        })
        setShowInterModal(false)
        load()
    }

    if (loading) return <div className="spinner" style={{ margin: '3rem auto' }} />
    if (!customer) return <div className="alert alert-danger">Müşteri bulunamadı</div>

    const { rentals = [], documents = [], _count } = customer
    const tabs = [
        { key: 'genel', label: 'Genel' },
        { key: 'kiralamalar', label: `Kiralamalar (${_count?.rentals || 0})` },
        { key: 'belgeler', label: `Belgeler (${documents?.length || 0})` },
        { key: 'etkilesimler', label: `Etkileşimler (${interactions.length})` },
    ]

    return (
        <div>
            <div className="page-header">
                <div>
                    <Link href="/musteriler" className="btn btn-sm btn-outline" style={{ marginBottom: '0.5rem', display: 'inline-flex' }}>
                        <ArrowLeft size={14} /> Geri
                    </Link>
                    <h1 className="page-title">{customer.companyName}</h1>
                    <p className="page-subtitle">{customer.contactPerson} {customer.taxNumber && `• Vergi: ${customer.taxNumber}`}</p>
                </div>
                {customer.isBlacklisted && (
                    <div style={{ padding: '0.5rem 1rem', background: '#fee2e2', color: '#dc2626', borderRadius: '0.625rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem' }}>
                        <AlertTriangle size={16} /> KARA LİSTE
                    </div>
                )}
            </div>

            {/* CRM Özet */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                    { label: 'Toplam Gelir', value: formatCurrency(crmSummary.totalRevenue || 0), color: '#059669', icon: '💰' },
                    { label: 'Bekleyen Borç', value: formatCurrency(crmSummary.pendingDebt || 0), color: '#d97706', icon: '⏳' },
                    { label: 'Kiralama', value: `${crmSummary.totalRentals || 0}`, color: '#2563eb', icon: '📋' },
                    { label: 'Aktif', value: `${crmSummary.activeRentals || 0}`, color: '#7c3aed', icon: '✅' },
                ].map(k => (
                    <div key={k.label} className="stat-card" style={{ textAlign: 'center', padding: '1rem' }}>
                        <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{k.icon}</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: k.color }}>{k.value}</div>
                        <div className="stat-card-label">{k.label}</div>
                    </div>
                ))}
            </div>

            {/* Sekme Başlıkları */}
            <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '2px solid #f1f5f9', marginBottom: '1rem' }}>
                {tabs.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key as any)}
                        style={{ padding: '0.5rem 1rem', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, color: tab === t.key ? '#2563eb' : '#64748b', borderBottom: tab === t.key ? '2px solid #2563eb' : '2px solid transparent', marginBottom: '-2px' }}>
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'genel' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                    <div className="card" style={{ padding: '1.25rem' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '1rem' }}>İletişim</h3>
                        {[
                            { icon: <Phone size={15} />, label: 'Telefon', value: customer.phone },
                            { icon: <Mail size={15} />, label: 'E-posta', value: customer.email },
                            { icon: <Building2 size={15} />, label: 'Adres', value: customer.address },
                        ].filter(f => f.value).map(f => (
                            <div key={f.label} style={{ display: 'flex', gap: '0.625rem', marginBottom: '0.625rem', fontSize: '0.8125rem' }}>
                                <span style={{ color: '#94a3b8', flexShrink: 0, marginTop: 1 }}>{f.icon}</span>
                                <div><div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{f.label}</div><div style={{ fontWeight: 500 }}>{f.value}</div></div>
                            </div>
                        ))}
                    </div>
                    {customer.notes && (
                        <div className="card" style={{ padding: '1.25rem' }}>
                            <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.75rem' }}>Notlar</h3>
                            <p style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.6 }}>{customer.notes}</p>
                        </div>
                    )}
                </div>
            )}

            {tab === 'kiralamalar' && (
                <div className="card">
                    <table className="table">
                        <thead><tr><th>Makine</th><th>Süre</th><th>Durum</th><th></th></tr></thead>
                        <tbody>
                            {rentals.map((r: any) => (
                                <tr key={r.id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{r.machine?.brand} {r.machine?.model}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{r.machine?.plate}</div>
                                    </td>
                                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{formatDate(r.startDate)} → {r.endDate ? formatDate(r.endDate) : '—'}</td>
                                    <td><span style={{ padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600, background: '#f1f5f9', color: r.status === 'AKTIF' ? '#059669' : '#64748b' }}>{r.status}</span></td>
                                    <td><Link href={`/kiralamalar/${r.id}`} className="btn btn-sm btn-outline">Detay</Link></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {tab === 'belgeler' && (
                <div className="card" style={{ padding: '1rem' }}>
                    {(!documents || documents.length === 0) ? (
                        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>Belge yok</div>
                    ) : documents.map((d: any) => {
                        const exp = d.expiryDate && new Date(d.expiryDate) < new Date()
                        return (
                            <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem', border: '1px solid #f1f5f9', borderRadius: '0.5rem', marginBottom: '0.5rem' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{d.title}</div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: exp ? '#dc2626' : '#059669' }}>{exp ? '❌ Süresi Dolmuş' : '✅ Geçerli'}</span>
                            </div>
                        )
                    })}
                </div>
            )}

            {tab === 'etkilesimler' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => setShowInterModal(true)}><Plus size={14} /> Ekle</button>
                    </div>
                    {interactions.length === 0 ? (
                        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                            <MessageSquare size={32} style={{ opacity: 0.4, marginBottom: '0.75rem' }} />
                            <div>Etkileşim kaydı yok</div>
                        </div>
                    ) : interactions.map((inter: any) => (
                        <div key={inter.id} className="card" style={{ padding: '1rem', marginBottom: '0.5rem', display: 'flex', gap: '0.875rem' }}>
                            <div style={{ fontSize: '1.25rem', flexShrink: 0 }}>{INTERACTION_TYPES[inter.type]?.split(' ')[0] || '💬'}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{inter.title}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{formatDate(inter.createdAt)}</div>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{INTERACTION_TYPES[inter.type] || inter.type}</div>
                                {inter.description && <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.375rem 0 0' }}>{inter.description}</p>}
                                {inter.nextAction && (
                                    <div style={{ marginTop: '0.5rem', padding: '0.25rem 0.5rem', background: '#fef3c7', borderRadius: '0.375rem', fontSize: '0.75rem', color: '#92400e' }}>
                                        ⏭ {inter.nextAction}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showInterModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
                    <div className="card" style={{ width: '100%', maxWidth: 460, padding: '1.5rem' }}>
                        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>Etkileşim Ekle</h2>
                        <form onSubmit={addInteraction} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div><label className="form-label">Tür</label>
                                    <select className="form-input" value={interForm.type} onChange={e => setInterForm({ ...interForm, type: e.target.value })}>
                                        {Object.entries(INTERACTION_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>
                                <div><label className="form-label">Başlık</label>
                                    <input className="form-input" value={interForm.title} onChange={e => setInterForm({ ...interForm, title: e.target.value })} required />
                                </div>
                            </div>
                            <div><label className="form-label">Açıklama</label>
                                <textarea className="form-input" rows={3} value={interForm.description} onChange={e => setInterForm({ ...interForm, description: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div><label className="form-label">Sonraki Aksiyon</label>
                                    <input className="form-input" value={interForm.nextAction} onChange={e => setInterForm({ ...interForm, nextAction: e.target.value })} />
                                </div>
                                <div><label className="form-label">Tarih</label>
                                    <input type="date" className="form-input" value={interForm.nextActionDate} onChange={e => setInterForm({ ...interForm, nextActionDate: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowInterModal(false)}>İptal</button>
                                <button type="submit" className="btn btn-primary">Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
