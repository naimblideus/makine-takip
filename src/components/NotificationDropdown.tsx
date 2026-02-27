'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, CheckCheck, X } from 'lucide-react'
import { formatRelativeDate } from '@/lib/utils'
import { NOTIFICATION_TYPE_ICONS, NOTIFICATION_TYPE_LABELS } from '@/lib/constants'

interface SystemNotif {
    id: string
    type: string
    title: string
    message: string
    isRead: boolean
    createdAt: string
}

export default function NotificationDropdown() {
    const [open, setOpen] = useState(false)
    const [notifications, setNotifications] = useState<SystemNotif[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    const fetchNotifications = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/bildirimler?limit=20')
            if (res.ok) {
                const data = await res.json()
                setNotifications(data.notifications || [])
                setUnreadCount(data.unreadCount || 0)
            }
        } catch { /* hata */ }
        setLoading(false)
    }

    // İlk yükleme + periyodik kontrol
    useEffect(() => {
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 60000) // 1 dakika
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (open) fetchNotifications()
    }, [open])

    const markAllRead = async () => {
        await fetch('/api/bildirimler', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'readAll' }),
        })
        fetchNotifications()
    }

    const getColor = (type: string) => {
        if (type.includes('GECIKTI') || type.includes('HIRSIZLIGI') || type.includes('YETKISIZ') || type.includes('HIZ')) return '#fef2f2'
        if (type.includes('YAKLASIYOR') || type.includes('DOLACAK') || type.includes('BOSTA')) return '#fffbeb'
        return '#eff6ff'
    }

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button
                onClick={() => setOpen(!open)}
                style={{
                    background: 'none', border: 'none', cursor: 'pointer', position: 'relative',
                    padding: '0.375rem', borderRadius: '0.5rem', color: '#64748b', transition: 'background 0.15s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18,
                        background: '#dc2626', borderRadius: 999, border: '2px solid white',
                        fontSize: '0.625rem', fontWeight: 700, color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div style={{
                    position: 'absolute', right: 0, top: '100%', marginTop: '0.5rem',
                    width: '24rem', background: 'white', borderRadius: '0.75rem',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0', zIndex: 50,
                    overflow: 'hidden',
                }}>
                    <div style={{
                        padding: '0.875rem 1rem', borderBottom: '1px solid #f1f5f9',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                            Bildirimler {unreadCount > 0 && <span style={{ color: 'var(--color-danger)' }}>({unreadCount})</span>}
                        </span>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {unreadCount > 0 && (
                                <button onClick={markAllRead} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <CheckCheck size={14} /> Okundu
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    <div style={{ maxHeight: '24rem', overflowY: 'auto' }}>
                        {loading && notifications.length === 0 && (
                            <div style={{ padding: '2rem', textAlign: 'center' }}>
                                <div className="spinner" style={{ width: '1.25rem', height: '1.25rem' }} />
                            </div>
                        )}

                        {!loading && notifications.length === 0 && (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8125rem' }}>
                                Bildirim yok
                            </div>
                        )}

                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                style={{
                                    padding: '0.75rem 1rem', borderBottom: '1px solid #f8fafc',
                                    display: 'flex', gap: '0.625rem', alignItems: 'flex-start',
                                    background: n.isRead ? 'white' : getColor(n.type),
                                    fontSize: '0.8125rem',
                                }}
                            >
                                <div style={{ marginTop: '0.125rem', flexShrink: 0, fontSize: '1rem' }}>
                                    {NOTIFICATION_TYPE_ICONS[n.type] || '🔔'}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.3 }}>{n.title}</div>
                                    <div style={{ lineHeight: 1.4, color: 'var(--color-muted)', marginTop: 2 }}>{n.message}</div>
                                    <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                        {formatRelativeDate(n.createdAt)}
                                    </div>
                                </div>
                                {!n.isRead && (
                                    <div style={{ width: 8, height: 8, borderRadius: 999, background: '#2563eb', flexShrink: 0, marginTop: 4 }} />
                                )}
                            </div>
                        ))}
                    </div>

                    <a href="/bildirimler" style={{
                        display: 'block', padding: '0.75rem 1rem', textAlign: 'center',
                        fontSize: '0.8125rem', color: '#2563eb', fontWeight: 600,
                        borderTop: '1px solid #f1f5f9', textDecoration: 'none',
                    }}>
                        Tüm Bildirimleri Gör →
                    </a>
                </div>
            )}
        </div>
    )
}
