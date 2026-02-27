'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Fuel, Plus, TrendingUp, Droplets, DollarSign, Gauge, Search, Calendar, Truck } from 'lucide-react'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
} from 'recharts'

export default function YakitPage() {
    const [entries, setEntries] = useState<any[]>([])
    const [machines, setMachines] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [machineFilter, setMachineFilter] = useState('all')
    const [dateFilter, setDateFilter] = useState('all') // all, thisMonth, lastMonth, last3Months

    useEffect(() => {
        Promise.all([
            fetch('/api/yakit').then(r => r.json()),
            fetch('/api/makineler').then(r => r.json()),
        ]).then(([fuelEntries, machineList]) => {
            setEntries(Array.isArray(fuelEntries) ? fuelEntries : [])
            setMachines(Array.isArray(machineList) ? machineList : [])
        }).catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    // Filtreleme
    const filtered = useMemo(() => {
        let result = entries
        if (machineFilter !== 'all') {
            result = result.filter(e => e.machineId === machineFilter)
        }
        const now = new Date()
        if (dateFilter === 'thisMonth') {
            result = result.filter(e => {
                const d = new Date(e.date)
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
            })
        } else if (dateFilter === 'lastMonth') {
            const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            result = result.filter(e => {
                const d = new Date(e.date)
                return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear()
            })
        } else if (dateFilter === 'last3Months') {
            const threshold = new Date(now.getFullYear(), now.getMonth() - 3, 1)
            result = result.filter(e => new Date(e.date) >= threshold)
        }
        return result
    }, [entries, machineFilter, dateFilter])

    // İstatistikler
    const stats = useMemo(() => {
        const totalLiters = filtered.reduce((s, e) => s + Number(e.liters), 0)
        const totalCost = filtered.reduce((s, e) => s + Number(e.cost), 0)
        const avgPricePerLiter = totalLiters > 0 ? totalCost / totalLiters : 0

        // Bu ay
        const now = new Date()
        const thisMonthEntries = entries.filter(e => {
            const d = new Date(e.date)
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        })
        const thisMonthLiters = thisMonthEntries.reduce((s, e) => s + Number(e.liters), 0)
        const thisMonthCost = thisMonthEntries.reduce((s, e) => s + Number(e.cost), 0)

        return { totalLiters, totalCost, avgPricePerLiter, thisMonthLiters, thisMonthCost }
    }, [filtered, entries])

    // Aylık trend verileri
    const chartData = useMemo(() => {
        const months: Record<string, { liters: number; cost: number }> = {}
        const now = new Date()
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
            months[key] = { liters: 0, cost: 0 }
        }
        entries.forEach(e => {
            const d = new Date(e.date)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            if (months[key]) {
                months[key].liters += Number(e.liters)
                months[key].cost += Number(e.cost)
            }
        })
        const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
        return Object.entries(months).map(([key, val]) => {
            const [y, m] = key.split('-')
            return {
                month: `${monthNames[parseInt(m) - 1]} ${y.slice(2)}`,
                litre: Math.round(val.liters),
                maliyet: Math.round(val.cost),
            }
        })
    }, [entries])

    // Makine bazlı analiz
    const machineAnalysis = useMemo(() => {
        const byMachine: Record<string, { name: string; liters: number; cost: number; count: number }> = {}
        filtered.forEach(e => {
            const key = e.machineId
            const name = e.machine ? `${e.machine.brand} ${e.machine.model}` : 'Bilinmeyen'
            if (!byMachine[key]) byMachine[key] = { name, liters: 0, cost: 0, count: 0 }
            byMachine[key].liters += Number(e.liters)
            byMachine[key].cost += Number(e.cost)
            byMachine[key].count++
        })
        return Object.values(byMachine)
            .sort((a, b) => b.cost - a.cost)
            .slice(0, 5)
    }, [filtered])

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
                <div className="spinner" />
            </div>
        )
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">⛽ Yakıt Takibi</h1>
                    <p className="page-subtitle">{entries.length} kayıt · Bu ay: {stats.thisMonthLiters.toFixed(0)} Lt</p>
                </div>
                <Link href="/yakit/yeni" className="btn btn-primary">
                    <Plus size={18} />
                    Yeni Kayıt
                </Link>
            </div>

            {/* İstatistik Kartları */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <StatCard
                    icon={<Droplets size={20} />}
                    label="Toplam Litre"
                    value={`${stats.totalLiters.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} Lt`}
                    color="#2563eb"
                    bgColor="#dbeafe"
                />
                <StatCard
                    icon={<DollarSign size={20} />}
                    label="Toplam Maliyet"
                    value={formatCurrency(stats.totalCost)}
                    color="#16a34a"
                    bgColor="#d1fae5"
                />
                <StatCard
                    icon={<Gauge size={20} />}
                    label="Birim Fiyat (₺/Lt)"
                    value={`₺${stats.avgPricePerLiter.toFixed(2)}`}
                    color="#ca8a04"
                    bgColor="#fef3c7"
                />
                <StatCard
                    icon={<TrendingUp size={20} />}
                    label="Bu Ay Harcama"
                    value={formatCurrency(stats.thisMonthCost)}
                    color="#dc2626"
                    bgColor="#fee2e2"
                />
            </div>

            {/* Grafik + Makine Analizi */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                {/* Aylık Trend */}
                <div className="card" style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>📊 Aylık Yakıt Tüketimi (Son 6 Ay)</h3>
                    <div style={{ width: '100%', height: 220 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                <Tooltip
                                    formatter={((value: number, name: string) => [
                                        name === 'litre' ? `${value.toLocaleString('tr-TR')} Lt` : formatCurrency(value),
                                        name === 'litre' ? 'Litre' : 'Maliyet',
                                    ]) as any}
                                    contentStyle={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.75rem' }}
                                />
                                <Bar dataKey="litre" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={16} name="litre" />
                                <Bar dataKey="maliyet" fill="#f97316" radius={[4, 4, 0, 0]} barSize={16} name="maliyet" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* En Çok Tüketen Makineler */}
                <div className="card" style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>🏆 En Çok Yakıt Harcayan Makineler</h3>
                    {machineAnalysis.length === 0 ? (
                        <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>Henüz veri yok</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {machineAnalysis.map((m, i) => {
                                const maxVal = machineAnalysis[0]?.cost || 1
                                const pct = (m.cost / maxVal) * 100
                                const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
                                return (
                                    <div key={i}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                                            <div>
                                                <span style={{ fontWeight: 600 }}>{m.name}</span>
                                                <span style={{ color: '#94a3b8', marginLeft: '0.5rem', fontSize: '0.75rem' }}>
                                                    {m.liters.toFixed(0)} Lt · {m.count} sefer
                                                </span>
                                            </div>
                                            <span style={{ fontWeight: 700 }}>{formatCurrency(m.cost)}</span>
                                        </div>
                                        <div style={{ height: '0.375rem', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${pct}%`,
                                                background: colors[i % colors.length],
                                                borderRadius: '9999px',
                                                transition: 'width 0.5s ease',
                                            }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Filtreler */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                    className="input select"
                    value={machineFilter}
                    onChange={(e) => setMachineFilter(e.target.value)}
                    style={{ maxWidth: '220px', fontSize: '0.8125rem' }}
                >
                    <option value="all">🚜 Tüm Makineler</option>
                    {machines.map((m: any) => (
                        <option key={m.id} value={m.id}>{m.brand} {m.model} ({m.plate || m.serialNumber || '-'})</option>
                    ))}
                </select>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {[
                        { key: 'all', label: 'Tümü' },
                        { key: 'thisMonth', label: 'Bu Ay' },
                        { key: 'lastMonth', label: 'Geçen Ay' },
                        { key: 'last3Months', label: 'Son 3 Ay' },
                    ].map(f => (
                        <button
                            key={f.key}
                            onClick={() => setDateFilter(f.key)}
                            className={cn('filter-chip', dateFilter === f.key && 'filter-chip-active')}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Kayıt Listesi */}
            {filtered.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon"><Fuel size={28} /></div>
                        <div className="empty-state-title">
                            {entries.length === 0 ? 'Yakıt kaydı yok' : 'Filtre sonucu bulunamadı'}
                        </div>
                        {entries.length === 0 && (
                            <Link href="/yakit/yeni" className="btn btn-primary btn-sm" style={{ marginTop: '0.5rem' }}>
                                <Plus size={16} /> İlk Kaydı Ekle
                            </Link>
                        )}
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {filtered.map((e: any) => {
                        const litreBasiFiyat = Number(e.liters) > 0 ? Number(e.cost) / Number(e.liters) : 0
                        return (
                            <div key={e.id} className="card" style={{ padding: '1rem 1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '200px' }}>
                                        {/* Makine Avatar */}
                                        <div style={{
                                            width: '2.75rem',
                                            height: '2.75rem',
                                            borderRadius: '0.75rem',
                                            background: 'linear-gradient(135deg, #f97316, #ea580c)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            <Fuel size={18} color="white" />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
                                                {e.machine?.brand} {e.machine?.model}
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.125rem' }}>
                                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                    📅 {formatDate(e.date)}
                                                </span>
                                                {e.machine?.plate && (
                                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                        🔖 {e.machine.plate}
                                                    </span>
                                                )}
                                                {e.supplier && (
                                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                        ⛽ {e.supplier}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                                        {/* Litre */}
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.625rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Litre</div>
                                            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#2563eb' }}>
                                                {parseFloat(e.liters).toFixed(1)}
                                            </div>
                                        </div>
                                        {/* Birim Fiyat */}
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.625rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>₺/Lt</div>
                                            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#64748b' }}>
                                                {litreBasiFiyat.toFixed(2)}
                                            </div>
                                        </div>
                                        {/* Toplam */}
                                        <div style={{ textAlign: 'center', minWidth: '80px' }}>
                                            <div style={{ fontSize: '0.625rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Toplam</div>
                                            <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a' }}>
                                                {formatCurrency(e.cost)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {e.notes && (
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
                                        💬 {e.notes}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

function StatCard({ icon, label, value, color, bgColor }: {
    icon: React.ReactNode; label: string; value: string; color: string; bgColor: string
}) {
    return (
        <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="stat-card-icon" style={{ background: bgColor, color }}>{icon}</div>
            <div>
                <div className="stat-card-value" style={{ color, fontSize: '1.125rem' }}>{value}</div>
                <div className="stat-card-label">{label}</div>
            </div>
        </div>
    )
}
