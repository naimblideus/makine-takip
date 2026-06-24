'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Store, Plus, X, Building2, Truck, TrendingUp, Percent, Edit, Trash2, Shield, CheckCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const emptyForm = { name: '', contactName: '', phone: '', email: '', city: '', commissionFirstYear: '25', commissionRenewal: '10', notes: '' }

export default function BayilerPage() {
    const { data: session } = useSession()
    const isSuperAdmin = (session?.user as any)?.isSuperAdmin
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editId, setEditId] = useState<string | null>(null)
    const [form, setForm] = useState(emptyForm)
    const [saving, setSaving] = useState(false)

    const load = async () => {
        const res = await fetch('/api/admin/dealers')
        if (res.ok) setData(await res.json())
        setLoading(false)
    }
    useEffect(() => { if (isSuperAdmin) load() }, [isSuperAdmin])

    const submit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true)
        await fetch(editId ? `/api/admin/dealers/${editId}` : '/api/admin/dealers', {
            method: editId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        })
        setSaving(false); setShowForm(false); setEditId(null); setForm(emptyForm); load()
    }

    const startEdit = (d: any) => {
        setEditId(d.id)
        setForm({
            name: d.name, contactName: d.contactName || '', phone: d.phone || '', email: d.email || '',
            city: d.city || '', commissionFirstYear: String(d.commissionFirstYear), commissionRenewal: String(d.commissionRenewal), notes: d.notes || '',
        })
        setShowForm(true)
    }

    const del = async (id: string) => {
        if (!confirm('Bu bayiyi silmek istediğinize emin misiniz? Bağlı işletmelerin bayi bağı kaldırılır.')) return
        await fetch(`/api/admin/dealers/${id}`, { method: 'DELETE' }); load()
    }

    if (!isSuperAdmin) return (
        <div style={{ textAlign: 'center', padding: '5rem 0' }}>
            <Shield size={32} color="var(--danger)" /><h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '1rem' }}>Erişim Reddedildi</h2>
            <p style={{ color: 'var(--text-muted)' }}>Bu sayfa Süper Admin yetkisi gerektirir.</p>
        </div>
    )
    if (loading) return <div className="spinner" style={{ margin: '3rem auto' }} />

    const dealers = data?.dealers || []
    const totals = data?.totals || {}

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 36, height: 36, borderRadius: 10, background: '#0ea5e920', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Store size={20} color="#0ea5e9" /></span>
                        Bayi Ağı
                    </h1>
                    <p className="page-subtitle">Kanal ortakları, komisyon ve getirdikleri gelir</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(true) }}><Plus size={16} /> Yeni Bayi</button>
            </div>

            {/* Toplamlar */}
            <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
                {[
                    { icon: <Store size={20} />, c: '#0ea5e9', v: totals.dealerCount || 0, l: 'Bayi' },
                    { icon: <Building2 size={20} />, c: '#8b5cf6', v: totals.tenantCount || 0, l: 'Getirdikleri İşletme' },
                    { icon: <TrendingUp size={20} />, c: '#22c55e', v: formatCurrency(totals.mrr || 0), l: 'Aylık Tekrarlayan (MRR)' },
                    { icon: <Percent size={20} />, c: '#f59e0b', v: formatCurrency(totals.commissionMonthly || 0), l: 'Aylık Komisyon (toplam)' },
                ].map((s, i) => (
                    <div className="stat-card" key={i}>
                        <div className="stat-card-icon" style={{ background: s.c + '20', color: s.c }}>{s.icon}</div>
                        <div className="stat-card-content">
                            <div className="stat-card-value" style={{ color: s.c, fontSize: typeof s.v === 'string' ? '1.1rem' : undefined }}>{s.v}</div>
                            <div className="stat-card-label">{s.l}</div>
                        </div>
                    </div>
                ))}
            </div>

            {showForm && (
                <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>{editId ? 'Bayi Düzenle' : 'Yeni Bayi'}</h2>
                        <button onClick={() => { setShowForm(false); setEditId(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                    </div>
                    <form onSubmit={submit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                            <div><label className="label">Bayi Adı *</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                            <div><label className="label">Yetkili</label><input className="input" value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} /></div>
                            <div><label className="label">Şehir</label><input className="input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
                            <div><label className="label">Telefon</label><input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                            <div><label className="label">E-posta</label><input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                            <div></div>
                            <div><label className="label">Komisyon — 1. Yıl (%)</label><input className="input" type="number" step="0.1" value={form.commissionFirstYear} onChange={e => setForm({ ...form, commissionFirstYear: e.target.value })} /></div>
                            <div><label className="label">Komisyon — Yenileme (%)</label><input className="input" type="number" step="0.1" value={form.commissionRenewal} onChange={e => setForm({ ...form, commissionRenewal: e.target.value })} /></div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '1.25rem' }}>
                            <button type="button" className="btn btn-outline" onClick={() => { setShowForm(false); setEditId(null) }}>İptal</button>
                            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Kaydediliyor...' : <><CheckCircle size={16} /> {editId ? 'Güncelle' : 'Oluştur'}</>}</button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {dealers.map((d: any) => (
                    <div key={d.id} className="card" style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {d.name}
                                    {!d.isActive && <span className="badge" style={{ background: '#fee2e2', color: '#dc2626', fontSize: '0.65rem' }}>Pasif</span>}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                    {[d.contactName, d.city, d.phone].filter(Boolean).join(' · ') || '—'}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                    Komisyon: 1. yıl %{Number(d.commissionFirstYear)} · yenileme %{Number(d.commissionRenewal)}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 4 }}>
                                <button className="btn btn-ghost btn-sm" onClick={() => startEdit(d)}><Edit size={14} /></button>
                                <button className="btn btn-ghost btn-sm" onClick={() => del(d.id)}><Trash2 size={14} color="var(--danger)" /></button>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
                            <div style={{ background: '#f8fafc', borderRadius: '0.5rem', padding: '0.6rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>İşletme</div>
                                <div style={{ fontWeight: 700 }}>{d.tenantCount}</div>
                            </div>
                            <div style={{ background: '#f8fafc', borderRadius: '0.5rem', padding: '0.6rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Makine</div>
                                <div style={{ fontWeight: 700 }}>{d.machineCount}</div>
                            </div>
                            <div style={{ background: '#ecfdf5', borderRadius: '0.5rem', padding: '0.6rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.68rem', color: '#059669' }}>Aylık MRR</div>
                                <div style={{ fontWeight: 700, color: '#059669' }}>{formatCurrency(d.mrr)}</div>
                            </div>
                            <div style={{ background: '#fffbeb', borderRadius: '0.5rem', padding: '0.6rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.68rem', color: '#d97706' }}>Aylık Komisyon</div>
                                <div style={{ fontWeight: 700, color: '#d97706' }}>{formatCurrency(d.commissionMonthly)}</div>
                            </div>
                        </div>
                        {d.tenants?.length > 0 && (
                            <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: '#64748b' }}>
                                İşletmeler: {d.tenants.map((t: any) => `${t.name} (${t._count.machines} mk)`).join(', ')}
                            </div>
                        )}
                    </div>
                ))}
                {dealers.length === 0 && <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Henüz bayi yok. İl başına bir bayi ekleyerek Anadolu&apos;da ölçeklenin.</div>}
            </div>

            <div style={{ marginTop: '1.25rem', fontSize: '0.78rem', color: '#94a3b8' }}>
                Model: bayi donanım+montajı yapar, abonelik faturası ve müşteri verisi merkezde kalır. Bayiye yazılım gelirinden 1. yıl komisyon, yenilemede daha düşük.
            </div>
        </div>
    )
}
