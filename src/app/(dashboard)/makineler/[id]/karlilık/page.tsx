'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { TrendingUp, TrendingDown, BarChart2, Fuel, Wrench, ArrowLeft } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'

export default function MachineKarlilikPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`/api/makineler/${id}/karlil%C4%B1k`)
            .then(r => r.json())
            .then(setData)
            .finally(() => setLoading(false))
    }, [id])

    if (loading) return <div className="spinner" style={{ margin: '3rem auto' }} />
    if (!data) return <div className="alert alert-danger">Veri yüklenemedi</div>

    const { machine, karlilık, monthlyRevenue, amortization } = data
    const isProfit = karlilık.netProfit >= 0

    return (
        <div>
            <div className="page-header">
                <div>
                    <Link href="/makineler" className="btn btn-sm btn-outline" style={{ marginBottom: '0.5rem', display: 'inline-flex' }}>
                        <ArrowLeft size={14} /> Makinelere Dön
                    </Link>
                    <h1 className="page-title">{machine.brand} {machine.model} — Kârlılık Analizi</h1>
                    <p className="page-subtitle">{machine.plate || machine.type} • {Number(machine.totalHours)}s toplam çalışma</p>
                </div>
            </div>

            {/* Kârlılık Özeti */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem', background: isProfit ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : 'linear-gradient(135deg, #fff1f2 0%, #fee2e2 100%)', border: `2px solid ${isProfit ? '#86efac' : '#fca5a5'}` }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Toplam Gelir</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669' }}>{formatCurrency(karlilık.totalRevenue)}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Giderler</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626' }}>
                            {formatCurrency(karlilık.totalMaintCost + karlilık.totalFuelCost + karlilık.annualAmort)}
                        </div>
                    </div>
                    <div style={{ textAlign: 'center', borderLeft: '2px solid', borderColor: isProfit ? '#86efac' : '#fca5a5', paddingLeft: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>NET KÂR</div>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: isProfit ? '#059669' : '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
                            {isProfit ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                            {formatCurrency(Math.abs(karlilık.netProfit))}
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Doluluk Oranı</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563eb' }}>%{karlilık.occupancyRate}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{karlilık.totalRentDays} gün / yıl</div>
                    </div>
                </div>
            </div>

            {/* Gider Dağılımı */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="card" style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>💸 Gider Dağılımı</h3>
                    {[
                        { label: 'Bakım Gideri', value: karlilık.totalMaintCost, icon: <Wrench size={16} />, color: '#f59e0b' },
                        { label: 'Yakıt Gideri', value: karlilık.totalFuelCost, icon: <Fuel size={16} />, color: '#ef4444' },
                        { label: 'Yıllık Amortisman', value: karlilık.annualAmort, icon: <BarChart2 size={16} />, color: '#8b5cf6' },
                    ].map(g => (
                        <div key={g.label} style={{ marginBottom: '0.875rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem', fontSize: '0.8125rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#64748b' }}>{g.icon} {g.label}</span>
                                <span style={{ fontWeight: 700 }}>{formatCurrency(g.value)}</span>
                            </div>
                            <div style={{ height: '6px', borderRadius: '9999px', background: '#f1f5f9', overflow: 'hidden' }}>
                                <div style={{ height: '100%', borderRadius: '9999px', background: g.color, width: `${karlilık.totalRevenue > 0 ? Math.min((g.value / karlilık.totalRevenue) * 100, 100) : 0}%` }} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="card" style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>📊 Aylık Gelir Trendi</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={monthlyRevenue} margin={{ left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
                            <Tooltip formatter={(v: any) => formatCurrency(Number(v))} contentStyle={{ fontSize: '0.8rem', borderRadius: '0.5rem' }} />
                            <Bar dataKey="gelir" fill="#2563eb" radius={[4, 4, 0, 0]} name="Gelir" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* İstatistikler */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
                {[
                    { label: 'Toplam Kiralama', value: `${karlilık.totalRentals}`, desc: 'kiralama' },
                    { label: 'Ort. Günlük Gelir', value: formatCurrency(karlilık.avgDailyRevenue), desc: 'kiralandığı gün' },
                    { label: 'Amortisman/Yıl', value: formatCurrency(karlilık.annualAmort), desc: amortization ? `₺${Number(amortization.purchasePrice).toLocaleString('tr-TR')} alış` : 'Amortisman yok' },
                ].map(s => (
                    <div key={s.label} className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.25rem' }}>{s.label}</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>{s.value}</div>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{s.desc}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}
