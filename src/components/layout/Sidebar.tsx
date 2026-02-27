'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Truck,
    HardHat,
    Users,
    Building2,
    CalendarRange,
    Fuel,
    Wrench,
    ClipboardList,
    Receipt,
    CreditCard,
    BarChart3,
    X,
    Construction,
    Settings,
    MapPin,
    Hexagon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/takip', label: 'Canlı Takip', icon: MapPin },
    { href: '/makineler', label: 'Makineler', icon: Truck },
    { href: '/operatorler', label: 'Operatörler', icon: HardHat },
    { href: '/musteriler', label: 'Müşteriler', icon: Users },
    { href: '/santiyeler', label: 'Şantiyeler', icon: Building2 },
    { href: '/kiralamalar', label: 'Kiralamalar', icon: CalendarRange },
    { href: '/geofence', label: 'Geofence', icon: Hexagon },
    { href: '/yakit', label: 'Yakıt Takibi', icon: Fuel },
    { href: '/bakim', label: 'Bakım Takibi', icon: Wrench },
    { href: '/puantaj', label: 'Puantaj', icon: ClipboardList },
    { href: '/faturalar', label: 'Faturalar', icon: Receipt },
    { href: '/odemeler', label: 'Ödemeler', icon: CreditCard },
    { href: '/raporlar', label: 'Raporlar', icon: BarChart3 },
    { href: '/ayarlar', label: 'Ayarlar', icon: Settings },
]

interface SidebarProps {
    isOpen: boolean
    onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname()

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
                            Yönetim Paneli
                        </div>
                    </div>
                    {/* Mobil kapat butonu */}
                    <button
                        className="md:hidden ml-auto"
                        onClick={onClose}
                        style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigasyon */}
                <nav className="sidebar-nav">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/' && pathname.startsWith(item.href))
                        const Icon = item.icon

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'sidebar-link',
                                    isActive && 'sidebar-link-active'
                                )}
                                onClick={() => {
                                    // Mobilde tıklayınca sidebar'ı kapat
                                    if (window.innerWidth < 768) onClose()
                                }}
                            >
                                <Icon size={20} />
                                <span>{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer */}
                <div className="sidebar-footer">
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
                        Makine Takip v2.0
                    </div>
                </div>
            </aside>
        </>
    )
}
