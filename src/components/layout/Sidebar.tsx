'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
    LayoutDashboard, Truck, HardHat, Users, Building2,
    CalendarRange, Fuel, Wrench, ClipboardList, Receipt,
    CreditCard, BarChart3, X, Construction, Settings,
    MapPin, Hexagon, Bell, Shield, FileText, Warehouse,
    Trophy, Calendar, DollarSign, Brain, Tag,
    ArrowLeftRight, TrendingDown, Map, Smartphone, Sparkles, Store,
    ShieldAlert, Gauge, FileSignature, Landmark, Inbox, ChevronDown, SlidersHorizontal, Plug,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────────────────
// Tek kaynak nav yapısı — yeni sayfa eklemek = tek satır ekle (core veya advanced).
// CORE: patronun her gün kullandığı, düz/üstte gösterilen menü.
// ADVANCED: alt gruplu, "Gelişmiş" altında katlanan gerisi.
// ─────────────────────────────────────────────────────────────────────────────

type NavItem = { href: string; label: string; icon: any }
type NavGroup = { label: string; items: NavItem[] }

const CORE: NavItem[] = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/filo-durum', label: 'Filo Durumu', icon: Map },
    { href: '/makineler', label: 'Makineler', icon: Truck },
    { href: '/kiralamalar', label: 'Kiralamalar', icon: CalendarRange },
    { href: '/teklifler', label: 'Teklifler', icon: FileSignature },
    { href: '/hakedis', label: 'Hakedişler', icon: FileText },
    { href: '/musteriler', label: 'Müşteriler', icon: Users },
    { href: '/faturalar', label: 'Faturalar', icon: Receipt },
    { href: '/borsa', label: 'Kiralama Borsası', icon: Store },
    { href: '/bildirimler', label: 'Bildirimler', icon: Bell },
]

const ADVANCED: NavGroup[] = [
    {
        label: 'Filo & Takip',
        items: [
            { href: '/takip', label: 'Canlı Takip', icon: MapPin },
            { href: '/operatorler', label: 'Operatörler', icon: HardHat },
            { href: '/depolar', label: 'Depolar', icon: Warehouse },
            { href: '/transferler', label: 'Nakliyeler', icon: ArrowLeftRight },
            { href: '/atil-makine', label: 'Atıl Makine', icon: Gauge },
            { href: '/amortisman', label: 'Amortisman', icon: TrendingDown },
            { href: '/geofence', label: 'Geofence', icon: Hexagon },
        ],
    },
    {
        label: 'Operasyon',
        items: [
            { href: '/musteri-crm', label: 'Müşteri CRM', icon: Trophy },
            { href: '/santiyeler', label: 'Şantiyeler', icon: Building2 },
            { href: '/talepler', label: 'Talepler', icon: Inbox },
        ],
    },
    {
        label: 'Bakım & Saha',
        items: [
            { href: '/yakit', label: 'Yakıt Takibi', icon: Fuel },
            { href: '/bakim', label: 'Bakım Takibi', icon: Wrench },
            { href: '/bakim-takvimi', label: 'Bakım Takvimi', icon: Calendar },
            { href: '/belgeler', label: 'Belgeler', icon: Shield },
            { href: '/isg', label: 'İSG Ceza Kalkanı', icon: ShieldAlert },
            { href: '/puantaj', label: 'Puantaj', icon: ClipboardList },
            { href: '/operatorler/performans', label: 'Op. Performans', icon: Trophy },
            { href: '/operatorler/mobil', label: 'Operatör PWA', icon: Smartphone },
        ],
    },
    {
        label: 'Finans & Analiz',
        items: [
            { href: '/odemeler', label: 'Ödemeler', icon: CreditCard },
            { href: '/gelir-gider', label: 'Gelir & Gider', icon: DollarSign },
            { href: '/finans', label: 'Finans & Sigorta', icon: Landmark },
            { href: '/fiyatlama', label: 'Fiyatlama', icon: Tag },
            { href: '/raporlar', label: 'Raporlar', icon: BarChart3 },
            { href: '/ai-oneriler', label: 'AI Öneriler', icon: Brain },
        ],
    },
]

const ADV_STORAGE_KEY = 'mt-nav-adv'
const groupHeader: React.CSSProperties = {
    fontSize: '0.625rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)',
    textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.75rem 0.875rem 0.25rem',
}

interface SidebarProps {
    isOpen: boolean
    onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname()
    const { data: session } = useSession()
    const isSuperAdmin = (session?.user as any)?.isSuperAdmin

    const isActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href))
    // Aktif rota Gelişmiş içindeyse bölüm açık başlasın (aktif item görünsün)
    const advActive = ADVANCED.some(g => g.items.some(it => isActive(it.href)))
    const [advOpen, setAdvOpen] = useState(advActive)

    // Kullanıcının manuel tercihini hatırla
    useEffect(() => {
        try { if (localStorage.getItem(ADV_STORAGE_KEY) === '1') setAdvOpen(true) } catch { }
    }, [])
    // Gelişmiş bir sayfaya geçilirse otomatik aç
    useEffect(() => { if (advActive) setAdvOpen(true) }, [advActive])

    const toggleAdv = () => {
        setAdvOpen(o => {
            const next = !o
            try { localStorage.setItem(ADV_STORAGE_KEY, next ? '1' : '0') } catch { }
            return next
        })
    }

    const closeOnMobile = () => { if (typeof window !== 'undefined' && window.innerWidth < 768) onClose() }

    const renderLink = (item: NavItem) => {
        const Icon = item.icon
        return (
            <Link
                key={item.href}
                href={item.href}
                className={cn('sidebar-link', isActive(item.href) && 'sidebar-link-active')}
                onClick={closeOnMobile}
            >
                <Icon size={18} />
                <span>{item.label}</span>
            </Link>
        )
    }

    return (
        <>
            {/* Overlay (mobil) */}
            <div className={cn('sidebar-overlay', isOpen && 'active')} onClick={onClose} />

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
                    {/* Sık kullanılan — düz liste */}
                    <div style={{ marginBottom: '0.25rem' }}>
                        <div style={groupHeader}>Sık Kullanılan</div>
                        {CORE.map(renderLink)}
                    </div>

                    {/* Gelişmiş — katlanabilir */}
                    <div style={{ marginBottom: '0.25rem' }}>
                        <button
                            onClick={toggleAdv}
                            className={cn('sidebar-link', advActive && !advOpen && 'sidebar-link-active')}
                            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', justifyContent: 'space-between' }}
                            aria-expanded={advOpen}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <SlidersHorizontal size={18} />
                                <span>Gelişmiş</span>
                            </span>
                            <ChevronDown size={16} style={{ opacity: 0.6, transition: 'transform 0.2s', transform: advOpen ? 'rotate(180deg)' : 'none' }} />
                        </button>

                        {advOpen && ADVANCED.map(group => (
                            <div key={group.label} style={{ marginBottom: '0.25rem' }}>
                                <div style={groupHeader}>{group.label}</div>
                                {group.items.map(renderLink)}
                            </div>
                        ))}
                    </div>

                    {/* Sistem */}
                    <div style={{ marginBottom: '0.25rem' }}>
                        <div style={groupHeader}>Sistem</div>
                        <Link
                            href="/abonelik"
                            className={cn('sidebar-link', pathname.startsWith('/abonelik') && 'sidebar-link-active')}
                            onClick={closeOnMobile}
                        >
                            <Sparkles size={18} />
                            <span>Abonelik</span>
                        </Link>
                        <Link
                            href="/ayarlar"
                            className={cn('sidebar-link', pathname.startsWith('/ayarlar') && 'sidebar-link-active')}
                            onClick={closeOnMobile}
                        >
                            <Settings size={18} />
                            <span>Ayarlar</span>
                        </Link>
                        <Link
                            href="/entegrasyonlar"
                            className={cn('sidebar-link', pathname.startsWith('/entegrasyonlar') && 'sidebar-link-active')}
                            onClick={closeOnMobile}
                        >
                            <Plug size={18} />
                            <span>Entegrasyonlar</span>
                        </Link>
                        {isSuperAdmin && (
                            <Link
                                href="/super-admin"
                                className={cn('sidebar-link', pathname.startsWith('/super-admin') && 'sidebar-link-active')}
                                onClick={closeOnMobile}
                                style={{ color: '#c4b5fd' }}
                            >
                                <Shield size={18} />
                                <span>Süper Admin</span>
                            </Link>
                        )}
                        {isSuperAdmin && (
                            <Link
                                href="/bayiler"
                                className={cn('sidebar-link', pathname.startsWith('/bayiler') && 'sidebar-link-active')}
                                onClick={closeOnMobile}
                                style={{ color: '#7dd3fc' }}
                            >
                                <Store size={18} />
                                <span>Bayi Ağı</span>
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
