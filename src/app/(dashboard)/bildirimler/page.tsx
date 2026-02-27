'use client'

import { useState, useEffect } from 'react'
import { CheckCheck, Trash2 } from 'lucide-react'
import { formatRelativeDate, cn } from '@/lib/utils'
import { NOTIFICATION_TYPE_LABELS, NOTIFICATION_TYPE_ICONS } from '@/lib/constants'

export default function BildirimlerPage() {
    const [notifications, setNotifications] = useState<any[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [filterType, setFilterType] = useState('')

    const fetchAll = async () => {
        try {
            const params = filterType ? `type=${filterType}&limit=100` : 'limit=100'
            const res = await fetch(`/api/bildirimler?${params}`)
            if (res.ok) {
                const data = await res.json()
                setNotifications(data.notifications || [])
                setUnreadCount(data.unreadCount || 0)
            }
        } catch { /* hata */ }
        setLoading(false)
    }

    useEffect(() => { fetchAll() }, [filterType])

    const markAllRead = async () => {
        await fetch('/api/bildirimler', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'readAll' }),
        })
        fetchAll()
    }

    const markRead = async (id: string) => {
        await fetch('/api/bildirimler', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        })
        fetchAll()
    }

    const types = [...new Set(notifications.map(n => n.type))]
    const getColor = (type: string) => {
        if (type.includes('GECIKTI') || type.includes('HIRSIZLIGI') || type.includes('YETKISIZ') || type.includes('HIZ')) return { bg: '#fef2f2', border: '#fecaca' }
        if (type.includes('YAKLASIYOR') || type.includes('DOLACAK') || type.includes('BOSTA')) return { bg: '#fffbeb', border: '#fde68a' }
        if (type.includes('MOTOR') || type.includes('GEOFENCE')) return { bg: '#fef3c7', border: '#fde68a' }
        return { bg: '#eff6ff', border: '#bfdbfe' }
    }

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div className="page-header animate-fade-in">
                <div>
                    <h1 className="page-title">🔔 Bildirimler</h1>
                    <p className="page-subtitle">{unreadCount} okunmamış bildirim</p>
                </div>
                {unreadCount > 0 && (
                    <button onClick={markAllRead} className="btn btn-outline btn-sm" style={{ gap: 6 }}>
                        <CheckCheck size={16} /> Tümünü Okundu Yap
                    </button>
                )}
            </div>

            {/* Filtreler */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                <button onClick={() => setFilterType('')}
                    className={`btn btn-sm ${!filterType ? 'btn-primary' : 'btn-ghost'}`}>
                    Tümü
                </button>
                {Object.entries(NOTIFICATION_TYPE_LABELS).map(([key, label]) => (
                    <button key={key} onClick={() => setFilterType(key)}
                        className={`btn btn-sm ${filterType === key ? 'btn-primary' : 'btn-ghost'}`}>
                        {NOTIFICATION_TYPE_ICONS[key]} {label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}><div className="spinner" /></div>
            ) : notifications.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-title">Bildirim yok</div>
                    <div className="empty-state-text">Henüz bu kategoride bildirim yok</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {notifications.map(n => {
                        const c = getColor(n.type)
                        return (
                            <div
                                key={n.id}
                                onClick={() => !n.isRead && markRead(n.id)}
                                className="card"
                                style={{
                                    padding: '1rem 1.25rem', display: 'flex', gap: 12,
                                    background: n.isRead ? 'white' : c.bg,
                                    borderColor: n.isRead ? undefined : c.border,
                                    cursor: n.isRead ? 'default' : 'pointer',
                                    opacity: n.isRead ? 0.7 : 1,
                                }}
                            >
                                <div style={{ fontSize: '1.25rem', flexShrink: 0, marginTop: 2 }}>
                                    {NOTIFICATION_TYPE_ICONS[n.type] || '🔔'}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.875rem', lineHeight: 1.3 }}>{n.title}</div>
                                        <span className="badge" style={{
                                            fontSize: '0.625rem', background: n.isRead ? '#f1f5f9' : c.bg,
                                            color: 'var(--color-muted)', border: `1px solid ${n.isRead ? 'var(--color-border)' : c.border}`,
                                            flexShrink: 0,
                                        }}>
                                            {NOTIFICATION_TYPE_LABELS[n.type] || n.type}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', marginTop: 4, lineHeight: 1.5 }}>
                                        {n.message}
                                    </div>
                                    <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: 6 }}>
                                        {formatRelativeDate(n.createdAt)}
                                    </div>
                                </div>
                                {!n.isRead && (
                                    <div style={{ width: 8, height: 8, borderRadius: 999, background: '#2563eb', flexShrink: 0, marginTop: 6 }} />
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
