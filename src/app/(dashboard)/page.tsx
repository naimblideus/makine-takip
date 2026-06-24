'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    AlertTriangle,
    AlertCircle,
    Truck,
    TrendingUp,
    CalendarRange,
    Plus,
    FileText,
    Users,
    Fuel,
    Brain,
    DollarSign,
    Shield,
    Trophy,
    MessageCircle,
    ChevronDown,
} from 'lucide-react'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import {
    RENTAL_STATUS_LABELS,
    RENTAL_STATUS_COLORS,
    RENTAL_PERIOD_LABELS,
    MACHINE_TYPE_LABELS,
} from '@/lib/constants'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts'

const PIE_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#64748b']
const DETAILS_KEY = 'mt-dash-details'

export default function DashboardPage() {
    const [data, setData] = useState<any>(null)
    const [aiSuggestions, setAiSuggestions] = useState<any[]>([])
    const [ozet, setOzet] = useState<any>(null)
    const [komuta, setKomuta] = useState<any>(null)
    const [risk, setRisk] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    // İlk kez açan kullanıcı için sade ekran: analitik detaylar varsayılan KAPALI, tercih hatırlanır.
    const [detailsOpen, setDetailsOpen] = useState(false)

    useEffect(() => {
        Promise.all([
            fetch('/api/dashboard').then(r => r.json()),
            fetch('/api/ai-oneriler').then(r => r.json()),
            fetch('/api/ozet').then(r => r.json()),
            fetch('/api/komuta-ozet').then(r => r.json()),
            fetch('/api/musteri-risk').then(r => r.json()),
        ]).then(([dashData, aiData, ozetData, komutaData, riskData]) => {
            setData(dashData)
            setAiSuggestions((aiData.suggestions || []).slice(0, 3))
            setOzet(ozetData)
            setKomuta(komutaData)
            setRisk(riskData)
        }).catch(console.error).finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        try { if (localStorage.getItem(DETAILS_KEY) === '1') setDetailsOpen(true) } catch { }
    }, [])

    const toggleDetails = () => {
        setDetailsOpen(o => {
            const next = !o
            try { localStorage.setItem(DETAILS_KEY, next ? '1' : '0') } catch { }
            return next
        })
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
                <div className="spinner" />
            </div>
        )
    }

    if (!data || data.error) {
        return <div className="alert alert-danger">Veriler yüklenemedi</div>
    }

    const pieData = (data.machineTypes || []).map((t: any) => ({
        name: MACHINE_TYPE_LABELS[t.type as keyof typeof MACHINE_TYPE_LABELS] || t.type,
        value: t.count,
    }))

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Komuta Merkezi</h1>
                    <p className="page-subtitle">Filonuzun anlık durumu ve bu ay kanıtlanan para</p>
                </div>
            </div>

            {/* ═══ ONBOARDING — yeni/boş tenant ═══ */}
            {komuta && !komuta.error && komuta.machineCount === 0 && (
                <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem', border: '1px solid #bfdbfe', background: 'linear-gradient(180deg,#eff6ff,#ffffff)' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e3a8a' }}>🚀 Hoş geldiniz! 4 adımda ilk GPS-doğrulamalı hakedişinizi görün</div>
                        <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.25rem' }}>Sistemi yaklaşık 3 dakikada kurun — her adım sizi bir sonrakine götürür.</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.75rem' }}>
                        {[
                            { n: 1, t: 'Makine ekle', d: "GPS'li ilk iş makineni tanımla", href: '/makineler/yeni', icon: '🚜' },
                            { n: 2, t: 'Müşteri ekle', d: 'Kiraya vereceğin firma', href: '/musteriler/yeni', icon: '🏢' },
                            { n: 3, t: 'Kiralama başlat', d: 'Makineyi sahaya çıkar', href: '/kiralamalar/yeni', icon: '📋' },
                            { n: 4, t: 'Hakediş oluştur', d: 'Motor saatiyle doğrula', href: '/hakedis', icon: '✅' },
                        ].map((s) => (
                            <Link key={s.n} href={s.href} className="card card-interactive" style={{ padding: '0.875rem', textDecoration: 'none', color: 'inherit', display: 'block' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                                    <span style={{ width: 22, height: 22, borderRadius: 9999, background: '#2563eb', color: '#fff', fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.n}</span>
                                    <span style={{ fontSize: '1.1rem' }}>{s.icon}</span>
                                </div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{s.t}</div>
                                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{s.d}</div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══ KOMUTA MERKEZİ — PARA KANITI ŞERİDİ ═══ */}
            {komuta && !komuta.error && komuta.machineCount > 0 && (
                <div style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 60%,#1e3a8a 100%)', borderRadius: '1rem', padding: '1.25rem 1.5rem', marginBottom: '1.25rem', color: '#fff', boxShadow: '0 10px 30px rgba(15,23,42,0.25)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.03em', opacity: 0.85 }}>
                            🏗 {komuta.month} · GPS ile doğrulanmış operasyon
                        </div>
                        <div style={{ display: 'flex', gap: '0.875rem', fontSize: '0.78rem', opacity: 0.9, flexWrap: 'wrap' }}>
                            <span>{komuta.machineCount} makine</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ width: 8, height: 8, borderRadius: 9999, background: komuta.workingNow > 0 ? '#34d399' : '#64748b', display: 'inline-block' }} />
                                {komuta.workingNow} sahada çalışıyor
                            </span>
                            {komuta.criticalAlertsToday > 0 && <span style={{ color: '#fca5a5', fontWeight: 700 }}>⚠ {komuta.criticalAlertsToday} alarm bugün</span>}
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem' }}>
                        {/* Wedge: doğrulanmış saat */}
                        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '0.75rem', padding: '0.875rem 1rem' }}>
                            <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '0.25rem' }}>Doğrulanmış çalışma saati ✓</div>
                            <div style={{ fontSize: '1.7rem', fontWeight: 800 }}>{komuta.gpsVerifiedHours}<span style={{ fontSize: '0.9rem', opacity: 0.6 }}> sa</span></div>
                            <div style={{ fontSize: '0.66rem', opacity: 0.55 }}>motor (ignition) verisinden</div>
                        </div>
                        {/* Wedge: yakalanan tartışmalı TL */}
                        <div style={{ background: komuta.disputedTL > 0 ? 'rgba(239,68,68,0.18)' : 'rgba(52,211,153,0.14)', borderRadius: '0.75rem', padding: '0.875rem 1rem', border: komuta.disputedTL > 0 ? '1px solid rgba(248,113,113,0.4)' : '1px solid rgba(52,211,153,0.3)' }}>
                            <div style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: '0.25rem' }}>{komuta.disputedTL > 0 ? 'Yakalanan tartışmalı saat' : 'Hakediş doğrulama'}</div>
                            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: komuta.disputedTL > 0 ? '#fca5a5' : '#6ee7b7' }}>
                                {komuta.disputedTL > 0 ? formatCurrency(komuta.disputedTL) : '✓ Temiz'}
                            </div>
                            <div style={{ fontSize: '0.66rem', opacity: 0.6 }}>{komuta.disputedTL > 0 ? `${komuta.disputedHours} sa beyan-motor farkı` : 'beyan = motor saati'}</div>
                        </div>
                        {/* Yakıt koruması */}
                        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '0.75rem', padding: '0.875rem 1rem' }}>
                            <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '0.25rem' }}>🛡 Korunan yakıt</div>
                            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: komuta.fuelProtectedTL > 0 ? '#fcd34d' : '#fff' }}>{formatCurrency(komuta.fuelProtectedTL)}</div>
                            <div style={{ fontSize: '0.66rem', opacity: 0.55 }}>{komuta.fuelLiters} L şüpheli kayıp yakalandı</div>
                        </div>
                        {/* Tahsilat */}
                        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '0.75rem', padding: '0.875rem 1rem' }}>
                            <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '0.25rem' }}>💰 Açık alacak</div>
                            <div style={{ fontSize: '1.7rem', fontWeight: 800 }}>{formatCurrency(komuta.pendingTL + komuta.overdueTL)}</div>
                            <div style={{ fontSize: '0.66rem', opacity: 0.6 }}>
                                {komuta.overdueTL > 0 ? <span style={{ color: '#fca5a5' }}>{formatCurrency(komuta.overdueTL)} gecikmiş</span> : 'gecikme yok'}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Upsell bannerı — makine limitine yaklaşınca */}
            {komuta && komuta.plan !== 'PLATFORM' && komuta.machineLimit > 0 && komuta.machineCount >= komuta.machineLimit * 0.8 && (
                <Link href="/abonelik" style={{ display: 'block', textDecoration: 'none', marginBottom: '1.25rem' }}>
                    <div style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', color: '#fff', borderRadius: '0.875rem', padding: '0.875rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                            ✨ {komuta.machineCount}/{komuta.machineLimit} makine — limitine yaklaştın. Daha fazlası için planını yükselt.
                        </div>
                        <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.35rem 0.9rem', borderRadius: 9999, fontWeight: 700, fontSize: '0.82rem' }}>Planları Gör →</span>
                    </div>
                </Link>
            )}

            {/* Kritik Uyarılar — her zaman görünür */}
            {data.alerts.length > 0 && (
                <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {data.alerts.map((alert: any, i: number) => (
                        <div
                            key={i}
                            className={cn('alert', alert.type === 'critical' ? 'alert-danger' : 'alert-warning')}
                        >
                            {alert.type === 'critical' ? <AlertTriangle size={16} /> : <AlertCircle size={16} />}
                            <span>
                                <strong>{alert.type === 'critical' ? 'KRİTİK:' : 'HATIRLATMA:'}</strong>{' '}
                                {alert.message}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Filo Durumu Kartları — anlık bakış */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <StatCard icon={<Truck />} value={data.machineStats.KIRADA} label="Kirada" color="#2563eb" bgColor="#dbeafe" />
                <StatCard icon={<Truck />} value={data.machineStats.MUSAIT} label="Müsait" color="#16a34a" bgColor="#d1fae5" />
                <StatCard icon={<Truck />} value={data.machineStats.BAKIMDA} label="Bakımda" color="#ca8a04" bgColor="#fef3c7" />
                <StatCard icon={<Truck />} value={data.machineStats.ARIZALI} label="Arızalı" color="#dc2626" bgColor="#fee2e2" />
            </div>

            {/* Bugünün Gündemi + Kârlılık — 2 sütun */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                {/* Bugünün Gündemi */}
                <div className="card" style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        📅 Bugün — {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                        {[
                            { icon: '🔧', label: 'bakım yapılacak', count: data.agenda?.maintenances || 0, color: '#f59e0b' },
                            { icon: '🚛', label: 'kiralama bitiyor', count: data.agenda?.endingRentals || 0, color: '#2563eb' },
                            { icon: '⚠️', label: 'ödeme vadesi', count: data.agenda?.duePayments || 0, color: '#ef4444' },
                            { icon: '📋', label: 'hakediş onay bekliyor', count: data.agenda?.pendingHakedis || 0, color: '#8b5cf6' },
                        ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: '#f8fafc' }}>
                                <span style={{ fontSize: '1.125rem' }}>{item.icon}</span>
                                <span style={{ flex: 1, fontSize: '0.8125rem', color: '#475569' }}>
                                    <strong style={{ color: item.color, fontSize: '1rem' }}>{item.count}</strong> {item.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Kârlılık Göstergesi */}
                <div className="card" style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>💰 Bu Ay Kârlılık</h3>
                    <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: (data.profitability?.thisMonthProfit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                            {formatCurrency(data.profitability?.thisMonthProfit || 0)}
                        </div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.375rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, background: (data.profitability?.trend || 0) >= 0 ? '#d1fae5' : '#fee2e2', color: (data.profitability?.trend || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                            {(data.profitability?.trend || 0) >= 0 ? '↑' : '↓'} %{Math.abs(data.profitability?.trend || 0)} geçen aya göre
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div style={{ background: '#f0fdf4', borderRadius: '0.5rem', padding: '0.75rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.6875rem', color: '#16a34a', fontWeight: 600 }}>GELİR</div>
                            <div style={{ fontWeight: 800, color: '#16a34a' }}>{formatCurrency(data.profitability?.thisMonthIncome || 0)}</div>
                        </div>
                        <div style={{ background: '#fef2f2', borderRadius: '0.5rem', padding: '0.75rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.6875rem', color: '#dc2626', fontWeight: 600 }}>GİDER</div>
                            <div style={{ fontWeight: 800, color: '#dc2626' }}>{formatCurrency(data.profitability?.thisMonthExpense || 0)}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hızlı İşlemler — her zaman erişilir */}
            <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>⚡ Hızlı İşlemler</h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Link href="/kiralamalar/yeni" className="btn btn-primary btn-sm"><CalendarRange size={15} />Yeni Kiralama</Link>
                    <Link href="/makineler/yeni" className="btn btn-outline btn-sm"><Plus size={15} />Makine Ekle</Link>
                    <Link href="/musteriler/yeni" className="btn btn-outline btn-sm"><Users size={15} />Müşteri Ekle</Link>
                    <Link href="/yakit/yeni" className="btn btn-outline btn-sm"><Fuel size={15} />Yakıt Girişi</Link>
                    <Link href="/bakim/yeni" className="btn btn-outline btn-sm"><FileText size={15} />Bakım Kaydı</Link>
                    <Link href="/hakedis" className="btn btn-outline btn-sm"><FileText size={15} />Hakediş</Link>
                </div>
            </div>

            {/* ═══ DETAYLI GÖRÜNÜM — analitik bölüm, varsayılan kapalı ═══ */}
            <button
                onClick={toggleDetails}
                className="card"
                style={{ width: '100%', padding: '0.875rem 1.25rem', marginBottom: detailsOpen ? '1.25rem' : 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', border: '1px solid var(--color-border)', background: '#fff', font: 'inherit' }}
                aria-expanded={detailsOpen}
            >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9375rem', color: '#334155' }}>
                    📊 Detaylı Görünüm
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#94a3b8' }}>· grafikler, risk analizi, AI öneriler</span>
                </span>
                <ChevronDown size={18} color="#64748b" style={{ transition: 'transform 0.2s', transform: detailsOpen ? 'rotate(180deg)' : 'none' }} />
            </button>

            {detailsOpen && (
                <>
                    {/* Riskli Müşteriler — churn erken uyarı */}
                    {risk && risk.rows && risk.rows.length > 0 && (
                        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem', border: '1px solid #fecaca' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#b91c1c' }}>
                                    <AlertTriangle size={17} /> Riskli Müşteriler ({risk.summary?.yuksek || 0} yüksek)
                                </h3>
                                {risk.summary?.riskliAlacak > 0 && <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#dc2626' }}>{formatCurrency(risk.summary.riskliAlacak)} riskli alacak</span>}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {risk.rows.slice(0, 4).map((c: any) => {
                                    const lc = c.level === 'YUKSEK' ? { c: '#dc2626', b: '#fee2e2' } : { c: '#d97706', b: '#fef3c7' }
                                    const phone = (c.phone || '').replace(/\D/g, '')
                                    const intl = phone.startsWith('0') ? `90${phone.slice(1)}` : phone
                                    return (
                                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.75rem', background: '#f8fafc', borderRadius: '0.5rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.companyName}</div>
                                                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{c.reasons.join(' · ')}</div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ padding: '0.15rem 0.5rem', borderRadius: 9999, fontSize: '0.68rem', fontWeight: 700, background: lc.b, color: lc.c }}>risk {c.risk}</span>
                                                {phone && <a href={`https://wa.me/${intl}`} target="_blank" rel="noopener" onClick={e => e.stopPropagation()} style={{ color: '#25D366' }}><MessageCircle size={16} /></a>}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Haftalık Takvim Şeridi */}
                    {data.weekEvents && data.weekEvents.length > 0 && (
                        <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
                            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.75rem' }}>📆 Haftalık Takvim</h3>
                            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                                {data.weekEvents.map((day: any, i: number) => {
                                    const isToday = i === 0
                                    const hasEvents = day.maintenance > 0 || day.ending > 0 || day.payments > 0
                                    return (
                                        <div key={day.date} style={{
                                            minWidth: 90, flex: '0 0 auto', borderRadius: '0.625rem', padding: '0.75rem 0.5rem', textAlign: 'center',
                                            background: isToday ? '#2563eb' : hasEvents ? '#f8fafc' : '#fafafa',
                                            color: isToday ? '#fff' : '#334155',
                                            border: isToday ? 'none' : '1px solid #f1f5f9',
                                        }}>
                                            <div style={{ fontSize: '0.6875rem', fontWeight: 700, marginBottom: '0.375rem', opacity: isToday ? 1 : 0.6 }}>
                                                {day.dayLabel}
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center', flexWrap: 'wrap', minHeight: 20 }}>
                                                {day.maintenance > 0 && <span title="Bakım" style={{ fontSize: '0.75rem' }}>🔧{day.maintenance > 1 ? day.maintenance : ''}</span>}
                                                {day.ending > 0 && <span title="İade" style={{ fontSize: '0.75rem' }}>🚛{day.ending > 1 ? day.ending : ''}</span>}
                                                {day.payments > 0 && <span title="Ödeme" style={{ fontSize: '0.75rem' }}>💳{day.payments > 1 ? day.payments : ''}</span>}
                                                {!hasEvents && <span style={{ fontSize: '0.65rem', opacity: 0.4 }}>—</span>}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Grafikler — 2 sütun */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                        {/* Gelir Grafiği */}
                        <div className="card" style={{ padding: '1.25rem' }}>
                            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>📊 Aylık Gelir (Son 6 Ay)</h3>
                            <div style={{ width: '100%', height: 220 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.chartData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
                                        <Tooltip
                                            formatter={((value: number) => [formatCurrency(value), 'Gelir']) as any}
                                            contentStyle={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.8125rem' }}
                                        />
                                        <Bar dataKey="gelir" fill="#2563eb" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Makine Tipi Dağılımı */}
                        <div className="card" style={{ padding: '1.25rem' }}>
                            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>🚛 Filo Dağılımı</h3>
                            <div style={{ width: '100%', height: 220 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={3}
                                            dataKey="value"
                                            label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            style={{ fontSize: '0.6875rem' }}
                                        >
                                            {pieData.map((_: any, i: number) => (
                                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.8125rem' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Alt: Gelir Özeti + Son Kiralamalar */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                        {/* Gelir Özeti */}
                        <div className="card" style={{ padding: '1.25rem' }}>
                            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>💰 Gelir Özeti</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.6875rem', color: '#94a3b8', fontWeight: 500 }}>Bu Ay Tahsil Edilen</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a' }}>{formatCurrency(data.revenue.paidThisMonth)}</div>
                                </div>
                                <div style={{ height: '1px', background: '#f1f5f9' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                                    <span style={{ color: '#64748b' }}>Bekleyen Alacak</span>
                                    <span style={{ fontWeight: 700, color: '#ca8a04' }}>{formatCurrency(data.revenue.pending)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                                    <span style={{ color: '#64748b' }}>Gecikmiş</span>
                                    <span style={{ fontWeight: 700, color: '#dc2626' }}>{formatCurrency(data.revenue.overdue)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Son Kiralamalar */}
                        <div className="card" style={{ padding: '1.25rem' }}>
                            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>📋 Son Kiralamalar</h3>
                            {data.recentRentals.length === 0 ? (
                                <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>Henüz kiralama yok</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {data.recentRentals.map((r: any) => {
                                        const sc = RENTAL_STATUS_COLORS[r.status as keyof typeof RENTAL_STATUS_COLORS]
                                        return (
                                            <Link
                                                key={r.id}
                                                href={`/kiralamalar/${r.id}`}
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '0.5rem 0.625rem',
                                                    borderRadius: '0.375rem',
                                                    background: '#f8fafc',
                                                    textDecoration: 'none',
                                                    color: 'inherit',
                                                    fontSize: '0.8125rem',
                                                }}
                                            >
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{r.machineName}</div>
                                                    <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>{r.customerName}</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontWeight: 700 }}>{formatCurrency(r.unitPrice)}</div>
                                                    <span className={cn('badge', sc?.bg, sc?.text)} style={{ fontSize: '0.5625rem' }}>
                                                        {RENTAL_STATUS_LABELS[r.status as keyof typeof RENTAL_STATUS_LABELS]}
                                                    </span>
                                                </div>
                                            </Link>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* AI Öneriler Mini Widget */}
                    {aiSuggestions.length > 0 && (
                        <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Brain size={17} color="#7c3aed" /> AI Öneriler
                                </h3>
                                <Link href="/ai-oneriler" style={{ fontSize: '0.75rem', color: '#2563eb', textDecoration: 'none' }}>Tümünü gör →</Link>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {aiSuggestions.map((s: any, i: number) => {
                                    const prColors: Record<string, string> = { YUKSEK: '#dc2626', ORTA: '#d97706', DUSUK: '#2563eb' }
                                    return (
                                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', padding: '0.625rem', background: '#f8fafc', borderRadius: '0.5rem', borderLeft: `3px solid ${prColors[s.priority] || '#94a3b8'}` }}>
                                            <span style={{ fontSize: '1rem', flexShrink: 0 }}>{s.icon}</span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{s.title}</div>
                                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.125rem' }}>{s.description?.slice(0, 80)}...</div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

function StatCard({ icon, value, label, color, bgColor }: {
    icon: React.ReactNode; value: number; label: string; color: string; bgColor: string
}) {
    return (
        <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="stat-card-icon" style={{ background: bgColor, color }}>{icon}</div>
            <div>
                <div className="stat-card-value" style={{ color }}>{value}</div>
                <div className="stat-card-label">{label}</div>
            </div>
        </div>
    )
}
