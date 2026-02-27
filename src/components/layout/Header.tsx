'use client'

import { Menu, LogOut, User } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'
import NotificationDropdown from '@/components/NotificationDropdown'

interface HeaderProps {
    onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
    const { data: session } = useSession()
    const [showDropdown, setShowDropdown] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const userName = session?.user?.name || 'Kullanıcı'
    const userRole = (session?.user as any)?.role || 'PERSONEL'
    const roleName = userRole === 'ADMIN' ? 'Yönetici' : userRole === 'MUHASEBE' ? 'Muhasebe' : 'Personel'

    return (
        <header className="main-header">
            {/* Sol: Hamburger (mobil) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                    className="md:hidden btn-icon btn-ghost"
                    onClick={onMenuClick}
                    aria-label="Menü"
                >
                    <Menu size={22} />
                </button>
            </div>

            {/* Sağ: Bildirimler + Kullanıcı */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {/* Bildirimler */}
                <NotificationDropdown />

                {/* Kullanıcı dropdown */}
                <div style={{ position: 'relative' }} ref={dropdownRef}>
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.625rem',
                            padding: '0.375rem 0.75rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            background: showDropdown ? '#f1f5f9' : 'transparent',
                            cursor: 'pointer',
                            transition: 'background 0.15s',
                        }}
                    >
                        <div style={{
                            width: '2rem',
                            height: '2rem',
                            borderRadius: '9999px',
                            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                        }}>
                            {userName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="hidden sm:block" style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.2 }}>
                                {userName}
                            </div>
                            <div style={{ fontSize: '0.6875rem', color: '#64748b', lineHeight: 1.2 }}>
                                {roleName}
                            </div>
                        </div>
                    </button>

                    {showDropdown && (
                        <div style={{
                            position: 'absolute',
                            right: 0,
                            top: '100%',
                            marginTop: '0.5rem',
                            background: 'white',
                            borderRadius: '0.75rem',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                            width: '12rem',
                            overflow: 'hidden',
                            zIndex: 50,
                        }}>
                            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{userName}</div>
                                <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>{session?.user?.email}</div>
                            </div>
                            <button
                                onClick={() => signOut({ callbackUrl: '/login' })}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    width: '100%',
                                    padding: '0.625rem 1rem',
                                    border: 'none',
                                    background: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.8125rem',
                                    color: '#dc2626',
                                    fontFamily: 'inherit',
                                }}
                            >
                                <LogOut size={16} />
                                Çıkış Yap
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
