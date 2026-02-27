'use client'

import { useEffect, useState } from 'react'
import { formatCurrency, cn } from '@/lib/utils'
import { MACHINE_TYPE_LABELS } from '@/lib/constants'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend,
    AreaChart, Area, LineChart, Line,
} from 'recharts'
import { TrendingUp, Activity, Fuel, MapPin, Clock, Gauge, Zap } from 'lucide-react'

const PIE_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#64748b']

type TabKey = 'genel' | 'kullanim' | 'yakit' | 'performans'

export default function RaporlarPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState<TabKey>('genel')
    const [gpsData, setGpsData] = useState<any>(null)

    useEffect(() => {
        Promise.all([
            fetch('/api/raporlar').then(r => r.json()).catch(() => null),
            fetch('/api/gps/positions').then(r => r.json()).catch(() => []),
        ]).then(([reportData, positions]) => {
            setData(reportData)
            setGpsData(positions)
        }).finally(() => setLoading(false))
    }, [])

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
            <div className="spinner" />
        </div>
    )

    // GPS özet istatistikleri
    const gpsList = Array.isArray(gpsData) ? gpsData : []
    const withSpeed = gpsList.filter((v: any) => v.position && v.position.speed > 0)
    const withFuel = gpsList.filter((v: any) => v.position && v.position.fuel != null && v.position.fuel !== undefined)
    const gpsStats = {
        totalOnline: gpsList.filter((v: any) => v.online).length,
        totalMachines: gpsList.length,
        totalRunning: gpsList.filter((v: any) => v.position?.ignition && v.position?.motion).length,
        totalIdle: gpsList.filter((v: any) => v.position?.ignition && !v.position?.motion).length,
        totalOff: gpsList.filter((v: any) => !v.position?.ignition).length,
        avgSpeed: withSpeed.length > 0 ? withSpeed.reduce((a: number, v: any) => a + v.position.speed, 0) / withSpeed.length : 0,
        avgFuel: withFuel.length > 0 ? withFuel.reduce((a: number, v: any) => a + v.position.fuel, 0) / withFuel.length : 0,
    }

    // Mock kullanım verileri (gerçekte API'den gelecek)
    const utilizationData = [
        { name: 'Pzt', calisan: 85, bosta: 15 },
        { name: 'Sal', calisan: 78, bosta: 22 },
        { name: 'Çar', calisan: 92, bosta: 8 },
        { name: 'Per', calisan: 88, bosta: 12 },
        { name: 'Cum', calisan: 75, bosta: 25 },
        { name: 'Cmt', calisan: 45, bosta: 55 },
        { name: 'Paz', calisan: 10, bosta: 90 },
    ]

    const fuelTrendData = [
        { name: 'Oca', tuketim: 4200, maliyet: 142000 },
        { name: 'Şub', tuketim: 3800, maliyet: 129000 },
        { name: 'Mar', tuketim: 4600, maliyet: 156000 },
        { name: 'Nis', tuketim: 5100, maliyet: 173000 },
        { name: 'May', tuketim: 4900, maliyet: 166000 },
        { name: 'Haz', tuketim: 5300, maliyet: 180000 },
    ]

    const pieData = data?.machineTypes?.map((t: any) => ({
        name: MACHINE_TYPE_LABELS[t.type as keyof typeof MACHINE_TYPE_LABELS] || t.type,
        value: t.count,
    })) || []

    const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
        { key: 'genel', label: 'Genel Bakış', icon: <TrendingUp size={16} /> },
        { key: 'kullanim', label: 'Kullanım Analizi', icon: <Activity size={16} /> },
        { key: 'yakit', label: 'Yakıt Analizi', icon: <Fuel size={16} /> },
        { key: 'performans', label: 'Performans', icon: <Gauge size={16} /> },
    ]

    return (
        <div>
            <div className="page-header animate-fade-in">
                <div>
                    <h1 className="page-title">📊 Raporlar & Analiz</h1>
                    <p className="page-subtitle">Filo performansı ve iş zekası</p>
                </div>
            </div>

            {/* Sekmeler */}
            <div className="tab-nav" style={{ marginBottom: 24 }}>
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={cn('tab-item', tab === t.key && 'tab-item-active')}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* GENEL */}
            {tab === 'genel' && (
                <div>
                    {/* KPI satırı */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
                        <KPICard label="Toplam Gelir" value={formatCurrency(data?.finance?.totalRevenue || 0)} color="#2563eb" />
                        <KPICard label="Bu Ay Tahsilat" value={formatCurrency(data?.finance?.paidThisMonth || 0)} color="#16a34a" />
                        <KPICard label="Bekleyen Alacak" value={formatCurrency(data?.finance?.pendingRevenue || 0)} color="#ca8a04" />
                        <KPICard label="Aktif Kiralama" value={data?.activeRentals || 0} color="#8b5cf6" />
                    </div>

                    {/* Grafikler */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, marginBottom: 20 }}>
                        <div className="card" style={{ padding: '1.25rem' }}>
                            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>📈 Aylık Gelir (Son 6 Ay)</h3>
                            <div style={{ width: '100%', height: 220 }}>
                                <ResponsiveContainer>
                                    <BarChart data={data?.chartData || []} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
                                        <Tooltip formatter={((v: number) => [formatCurrency(v), 'Gelir']) as any} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
                                        <Bar dataKey="gelir" fill="#2563eb" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="card" style={{ padding: '1.25rem' }}>
                            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>🚛 Filo Dağılımı</h3>
                            <div style={{ width: '100%', height: 220 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                                            paddingAngle={3} dataKey="value"
                                            label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            style={{ fontSize: '0.6875rem' }}>
                                            {pieData.map((_: any, i: number) => (
                                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Canlı filo durumu */}
                    {gpsData && gpsData.length > 0 && (
                        <div className="card" style={{ padding: '1.25rem', marginBottom: 20 }}>
                            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>🗺️ Anlık Filo Durumu</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                                <MiniStat label="Çevrimiçi" value={gpsStats.totalOnline} total={gpsStats.totalMachines} color="#16a34a" />
                                <MiniStat label="Çalışıyor" value={gpsStats.totalRunning} total={gpsStats.totalMachines} color="#2563eb" />
                                <MiniStat label="Rölantide" value={gpsStats.totalIdle} total={gpsStats.totalMachines} color="#f59e0b" />
                                <MiniStat label="Kapalı" value={gpsStats.totalOff} total={gpsStats.totalMachines} color="#dc2626" />
                                <MiniStat label="Ort. Hız" value={`${Math.round(gpsStats.avgSpeed)} km/h`} color="#8b5cf6" />
                                <MiniStat label="Ort. Yakıt" value={`%${Math.round(gpsStats.avgFuel)}`} color="#06b6d4" />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* KULLANIM ANALİZİ */}
            {tab === 'kullanim' && (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
                        <KPICard label="Günlük Ort. Kullanım" value="72%" color="#16a34a" />
                        <KPICard label="Haftalık Boşta Süre" value="18 saat" color="#f59e0b" />
                        <KPICard label="Aylık Motor Saati" value="1.240 sa" color="#2563eb" />
                        <KPICard label="Top Makine" value="HK-4521" color="#8b5cf6" />
                    </div>

                    <div className="card" style={{ padding: '1.25rem', marginBottom: 20 }}>
                        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>📊 Haftalık Kullanım Oranı</h3>
                        <div style={{ width: '100%', height: 280 }}>
                            <ResponsiveContainer>
                                <BarChart data={utilizationData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v: number) => `%${v}`} />
                                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
                                    <Legend />
                                    <Bar dataKey="calisan" fill="#16a34a" name="Çalışma" radius={[4, 4, 0, 0]} stackId="a" />
                                    <Bar dataKey="bosta" fill="#fde68a" name="Boşta" radius={[4, 4, 0, 0]} stackId="a" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Makine bazında kullanım tablosu */}
                    {gpsData && gpsData.length > 0 && (
                        <div className="card" style={{ marginBottom: 20 }}>
                            <div style={{ padding: '1rem 1.25rem', fontWeight: 700, fontSize: '0.9375rem', borderBottom: '1px solid var(--color-border)' }}>
                                🏗️ Makine Bazında Durum
                            </div>
                            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Makine</th>
                                            <th>Durum</th>
                                            <th>Hız</th>
                                            <th>Yakıt</th>
                                            <th>Kiracı</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {gpsData.map((v: any) => (
                                            <tr key={v.machineId}>
                                                <td style={{ fontWeight: 600 }}>{v.plate || `${v.brand} ${v.model}`}</td>
                                                <td>
                                                    <span style={{
                                                        padding: '2px 8px', borderRadius: 999, fontSize: '0.6875rem', fontWeight: 700,
                                                        background: v.position?.ignition ? (v.position?.motion ? '#d1fae5' : '#fef3c7') : '#fee2e2',
                                                        color: v.position?.ignition ? (v.position?.motion ? '#065f46' : '#92400e') : '#991b1b',
                                                    }}>
                                                        {v.position?.ignition ? (v.position?.motion ? 'Çalışıyor' : 'Rölanti') : 'Kapalı'}
                                                    </span>
                                                </td>
                                                <td>{v.position?.speed || 0} km/h</td>
                                                <td>{v.position?.fuel != null ? `%${v.position.fuel}` : '-'}</td>
                                                <td style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>{v.activeRental?.customer || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* YAKIT ANALİZİ */}
            {tab === 'yakit' && (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
                        <KPICard label="Aylık Tüketim" value="5.300 L" color="#f59e0b" />
                        <KPICard label="Aylık Maliyet" value={formatCurrency(180000)} color="#dc2626" />
                        <KPICard label="Ort. L/Saat" value="8.2" color="#2563eb" />
                        <KPICard label="CO₂ Emisyon" value="14.2 ton" color="#64748b" />
                    </div>

                    <div className="card" style={{ padding: '1.25rem', marginBottom: 20 }}>
                        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>⛽ Yakıt Tüketim Trendi (Son 6 Ay)</h3>
                        <div style={{ width: '100%', height: 280 }}>
                            <ResponsiveContainer>
                                <AreaChart data={fuelTrendData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="fuelGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
                                    <Area type="monotone" dataKey="tuketim" stroke="#f59e0b" fillOpacity={1} fill="url(#fuelGrad)" name="Litre" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="card" style={{ padding: '1.25rem' }}>
                        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>💰 Yakıt Maliyet Trendi</h3>
                        <div style={{ width: '100%', height: 220 }}>
                            <ResponsiveContainer>
                                <LineChart data={fuelTrendData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
                                    <Tooltip formatter={((v: number) => [formatCurrency(v), 'Maliyet']) as any} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
                                    <Line type="monotone" dataKey="maliyet" stroke="#dc2626" strokeWidth={2} dot={{ fill: '#dc2626', r: 4 }} name="Maliyet" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* PERFORMANS */}
            {tab === 'performans' && (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
                        <KPICard label="Filo Sağlık Skoru" value="82/100" color="#16a34a" />
                        <KPICard label="Hız İhlali" value="3" color="#dc2626" />
                        <KPICard label="Geofence İhlali" value="1" color="#f59e0b" />
                        <KPICard label="Yetkisiz Kullanım" value="0" color="#8b5cf6" />
                    </div>

                    <div className="card" style={{ padding: '1.25rem', marginBottom: 20 }}>
                        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>🏆 Makine Sağlık Skorları</h3>
                        {gpsData && gpsData.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {gpsData.slice(0, 8).map((v: any, i: number) => {
                                    const score = Math.floor(60 + Math.random() * 35) // Mock skor
                                    const barColor = score > 80 ? '#16a34a' : score > 60 ? '#f59e0b' : '#dc2626'
                                    return (
                                        <div key={v.machineId} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 160, fontWeight: 600, fontSize: '0.8125rem', flexShrink: 0 }}>
                                                {v.plate || `${v.brand} ${v.model}`}
                                            </div>
                                            <div style={{ flex: 1, height: 20, background: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                                                <div style={{
                                                    width: `${score}%`, height: '100%', background: barColor,
                                                    borderRadius: 10, transition: 'width 0.5s ease',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8,
                                                    fontSize: '0.6875rem', color: 'white', fontWeight: 700,
                                                }}>
                                                    {score}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>GPS verileri yükleniyor...</p>
                        )}
                    </div>

                    <div className="card" style={{ padding: '1.25rem' }}>
                        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>🔔 Son Alarmlar</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {[
                                { icon: '⚡', text: 'HK-4521 hız sınırını aştı (62 km/h)', time: '2 saat önce', color: '#fef2f2' },
                                { icon: '📐', text: 'EK-1234 geofence dışına çıktı', time: '5 saat önce', color: '#fffbeb' },
                                { icon: '💤', text: 'VN-7890 30 dk boşta çalıştı', time: 'Dün', color: '#eff6ff' },
                            ].map((a, i) => (
                                <div key={i} style={{ display: 'flex', gap: 8, padding: '0.5rem 0.75rem', background: a.color, borderRadius: 8, fontSize: '0.8125rem' }}>
                                    <span>{a.icon}</span>
                                    <span style={{ flex: 1 }}>{a.text}</span>
                                    <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>{a.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function KPICard({ label, value, color }: { label: string; value: string | number; color: string }) {
    return (
        <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="stat-card-icon" style={{ background: color + '18', color }}><Zap size={20} /></div>
            <div>
                <div className="stat-card-value" style={{ color, fontSize: '1.25rem' }}>{value}</div>
                <div className="stat-card-label">{label}</div>
            </div>
        </div>
    )
}

function MiniStat({ label, value, total, color }: { label: string; value: string | number; total?: number; color: string }) {
    return (
        <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: 8, border: '1px solid var(--color-border)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-muted)', fontWeight: 500 }}>
                {label} {total ? `/ ${total}` : ''}
            </div>
        </div>
    )
}
