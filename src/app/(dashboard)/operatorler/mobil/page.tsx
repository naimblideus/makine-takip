'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Truck, Clock, MapPin, Fuel, Wrench, CheckCircle, AlertTriangle, Home, FileText, User } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

export default function OperatorMobilePage() {
    const { data: session } = useSession()
    const [rentals, setRentals] = useState<any[]>([])
    const [timesheets, setTimesheets] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const today = new Date().toISOString().slice(0, 10)

    useEffect(() => {
        const operatorId = (session?.user as any)?.operatorId
        if (!operatorId) { setLoading(false); return }
        Promise.all([
            fetch(`/api/kiralamalar?operatorId=${operatorId}&status=AKTIF`).then(r => r.json()),
            fetch(`/api/puantaj?operatorId=${operatorId}&from=${today}&to=${today}`).then(r => r.json()),
        ]).then(([rData, pData]) => {
            setRentals(rData.rentals || [])
            setTimesheets(pData.timesheets || [])
        }).finally(() => setLoading(false))
    }, [session, today])

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 36, height: 36, border: '3px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
    )

    const operatorName = (session?.user as any)?.name || 'Operatör'
    const todaySheet = timesheets[0]

    return (
        <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: 430, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ padding: '1.5rem 1.25rem 1rem', background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)' }}>
                <div style={{ fontSize: '0.75rem', color: '#93c5fd', marginBottom: '0.25rem' }}>Günaydın 👋</div>
                <div style={{ fontSize: '1.375rem', fontWeight: 800 }}>{operatorName}</div>
                <div style={{ fontSize: '0.8rem', color: '#93c5fd', marginTop: '0.25rem' }}>{new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
            </div>

            {/* Bugünkü özet */}
            <div style={{ padding: '1rem 1.25rem', background: '#1e293b', margin: '0 1rem', borderRadius: '0 0 1rem 1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', textAlign: 'center' }}>
                    <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3b82f6' }}>{rentals.length}</div>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Aktif İş</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>
                            {todaySheet ? Number(todaySheet.workedHours) : 0}s
                        </div>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Bugün Çalışma</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>
                            {todaySheet ? (todaySheet.status === 'TAMAMLANDI' ? '✓' : '●') : '—'}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Puantaj</div>
                    </div>
                </div>
            </div>

            {/* Aktif Makine Kartları */}
            <div style={{ padding: '1.25rem 1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>AKTİF KİRALAMALAR</div>
                {rentals.length === 0 ? (
                    <div style={{ background: '#1e293b', borderRadius: '1rem', padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                        <Truck size={36} style={{ opacity: 0.4, margin: '0 auto 0.75rem' }} />
                        <div>Bugün aktif iş yok</div>
                    </div>
                ) : rentals.map((r: any) => (
                    <div key={r.id} style={{ background: '#1e293b', borderRadius: '1rem', padding: '1.125rem', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{r.machine?.brand} {r.machine?.model}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem' }}>{r.machine?.plate}</div>
                            </div>
                            <div style={{ background: '#1d4ed8', color: '#93c5fd', padding: '0.25rem 0.625rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600 }}>AKTİF</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                            <MapPin size={14} color="#3b82f6" />
                            {r.site?.name || r.site?.address || 'Şantiye belirtilmedi'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: '#94a3b8', marginBottom: '1rem' }}>
                            <Truck size={14} color="#10b981" />
                            {r.customer?.companyName}
                        </div>

                        {/* Hızlı aksiyonlar */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            <Link href={`/puantaj?rentalId=${r.id}`} style={{
                                background: '#0f172a', color: '#93c5fd', borderRadius: '0.625rem', padding: '0.625rem',
                                textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
                            }}>
                                <Clock size={14} /> Puantaj Gir
                            </Link>
                            <Link href={`/yakit?rentalId=${r.id}`} style={{
                                background: '#0f172a', color: '#fbbf24', borderRadius: '0.625rem', padding: '0.625rem',
                                textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
                            }}>
                                <Fuel size={14} /> Yakıt Gir
                            </Link>
                            <Link href={`/bakim?rentalId=${r.id}`} style={{
                                background: '#0f172a', color: '#a78bfa', borderRadius: '0.625rem', padding: '0.625rem',
                                textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
                            }}>
                                <Wrench size={14} /> Arıza Bildir
                            </Link>
                            <Link href="/hakedis" style={{
                                background: '#0f172a', color: '#34d399', borderRadius: '0.625rem', padding: '0.625rem',
                                textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
                            }}>
                                <FileText size={14} /> Hakediş
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom Nav */}
            <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: '#1e293b', borderTop: '1px solid #334155', display: 'flex', padding: '0.75rem 0 0.875rem' }}>
                {[
                    { icon: <Home size={22} />, label: 'Ana Sayfa', href: '/operatorler/mobil' },
                    { icon: <Clock size={22} />, label: 'Puantaj', href: '/puantaj' },
                    { icon: <FileText size={22} />, label: 'Hakediş', href: '/hakedis' },
                    { icon: <User size={22} />, label: 'Profil', href: '/ayarlar' },
                ].map((item, i) => (
                    <Link key={i} href={item.href} style={{
                        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
                        color: '#64748b', fontSize: '0.6rem', fontWeight: 600, textDecoration: 'none',
                    }}>
                        {item.icon}
                        {item.label}
                    </Link>
                ))}
            </div>
            <div style={{ height: '80px' }} />
        </div>
    )
}
