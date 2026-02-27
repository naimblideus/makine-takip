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

export default function DashboardPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/dashboard')
            .then((res) => res.json())
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
                <div className="spinner" />
            </div>
        )
    }

    if (!data) {
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
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Filonuzun anlık durumu</p>
                </div>
            </div>

            {/* Uyarılar */}
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

            {/* Filo Durumu Kartları */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <StatCard icon={<Truck />} value={data.machineStats.KIRADA} label="Kirada" color="#2563eb" bgColor="#dbeafe" />
                <StatCard icon={<Truck />} value={data.machineStats.MUSAIT} label="Müsait" color="#16a34a" bgColor="#d1fae5" />
                <StatCard icon={<Truck />} value={data.machineStats.BAKIMDA} label="Bakımda" color="#ca8a04" bgColor="#fef3c7" />
                <StatCard icon={<Truck />} value={data.machineStats.ARIZALI} label="Arızalı" color="#dc2626" bgColor="#fee2e2" />
            </div>

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

            {/* Hızlı İşlemler */}
            <div className="card" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>⚡ Hızlı İşlemler</h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Link href="/kiralamalar/yeni" className="btn btn-primary btn-sm"><CalendarRange size={15} />Yeni Kiralama</Link>
                    <Link href="/makineler/yeni" className="btn btn-outline btn-sm"><Plus size={15} />Makine Ekle</Link>
                    <Link href="/musteriler/yeni" className="btn btn-outline btn-sm"><Users size={15} />Müşteri Ekle</Link>
                    <Link href="/yakit/yeni" className="btn btn-outline btn-sm"><Fuel size={15} />Yakıt Girişi</Link>
                    <Link href="/bakim/yeni" className="btn btn-outline btn-sm"><FileText size={15} />Bakım Kaydı</Link>
                </div>
            </div>
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
