'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
    Shield, Building2, Users, Truck, Plus, X, CheckCircle,
    Edit, Trash2, Power, Globe, BarChart3, Key
} from 'lucide-react'

const ROLE_LABEL: Record<string, string> = {
    ADMIN: 'Yönetici',
    PERSONEL: 'Personel',
    MUHASEBE: 'Muhasebe',
}

export default function SuperAdminPage() {
    const { data: session } = useSession()
    const [tenants, setTenants] = useState<any[]>([])
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editId, setEditId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

    const isSuperAdmin = (session?.user as any)?.isSuperAdmin

    const [form, setForm] = useState({
        name: '', phone: '', email: '', address: '',
        taxOffice: '', taxNumber: '',
        adminName: '', adminEmail: '', adminPassword: '',
    })

    const load = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/tenants')
            if (res.ok) {
                const d = await res.json()
                setTenants(d.tenants || [])
                setStats(d.stats)
            }
        } catch { }
        setLoading(false)
    }

    useEffect(() => { if (isSuperAdmin) load() }, [isSuperAdmin])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMsg(null)
        try {
            const res = await fetch('/api/admin/tenants', {
                method: editId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editId ? { id: editId, ...form } : form),
            })
            const d = await res.json()
            if (!res.ok) throw new Error(d.error || 'Hata')
            setMsg({ type: 'ok', text: editId ? 'İşletme güncellendi' : 'İşletme oluşturuldu' })
            setShowForm(false)
            setEditId(null)
            resetForm()
            load()
        } catch (err: any) {
            setMsg({ type: 'err', text: err.message })
        } finally {
            setSaving(false)
        }
    }

    const startEdit = (t: any) => {
        setEditId(t.id)
        setForm({
            name: t.name, phone: t.phone || '', email: t.email || '',
            address: t.address || '', taxOffice: t.taxOffice || '', taxNumber: t.taxNumber || '',
            adminName: '', adminEmail: t.users?.[0]?.email || '', adminPassword: '',
        })
        setShowForm(true)
    }

    const deleteTenant = async (id: string) => {
        if (!confirm('Bu işletmeyi ve TÜM verilerini silmek istediğinize emin misiniz?')) return
        await fetch(`/api/admin/tenants?id=${id}`, { method: 'DELETE' })
        load()
    }

    const resetForm = () => setForm({
        name: '', phone: '', email: '', address: '',
        taxOffice: '', taxNumber: '',
        adminName: '', adminEmail: '', adminPassword: '',
    })

    if (!isSuperAdmin) {
        return (
            <div className="page-container">
                <div style={{ textAlign: 'center', padding: '5rem 0' }}>
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                        <Shield size={32} color="var(--danger)" />
                    </div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Erişim Reddedildi</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Bu sayfaya erişmek için Süper Admin yetkisi gereklidir.</p>
                </div>
            </div>
        )
    }

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
            <div className="spinner" />
        </div>
    )

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 36, height: 36, borderRadius: 10, background: '#8b5cf620', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Shield size={20} color="#8b5cf6" />
                        </span>
                        Süper Admin Paneli
                    </h1>
                    <p className="page-subtitle">Tüm işletmeleri yönetin</p>
                </div>
                <button className="btn btn-primary" onClick={() => { resetForm(); setEditId(null); setShowForm(true) }}>
                    <Plus size={16} /> Yeni İşletme
                </button>
            </div>

            {/* Mesaj */}
            {msg && (
                <div className={`alert ${msg.type === 'ok' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {msg.type === 'ok' ? <CheckCircle size={16} /> : null}
                    {msg.text}
                    <button onClick={() => setMsg(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><X size={14} /></button>
                </div>
            )}

            {/* İstatistikler */}
            {stats && (
                <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
                    <div className="stat-card">
                        <div className="stat-card-icon" style={{ background: '#8b5cf620', color: '#8b5cf6' }}><Building2 size={20} /></div>
                        <div className="stat-card-content">
                            <div className="stat-card-value" style={{ color: '#8b5cf6' }}>{stats.totalTenants}</div>
                            <div className="stat-card-label">Toplam İşletme</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-icon" style={{ background: '#3b82f620', color: '#3b82f6' }}><Users size={20} /></div>
                        <div className="stat-card-content">
                            <div className="stat-card-value" style={{ color: '#3b82f6' }}>{stats.totalUsers}</div>
                            <div className="stat-card-label">Toplam Kullanıcı</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-icon" style={{ background: '#f59e0b20', color: '#f59e0b' }}><Truck size={20} /></div>
                        <div className="stat-card-content">
                            <div className="stat-card-value" style={{ color: '#f59e0b' }}>{stats.totalMachines}</div>
                            <div className="stat-card-label">Toplam Makine</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-card-icon" style={{ background: '#22c55e20', color: '#22c55e' }}><BarChart3 size={20} /></div>
                        <div className="stat-card-content">
                            <div className="stat-card-value" style={{ color: '#22c55e' }}>{stats.totalRentals}</div>
                            <div className="stat-card-label">Toplam Kiralama</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Form */}
            {showForm && (
                <div className="card animate-slide-up" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Building2 size={18} color="#8b5cf6" />
                            {editId ? 'İşletme Düzenle' : 'Yeni İşletme Oluştur'}
                        </h2>
                        <button onClick={() => { setShowForm(false); setEditId(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                            <X size={18} />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label className="label">İşletme Adı *</label>
                                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div>
                                <label className="label">Telefon</label>
                                <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                            </div>
                            <div>
                                <label className="label">E-posta</label>
                                <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label className="label">Adres</label>
                                <input className="input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                            </div>
                            <div>
                                <label className="label">Vergi No</label>
                                <input className="input" value={form.taxNumber} onChange={e => setForm({ ...form, taxNumber: e.target.value })} />
                            </div>
                        </div>

                        {/* Admin bilgileri */}
                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--surface-2)', borderRadius: '0.75rem' }}>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Key size={14} /> Admin Hesabı
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                {!editId && (
                                    <div>
                                        <label className="label">Admin Adı</label>
                                        <input className="input" value={form.adminName} onChange={e => setForm({ ...form, adminName: e.target.value })} />
                                    </div>
                                )}
                                <div>
                                    <label className="label">Admin E-posta {!editId && '*'}</label>
                                    <input className="input" type="email" value={form.adminEmail} onChange={e => setForm({ ...form, adminEmail: e.target.value })} required={!editId} />
                                </div>
                                <div>
                                    <label className="label">{editId ? 'Yeni Şifre (boş = değiştirme)' : 'Admin Şifre *'}</label>
                                    <input className="input" type="password" value={form.adminPassword} onChange={e => setForm({ ...form, adminPassword: e.target.value })} required={!editId} placeholder={editId ? 'Boş bırakın = şifre değişmez' : ''} />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '1.25rem' }}>
                            <button type="button" className="btn btn-outline" onClick={() => { setShowForm(false); setEditId(null) }}>İptal</button>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? 'Kaydediliyor...' : <><CheckCircle size={16} /> {editId ? 'Güncelle' : 'Oluştur'}</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Tablo */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title"><Globe size={18} /> İşletmeler ({tenants.length})</h2>
                </div>
                <div className="table-responsive">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>İŞLETME</th>
                                <th>İLETİŞİM</th>
                                <th>KULLANICI</th>
                                <th>MAKİNE</th>
                                <th>KİRALAMA</th>
                                <th>MÜŞTERİ</th>
                                <th>ADMIN</th>
                                <th>İŞLEM</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tenants.map(t => (
                                <tr key={t.id}>
                                    <td>
                                        <div style={{ fontWeight: 700 }}>{t.name}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.id.slice(0, 8)}...</div>
                                    </td>
                                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                        {t.phone || t.email || '—'}
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{t._count?.users || 0}</td>
                                    <td style={{ fontWeight: 600 }}>{t._count?.machines || 0}</td>
                                    <td>{t._count?.rentals || 0}</td>
                                    <td>{t._count?.customers || 0}</td>
                                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {t.users?.[0]?.email || '—'}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <button className="btn btn-ghost btn-sm" onClick={() => startEdit(t)} title="Düzenle">
                                                <Edit size={14} />
                                            </button>
                                            <button className="btn btn-ghost btn-sm" onClick={() => deleteTenant(t.id)} title="Sil">
                                                <Trash2 size={14} color="var(--danger)" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {tenants.length === 0 && (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
                                        Henüz işletme yok. Yeni işletme ekleyin.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
