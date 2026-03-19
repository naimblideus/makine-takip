'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Truck, Users, BarChart3 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const TYPE_LABELS: Record<string, string> = { FORKLIFT: 'Forklift', EKSAVATOR: 'Ekskavatör', VINC: 'Vinç', DOZER: 'Dozer', KEPCE: 'Kepçe', GREYDER: 'Greyder', SILINDIR: 'Silindir', KAMYON: 'Kamyon', BEKO_LODER: 'Beko Loder', DIGER: 'Diğer' }

export default function RaporlarPage() {
    const currentYear = new Date().getFullYear()
    const [year, setYear] = useState(currentYear)
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const load = async () => {
        setLoading(true)
        const res = await fetch(`/api/raporlar/ozet?year=${year}`)
        setData(await res.json())
        setLoading(false)
    }
    useEffect(() => { load() }, [year])

    if (loading || !data) return <div className="spinner" style={{ margin: '3rem auto' }} />
    const { kpi, monthlyRevenue, machineRanking, topCustomers } = data

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">📊 Gelişmiş Raporlama</h1>
                    <p className="page-subtitle">Yıllık performans analizi ve KPI göstergeleri</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select className="form-input" style={{ width: 'auto', padding: '0.4rem 0.75rem' }} value={year} onChange={e => setYear(Number(e.target.value))}>
                        {[currentYear, currentYear - 1, currentYear - 2].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            {/* KPI Kartları */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                    { label: 'Toplam Gelir', value: formatCurrency(kpi.totalRevenue), icon: <DollarSign size={18} />, color: '#059669', bg: '#d1fae5' },
                    { label: 'Net Kâr', value: formatCurrency(kpi.netProfit), icon: kpi.netProfit >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />, color: kpi.netProfit >= 0 ? '#059669' : '#dc2626', bg: kpi.netProfit >= 0 ? '#d1fae5' : '#fee2e2' },
                    { label: 'Doluluk Oranı', value: `%${kpi.occupancyRate}`, icon: <Truck size={18} />, color: '#2563eb', bg: '#dbeafe' },
                    { label: 'Kiralama Sayısı', value: `${kpi.totalRentals}`, icon: <BarChart3 size={18} />, color: '#7c3aed', bg: '#ede9fe' },
                    { label: 'Yeni Müşteri', value: `${kpi.newCustomers}`, icon: <Users size={18} />, color: '#0891b2', bg: '#e0f2fe' },
                    { label: 'Yakıt Gideri', value: formatCurrency(kpi.totalFuel), icon: <TrendingDown size={18} />, color: '#d97706', bg: '#fef3c7' },
                    { label: 'Bakım Gideri', value: formatCurrency(kpi.totalMaint), icon: <TrendingDown size={18} />, color: '#dc2626', bg: '#fee2e2' },
                    { label: 'Filo', value: `${kpi.machineCount} makine`, icon: <Truck size={18} />, color: '#64748b', bg: '#f1f5f9' },
                ].map(k => (
                    <div key={k.label} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="stat-card-icon" style={{ background: k.bg, color: k.color }}>{k.icon}</div>
                        <div><div style={{ fontSize: '1rem', fontWeight: 800, color: k.color }}>{k.value}</div><div className="stat-card-label">{k.label}</div></div>
                    </div>
                ))}
            </div>

            {/* Aylık P&L Grafiği */}
            <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
                <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '1rem' }}>📈 Aylık Gelir / Gider / Kâr — {year}</h3>
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={monthlyRevenue} margin={{ left: -10, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
                        <Tooltip formatter={(v: any) => formatCurrency(Number(v))} contentStyle={{ fontSize: '0.8rem', borderRadius: '0.5rem' }} />
                        <Bar dataKey="gelir" fill="#10b981" radius={[3, 3, 0, 0]} name="Gelir" />
                        <Bar dataKey="gider" fill="#ef4444" radius={[3, 3, 0, 0]} name="Gider" />
                        <Bar dataKey="kar" fill="#2563eb" radius={[3, 3, 0, 0]} name="Net Kâr" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Top Makine ve Müşteri */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                {/* Top Makineler */}
                <div className="card" style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '1rem' }}>🚛 En Kârlı Makineler</h3>
                    {machineRanking.map((m: any, i: number) => {
                        const maxRev = machineRanking[0]?.revenue || 1
                        return (
                            <div key={m.id} style={{ marginBottom: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', fontSize: '0.8125rem' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 600 }}>
                                        <span style={{ width: 18, height: 18, borderRadius: '50%', background: i < 3 ? ['#f59e0b', '#94a3b8', '#d97706'][i] : '#e2e8f0', color: i < 3 ? '#fff' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                                        {m.brand} {m.model}
                                    </span>
                                    <span style={{ fontWeight: 700, color: '#059669', fontSize: '0.8rem' }}>{formatCurrency(m.revenue)}</span>
                                </div>
                                <div style={{ height: 5, borderRadius: '9999px', background: '#f1f5f9', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', borderRadius: '9999px', background: 'linear-gradient(90deg, #2563eb, #06b6d4)', width: `${(m.revenue / maxRev) * 100}%` }} />
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Top Müşteriler */}
                <div className="card" style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '1rem' }}>⭐ En Değerli Müşteriler</h3>
                    {topCustomers.map((c: any, i: number) => {
                        const maxRev = topCustomers[0]?.rev || 1
                        return (
                            <div key={c.name} style={{ marginBottom: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', fontSize: '0.8125rem' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 600 }}>
                                        <span style={{ width: 18, height: 18, borderRadius: '50%', background: i < 3 ? ['#f59e0b', '#94a3b8', '#d97706'][i] : '#e2e8f0', color: i < 3 ? '#fff' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                                        {c.name}
                                    </span>
                                    <span style={{ fontWeight: 700, color: '#059669', fontSize: '0.8rem' }}>{formatCurrency(c.rev)}</span>
                                </div>
                                <div style={{ height: 5, borderRadius: '9999px', background: '#f1f5f9', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', borderRadius: '9999px', background: 'linear-gradient(90deg, #10b981, #34d399)', width: `${(c.rev / maxRev) * 100}%` }} />
                                </div>
                                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.125rem' }}>{c.count} kiralama</div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
