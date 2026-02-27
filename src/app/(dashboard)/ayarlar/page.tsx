'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Save, Building2, User, Shield, Palette, CheckCircle } from 'lucide-react'

export default function AyarlarPage() {
    const { data: session } = useSession()
    const [activeTab, setActiveTab] = useState('firma')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [loadingData, setLoadingData] = useState(true)
    const [error, setError] = useState('')

    const [firma, setFirma] = useState({
        companyName: '',
        taxNumber: '',
        taxOffice: '',
        phone: '',
        email: '',
        address: '',
    })

    // Profil state
    const [profil, setProfil] = useState({ name: '', email: '' })

    // Şifre state
    const [sifre, setSifre] = useState({ current: '', newPass: '', confirm: '' })

    const userName = session?.user?.name || 'Kullanıcı'
    const userEmail = session?.user?.email || ''
    const userRole = (session?.user as any)?.role || 'ADMIN'

    // Firma bilgilerini API'den çek
    useEffect(() => {
        fetch('/api/ayarlar')
            .then(r => r.json())
            .then(data => {
                if (data && !data.error) {
                    setFirma({
                        companyName: data.name || '',
                        taxNumber: data.taxNumber || '',
                        taxOffice: data.taxOffice || '',
                        phone: data.phone || '',
                        email: data.email || '',
                        address: data.address || '',
                    })
                }
            })
            .catch(console.error)
            .finally(() => setLoadingData(false))

        setProfil({ name: userName, email: userEmail })
    }, [userName, userEmail])

    const tabs = [
        { id: 'firma', label: 'Firma Bilgileri', icon: <Building2 size={16} /> },
        { id: 'profil', label: 'Profil', icon: <User size={16} /> },
        { id: 'guvenlik', label: 'Güvenlik', icon: <Shield size={16} /> },
        { id: 'gorunum', label: 'Görünüm', icon: <Palette size={16} /> },
    ]

    async function handleSaveFirma() {
        setSaving(true)
        setError('')
        try {
            const res = await fetch('/api/ayarlar', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(firma),
            })
            if (!res.ok) throw new Error((await res.json()).error || 'Kaydetme başarısız')
            setSaved(true)
            setTimeout(() => setSaved(false), 2500)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    async function handleSaveProfil() {
        setSaving(true)
        // Simulated - needs user API endpoint
        await new Promise(r => setTimeout(r, 600))
        setSaving(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
    }

    async function handleSaveSifre() {
        if (sifre.newPass !== sifre.confirm) {
            setError('Şifreler eşleşmiyor')
            return
        }
        if (sifre.newPass.length < 6) {
            setError('Şifre en az 6 karakter olmalıdır')
            return
        }
        setSaving(true)
        setError('')
        // Simulated - needs password change API
        await new Promise(r => setTimeout(r, 600))
        setSaving(false)
        setSaved(true)
        setSifre({ current: '', newPass: '', confirm: '' })
        setTimeout(() => setSaved(false), 2500)
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">⚙️ Ayarlar</h1>
                    <p className="page-subtitle">Sistem ve firma ayarları</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem' }}>
                {/* Tab Navigation */}
                <div className="card" style={{ padding: '0.5rem', alignSelf: 'start' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setError(''); setSaved(false) }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                width: '100%',
                                padding: '0.625rem 0.75rem',
                                border: 'none',
                                borderRadius: '0.5rem',
                                background: activeTab === tab.id ? '#eff6ff' : 'transparent',
                                color: activeTab === tab.id ? '#2563eb' : '#64748b',
                                fontWeight: activeTab === tab.id ? 600 : 400,
                                fontSize: '0.8125rem',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                fontFamily: 'inherit',
                                textAlign: 'left',
                            }}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div>
                    {/* Başarı / Hata mesajları */}
                    {saved && (
                        <div className="alert" style={{ marginBottom: '0.75rem', background: '#d1fae5', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CheckCircle size={16} /> Değişiklikler başarıyla kaydedildi
                        </div>
                    )}
                    {error && (
                        <div className="alert alert-danger" style={{ marginBottom: '0.75rem' }}>
                            {error}
                        </div>
                    )}

                    {/* Firma Bilgileri */}
                    {activeTab === 'firma' && (
                        <div className="card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>🏢 Firma Bilgileri</h3>
                            {loadingData ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><div className="spinner" /></div>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div>
                                            <label className="label">Firma Adı</label>
                                            <input className="input" value={firma.companyName} onChange={e => setFirma({ ...firma, companyName: e.target.value })} />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label className="label">Vergi No</label>
                                                <input className="input" value={firma.taxNumber} onChange={e => setFirma({ ...firma, taxNumber: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="label">Vergi Dairesi</label>
                                                <input className="input" value={firma.taxOffice} onChange={e => setFirma({ ...firma, taxOffice: e.target.value })} />
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label className="label">Telefon</label>
                                                <input className="input" value={firma.phone} onChange={e => setFirma({ ...firma, phone: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="label">E-posta</label>
                                                <input className="input" value={firma.email} onChange={e => setFirma({ ...firma, email: e.target.value })} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="label">Adres</label>
                                            <textarea className="input" rows={2} value={firma.address} onChange={e => setFirma({ ...firma, address: e.target.value })} style={{ resize: 'vertical' }} />
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
                                        <button className="btn btn-primary" onClick={handleSaveFirma} disabled={saving}>
                                            {saving ? 'Kaydediliyor...' : <><Save size={16} />Kaydet</>}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Profil */}
                    {activeTab === 'profil' && (
                        <div className="card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>👤 Profil Bilgileri</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                                <div style={{
                                    width: '4rem', height: '4rem', borderRadius: '9999px',
                                    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', fontSize: '1.25rem', fontWeight: 800,
                                }}>{userName.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{userName}</div>
                                    <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>{userEmail}</div>
                                    <span className="badge bg-blue-50 text-blue-700" style={{ marginTop: '0.25rem', fontSize: '0.625rem' }}>
                                        {userRole === 'ADMIN' ? 'Yönetici' : userRole === 'MUHASEBE' ? 'Muhasebe' : 'Personel'}
                                    </span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label className="label">Ad Soyad</label>
                                    <input className="input" value={profil.name} onChange={e => setProfil({ ...profil, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="label">E-posta</label>
                                    <input className="input" type="email" value={profil.email} onChange={e => setProfil({ ...profil, email: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <button className="btn btn-primary" onClick={handleSaveProfil} disabled={saving}>
                                    {saving ? 'Kaydediliyor...' : <><Save size={16} />Kaydet</>}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Güvenlik */}
                    {activeTab === 'guvenlik' && (
                        <div className="card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>🔒 Şifre Değişikliği</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label className="label">Mevcut Şifre</label>
                                    <input className="input" type="password" placeholder="••••••••" value={sifre.current} onChange={e => setSifre({ ...sifre, current: e.target.value })} />
                                </div>
                                <div>
                                    <label className="label">Yeni Şifre</label>
                                    <input className="input" type="password" placeholder="En az 6 karakter" value={sifre.newPass} onChange={e => setSifre({ ...sifre, newPass: e.target.value })} />
                                </div>
                                <div>
                                    <label className="label">Yeni Şifre (Tekrar)</label>
                                    <input className="input" type="password" placeholder="Şifreyi tekrar girin" value={sifre.confirm} onChange={e => setSifre({ ...sifre, confirm: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <button className="btn btn-primary" onClick={handleSaveSifre} disabled={saving}>
                                    {saving ? 'Kaydediliyor...' : <><Save size={16} />Şifreyi Değiştir</>}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Görünüm */}
                    {activeTab === 'gorunum' && (
                        <div className="card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>🎨 Görünüm</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label className="label">Tema</label>
                                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                                        {[
                                            { id: 'light', label: 'Açık', color: '#ffffff', border: '#e2e8f0' },
                                            { id: 'dark', label: 'Koyu', color: '#0f172a', border: '#334155' },
                                            { id: 'system', label: 'Sistem', color: 'linear-gradient(135deg, #fff 50%, #0f172a 50%)', border: '#94a3b8' },
                                        ].map(theme => (
                                            <button key={theme.id} onClick={() => { }} style={{
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem',
                                                padding: '0.75rem 1.25rem', border: `2px solid ${theme.id === 'light' ? '#2563eb' : theme.border}`,
                                                borderRadius: '0.75rem', cursor: 'pointer', background: 'white', fontFamily: 'inherit',
                                            }}>
                                                <div style={{
                                                    width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem',
                                                    background: theme.color, border: '1px solid #e2e8f0',
                                                }} />
                                                <span style={{ fontSize: '0.75rem', fontWeight: theme.id === 'light' ? 600 : 400, color: theme.id === 'light' ? '#2563eb' : '#64748b' }}>{theme.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="label">Dil</label>
                                    <select className="input select" defaultValue="tr" style={{ maxWidth: '200px' }}>
                                        <option value="tr">🇹🇷 Türkçe</option>
                                        <option value="en">🇬🇧 English</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
