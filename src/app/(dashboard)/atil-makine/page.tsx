'use client'

import { useEffect, useState } from 'react'
import { Gauge, TrendingDown, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const MACHINE_TYPE_LABELS: Record<string, string> = {
    FORKLIFT: 'Forklift', EKSAVATOR: 'Ekskavatör', VINC: 'Vinç', DOZER: 'Dozer', KEPCE: 'Kepçe',
    GREYDER: 'Greyder', SILINDIR: 'Silindir', KAMYON: 'Kamyon', BEKO_LODER: 'Beko Loder', DIGER: 'Diğer',
}

export default function AtilMakinePage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/utilization').then(r => r.json()).then(setData).finally(() => setLoading(false))
    }, [])

    if (loading) return <div className="spinner" style={{ margin: '3rem auto' }} />
    const rows = data?.rows || []
    const sum = data?.summary || {}

    const barColor = (u: number) => u >= 65 ? '#059669' : u >= 35 ? '#d97706' : '#dc2626'

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 36, height: 36, borderRadius: 10, background: '#f59e0b20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Gauge size={20} color="#f59e0b" /></span>
                        Atıl Makine & Kullanım
                    </h1>
                    <p className="page-subtitle">Son 30 gün doluluk oranı — düşük kullanım sessiz amortisman kaybıdır (hedef %{sum.targetUtilization || 70})</p>
                </div>
            </div>

            <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
                {[
                    { icon: <Gauge size={20} />, c: '#2563eb', v: `%${sum.avgUtilization || 0}`, l: 'Ortalama Doluluk' },
                    { icon: <AlertTriangle size={20} />, c: '#dc2626', v: sum.idleCount || 0, l: 'Atıl Makine' },
                    { icon: <TrendingDown size={20} />, c: '#d97706', v: formatCurrency(sum.idleCostMonthly || 0), l: 'Aylık Gizli Maliyet (tahmini)' },
                ].map((s, i) => (
                    <div className="stat-card" key={i}>
                        <div className="stat-card-icon" style={{ background: s.c + '20', color: s.c }}>{s.icon}</div>
                        <div className="stat-card-content">
                            <div className="stat-card-value" style={{ color: s.c, fontSize: typeof s.v === 'string' && s.v.includes('₺') ? '1.1rem' : undefined }}>{s.v}</div>
                            <div className="stat-card-label">{s.l}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card">
                <table className="table">
                    <thead><tr><th>Makine</th><th>Tip</th><th>Durum</th><th style={{ width: '30%' }}>Doluluk (30g)</th><th>Oturum</th><th>Gizli Maliyet</th></tr></thead>
                    <tbody>
                        {rows.map((r: any) => (
                            <tr key={r.id} style={{ background: r.idle ? '#fef2f2' : undefined }}>
                                <td>
                                    <div style={{ fontWeight: 600 }}>{r.name}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{r.plate}</div>
                                </td>
                                <td style={{ fontSize: '0.8rem' }}>{MACHINE_TYPE_LABELS[r.type] || r.type}</td>
                                <td>
                                    {r.activeRental
                                        ? <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#2563eb' }}>KİRADA</span>
                                        : r.idle ? <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#dc2626' }}>ATIL</span>
                                            : <span style={{ fontSize: '0.7rem', color: '#64748b' }}>—</span>}
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 9999, overflow: 'hidden' }}>
                                            <div style={{ width: `${Math.min(100, r.utilization)}%`, height: '100%', background: barColor(r.utilization) }} />
                                        </div>
                                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: barColor(r.utilization), minWidth: 38 }}>%{r.utilization}</span>
                                    </div>
                                </td>
                                <td style={{ fontSize: '0.8rem' }}>{r.sessionCount}</td>
                                <td style={{ fontWeight: 700, color: r.idle ? '#dc2626' : '#94a3b8' }}>{r.estIdleCostMonthly ? formatCurrency(r.estIdleCostMonthly) : '—'}</td>
                            </tr>
                        ))}
                        {rows.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>Makine yok</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
