'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
    LayoutDashboard, Truck, HardHat, Users, Building2,
    CalendarRange, Fuel, Wrench, ClipboardList, Receipt,
    CreditCard, BarChart3, X, Construction, Settings,
    MapPin, Hexagon, Bell, Shield, FileText, Warehouse,
    Trophy, TrendingUp, Calendar, DollarSign,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_GROUPS = [
    {
        label: 'Genel',
        items: [
            { href: '/', label: 'Dashboard', icon: LayoutDashboard },
            { href: '/takip', label: 'Canlı Takip', icon: MapPin },
            { href: '/bildirimler', label: 'Bildirimler', icon: Bell },
        ],
    },
    {
        label: 'Filo',
        items: [
            { href: '/makineler', label: 'Makineler', icon: Truck },
            { href: '/operatorler', label: 'Operatörler', icon: HardHat },
            { href: '/depolar', label: 'Depolar', icon: Warehouse },
            { href: '/geofence', label: 'Geofence', icon: Hexagon },
        ],
    },
    {
        label: 'Operasyon',
        items: [
            { href: '/musteriler', label: 'Müşteriler', icon: Users },
            { href: '/santiyeler', label: 'Şantiyeler', icon: Building2 },
            { href: '/kiralamalar', label: 'Kiralamalar', icon: CalendarRange },
            { href: '/hakedis', label: 'Hakedişler', icon: FileText },
        ],
    },
    {
        label: 'Takip & Bakım',
        items: [
            { href: '/yakit', label: 'Yakıt Takibi', icon: Fuel },
            { href: '/bakim', label: 'Bakım Takibi', icon: Wrench },
            { href: '/bakim-takvimi', label: 'Bakım Takvimi', icon: Calendar },
            { href: '/belgeler', label: 'Belgeler', icon: Shield },
            { href: '/puantaj', label: 'Puantaj', icon: ClipboardList },
            { href: '/operatorler/performans', label: 'Op. Performans', icon: Trophy },
        ],
    },
    {
        label: 'Finans',
        items: [
            { href: '/faturalar', label: 'Faturalar', icon: Receipt },
            { href: '/odemeler', label: 'Ödemeler', icon: CreditCard },
            { href: '/gelir-gider', label: 'Gelir & Gider', icon: DollarSign },
            { href: '/raporlar', label: 'Raporlar', icon: BarChart3 },
        ],
    },
]

interface SidebarProps {
    isOpen: boolean
    onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname()
    const { data: session } = useSession()
    const isSuperAdmin = (session?.user as any)?.isSuperAdmin

    return (
        <>
            {/* Overlay (mobil) */}
            <div
                className={cn('sidebar-overlay', isOpen && 'active')}
                onClick={onClose}
            />

            {/* Sidebar */}
            <aside className={cn('sidebar', isOpen && 'open')}>
                {/* Logo */}
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <Construction size={20} color="white" />
                    </div>
                    <div>
                        <div className="sidebar-logo-text">Makine Takip</div>
                        <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                            {isSuperAdmin ? 'Süper Admin' : 'Yönetim Paneli'}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto', display: 'none' }}
                        className="mobile-close-btn"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigasyon */}
                <nav className="sidebar-nav">
                    {NAV_GROUPS.map((group) => (
                        <div key={group.label} style={{ marginBottom: '0.25rem' }}>
                            <div style={{
                                fontSize: '0.625rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)',
                                textTransform: 'uppercase', letterSpacing: '0.08em',
                                padding: '0.75rem 0.875rem 0.25rem',
                            }}>
                                {group.label}
                            </div>
                            {group.items.map((item) => {
                                const isActive = pathname === item.href ||
                                    (item.href !== '/' && pathname.startsWith(item.href))
                                const Icon = item.icon
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn('sidebar-link', isActive && 'sidebar-link-active')}
                                        onClick={() => { if (window.innerWidth < 768) onClose() }}
                                    >
                                        <Icon size={18} />
                                        <span>{item.label}</span>
                                    </Link>
                                )
                            })}
                        </div>
                    ))}

                    {/* Ayarlar */}
                    <div style={{ marginBottom: '0.25rem' }}>
                        <div style={{
                            fontSize: '0.625rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)',
                            textTransform: 'uppercase', letterSpacing: '0.08em',
                            padding: '0.75rem 0.875rem 0.25rem',
                        }}>
                            Sistem
                        </div>
                        <Link
                            href="/ayarlar"
                            className={cn('sidebar-link', pathname.startsWith('/ayarlar') && 'sidebar-link-active')}
                            onClick={() => { if (window.innerWidth < 768) onClose() }}
                        >
                            <Settings size={18} />
                            <span>Ayarlar</span>
                        </Link>
                        {isSuperAdmin && (
                            <Link
                                href="/super-admin"
                                className={cn('sidebar-link', pathname.startsWith('/super-admin') && 'sidebar-link-active')}
                                onClick={() => { if (window.innerWidth < 768) onClose() }}
                                style={{ color: '#c4b5fd' }}
                            >
                                <Shield size={18} />
                                <span>Süper Admin</span>
                            </Link>
                        )}
                    </div>
                </nav>

                {/* Footer */}
                <div className="sidebar-footer">
                    <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)' }}>
                        Makine Takip v2.0
                    </div>
                </div>
            </aside>
        </>
    )
}
