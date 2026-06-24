'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Loader2 } from 'lucide-react'

export default function SignupPage() {
    const router = useRouter()
    const [form, setForm] = useState({ companyName: '', name: '', email: '', phone: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(''); setLoading(true)
        const res = await fetch('/api/signup', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        })
        const j = await res.json()
        setLoading(false)
        if (!res.ok) { setError(j.error || 'Kayıt başarısız'); return }
        setDone(true)
        setTimeout(() => router.push('/login'), 2200)
    }

    const benefits = [
        'GPS-doğrulamalı hakediş & puantaj',
        'Yakıt hırsızlığı / boşta çalışma tespiti',
        'Müşteri portalı + dijital imza + PDF',
        '14 gün ücretsiz — kredi kartı gerekmez',
    ]

    if (done) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                <CheckCircle size={56} color="#10b981" style={{ marginBottom: '1rem' }} />
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b' }}>Hesabınız oluşturuldu!</h1>
                <p style={{ color: '#64748b', marginTop: '0.5rem' }}>14 günlük deneme başladı. Giriş sayfasına yönlendiriliyorsunuz...</p>
            </div>
        </div>
    )

    return (
        <div style={{ minHeight: '100vh', display: 'flex', background: '#f1f5f9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            {/* Sol tanıtım */}
            <div style={{ flex: 1, background: 'linear-gradient(160deg,#1e293b,#0f172a)', color: '#fff', padding: '3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }} className="signup-hero">
                <div style={{ fontSize: '0.875rem', fontWeight: 700, opacity: 0.7, marginBottom: '0.5rem' }}>🏗 MAKİNE TAKİP</div>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '1rem' }}>
                    İş makinesi kiralamanızı<br />itiraz edilemez hale getirin
                </h1>
                <p style={{ opacity: 0.8, marginBottom: '2rem', maxWidth: 420 }}>
                    Puantaj 18 saat diyor, makinenin motor verisi 15 saat diyor. Aradaki farkı GPS ile doğrulayın, hakedişi telefondan imzalatın.
                </p>
                {benefits.map(b => (
                    <div key={b} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                        <CheckCircle size={18} color="#34d399" /> <span style={{ opacity: 0.95 }}>{b}</span>
                    </div>
                ))}
            </div>

            {/* Sağ form */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                <div style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: '1rem', padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.25rem' }}>Ücretsiz başlayın</h2>
                    <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>14 gün deneme, kart gerekmez.</p>

                    {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.6rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.8125rem', marginBottom: '1rem' }}>{error}</div>}

                    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {[
                            { k: 'companyName', label: 'Firma Adı', type: 'text', ph: 'Yıldız İş Makineleri' },
                            { k: 'name', label: 'Ad Soyad', type: 'text', ph: 'Ahmet Yıldız' },
                            { k: 'email', label: 'E-posta', type: 'email', ph: 'ornek@firma.com' },
                            { k: 'phone', label: 'Telefon (opsiyonel)', type: 'tel', ph: '0532 ...' },
                            { k: 'password', label: 'Şifre', type: 'password', ph: 'En az 6 karakter' },
                        ].map(f => (
                            <div key={f.k}>
                                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.3rem' }}>{f.label}</label>
                                <input
                                    type={f.type} placeholder={f.ph}
                                    required={f.k !== 'phone'}
                                    value={(form as any)[f.k]}
                                    onChange={e => setForm({ ...form, [f.k]: e.target.value })}
                                    style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.9rem' }}
                                />
                            </div>
                        ))}
                        <button type="submit" disabled={loading}
                            style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '0.625rem', fontWeight: 700, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                            {loading ? <><Loader2 size={16} className="spin" /> Oluşturuluyor...</> : 'Ücretsiz Hesap Oluştur'}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8125rem', color: '#64748b' }}>
                        Zaten hesabınız var mı? <Link href="/login" style={{ color: '#2563eb', fontWeight: 600 }}>Giriş yapın</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
