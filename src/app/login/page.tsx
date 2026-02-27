'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Construction, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            })

            if (result?.error) {
                setError('Geçersiz e-posta veya şifre')
            } else {
                router.push('/')
                router.refresh()
            }
        } catch {
            setError('Bir hata oluştu. Lütfen tekrar deneyin.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
            padding: '1rem',
        }}>
            {/* Decorative background elements */}
            <div style={{
                position: 'absolute',
                top: '10%',
                left: '10%',
                width: '300px',
                height: '300px',
                borderRadius: '9999px',
                background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute',
                bottom: '10%',
                right: '10%',
                width: '400px',
                height: '400px',
                borderRadius: '9999px',
                background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            <div className="animate-fade-in" style={{
                width: '100%',
                maxWidth: '420px',
                position: 'relative',
            }}>
                {/* Logo Section */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '3.5rem',
                        height: '3.5rem',
                        borderRadius: '1rem',
                        background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem',
                        boxShadow: '0 8px 32px rgba(37,99,235,0.3)',
                    }}>
                        <Construction size={28} color="white" />
                    </div>
                    <h1 style={{
                        fontSize: '1.5rem',
                        fontWeight: 800,
                        color: 'white',
                        letterSpacing: '-0.025em',
                    }}>
                        Makine Takip
                    </h1>
                    <p style={{
                        fontSize: '0.875rem',
                        color: 'rgba(255,255,255,0.5)',
                        marginTop: '0.375rem',
                    }}>
                        İş Makinesi Kiralama Yönetim Sistemi
                    </p>
                </div>

                {/* Login Card */}
                <div style={{
                    background: 'white',
                    borderRadius: '1rem',
                    padding: '2rem',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
                }}>
                    <h2 style={{
                        fontSize: '1.125rem',
                        fontWeight: 700,
                        marginBottom: '1.5rem',
                        textAlign: 'center',
                    }}>
                        Giriş Yap
                    </h2>

                    {error && (
                        <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label className="label" htmlFor="email">E-posta</label>
                            <input
                                id="email"
                                type="email"
                                className="input"
                                placeholder="admin@firma.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label className="label" htmlFor="password">Şifre</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="input"
                                    placeholder="••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    style={{ paddingRight: '2.5rem' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '0.75rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#94a3b8',
                                        padding: '0.25rem',
                                    }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                            style={{ width: '100%' }}
                        >
                            {loading ? (
                                <>
                                    <div className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} />
                                    Giriş yapılıyor...
                                </>
                            ) : (
                                'Giriş Yap'
                            )}
                        </button>
                    </form>

                    {/* Demo bilgileri */}
                    <div style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        borderRadius: '0.75rem',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                    }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: '#64748b' }}>
                            Demo Giriş Bilgileri
                        </p>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.8 }}>
                            <div><strong>Admin:</strong> admin@yildizmakine.com</div>
                            <div><strong>Personel:</strong> personel@yildizmakine.com</div>
                            <div><strong>Şifre:</strong> 123456</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
