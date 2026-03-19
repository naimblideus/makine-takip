'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Truck, Wrench, Fuel, FileText, TrendingUp, MapPin } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const STATUS_LABELS: Record<string, string> = { MUSAIT: 'Müsait', KIRADA: 'Kirada', BAKIMDA: 'Bakımda', ARIZALI: 'Arızalı', REZERVE: 'Rezerve' }
const STATUS_COLORS: Record<string, string> = { MUSAIT: '#059669', KIRADA: '#2563eb', BAKIMDA: '#d97706', ARIZALI: '#dc2626', REZERVE: '#7c3aed' }
const TYPE_LABELS: Record<string, string> = { FORKLIFT: 'Forklift', EKSAVATOR: 'Ekskavatör', VINC: 'Vinç', DOZER: 'Dozer', KEPCE: 'Kepçe', GREYDER: 'Greyder', SILINDIR: 'Silindir', KAMYON: 'Kamyon', BEKO_LODER: 'Beko Loder', DIGER: 'Diğer' }

export default function MakineDetayPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [machine, setMachine] = useState<any>(null)
    const [totalRevenue, setTotalRevenue] = useState(0)
    const [karlilık, setKarlilık] = useState<any>(null)
    const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState<'genel' | 'kiralamalar' | 'bakim' | 'yakit' | 'transferler' | 'karlilık'>('genel')

    useEffect(() => {
        Promise.all([
            fetch(`/api/makineler/${id}`).then(r => r.json()),
            fetch(`/api/makineler/${id}/karl%C4%B1l%C4%B1k`).then(r => r.json()),
        ]).then(([mData, kData]) => {
            setMachine(mData.machine || mData)
            setTotalRevenue(mData.totalRevenue || 0)
            setKarlilık(kData.karlilık || kData.karlılık)
            setMonthlyRevenue(kData.monthlyRevenue || [])
        }).finally(() => setLoading(false))
    }, [id])

    if (loading) return <div className="spinner" style={{ margin: '3rem auto' }} />
    if (!machine) return <div className="alert alert-danger">Makine bulunamadı</div>

    const { rentals = [], maintenances = [], fuelEntries = [], amortization, transfers = [], _count, maintenanceSchedules = [] } = machine
    const tabs = [
        { key: 'genel', label: 'Genel', icon: <Truck size={14} /> },
        { key: 'kiralamalar', label: `Kiralamalar (${_count?.rentals || 0})`, icon: <FileText size={14} /> },
        { key: 'bakim', label: `Bakım (${_count?.maintenances || 0})`, icon: <Wrench size={14} /> },
        { key: 'yakit', label: `Yakıt (${_count?.fuelEntries || 0})`, icon: <Fuel size={14} /> },
        { key: 'transferler', label: `Nakliye (${transfers.length})`, icon: <MapPin size={14} /> },
        { key: 'karlilık', label: 'Kârlılık', icon: <TrendingUp size={14} /> },
    ]

    const statusColor = STATUS_COLORS[machine.status] || '#64748b'
    const activeRental = rentals.find((r: any) => r.status === 'AKTIF')

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div>
                    <Link href="/makineler" className="btn btn-sm btn-outline" style={{ marginBottom: '0.5rem', display: 'inline-flex' }}>
                        <ArrowLeft size={14} /> Makinelere Dön
                    </Link>
                    <h1 className="page-title">{machine.brand} {machine.model}</h1>
                    <p className="page-subtitle">{machine.plate || '—'} • {TYPE_LABELS[machine.type] || machine.type} {machine.year && `• ${machine.year}`}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <span style={{ padding: '0.35rem 0.875rem', borderRadius: '9999px', fontWeight: 700, fontSize: '0.8125rem', background: `${statusColor}20`, color: statusColor }}>
                        {STATUS_LABELS[machine.status] || machine.status}
                    </span>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>⏱ {Number(machine.totalHours || 0)} saat</div>
                </div>
            </div>

            {/* Aktif Kiralama Banner */}
            {activeRental && (
                <div style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', color: '#fff', borderRadius: '0.875rem', padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                        <div style={{ fontSize: '0.7rem', color: '#93c5fd', fontWeight: 600, marginBottom: '0.25rem' }}>AKTİF KİRALAMA</div>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{activeRental.customer?.companyName}</div>
                        {activeRental.site && <div style={{ fontSize: '0.8rem', color: '#93c5fd' }}>📍 {activeRental.site.name}</div>}
                    </div>
                    <Link href={`/kiralamalar/${activeRental.id}`} style={{ background: 'rgba(255,255,255,0.15)', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.8rem', color: '#fff', textDecoration: 'none' }}>
                        Detay →
                    </Link>
                </div>
            )}

            {/* Mini KPI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.625rem', marginBottom: '1.25rem' }}>
                {[
                    { label: 'Toplam Gelir', value: formatCurrency(totalRevenue), color: '#059669' },
                    { label: 'Net Kâr', value: karlilık ? formatCurrency(karlilık.netProfit) : '—', color: karlilık?.netProfit >= 0 ? '#059669' : '#dc2626' },
                    { label: 'Doluluk', value: karlilık ? `%${karlilık.occupancyRate}` : '—', color: '#2563eb' },
                    { label: 'Kiralama', value: `${_count?.rentals || 0}`, color: '#7c3aed' },
                ].map(k => (
                    <div key={k.label} className="stat-card" style={{ textAlign: 'center', padding: '0.875rem' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: k.color }}>{k.value}</div>
                        <div className="stat-card-label">{k.label}</div>
                    </div>
                ))}
            </div>

            {/* Sekmeler */}
            <div style={{ display: 'flex', gap: '0.125rem', borderBottom: '2px solid #f1f5f9', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {tabs.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key as any)}
                        style={{ padding: '0.5rem 0.875rem', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: tab === t.key ? '#2563eb' : '#64748b', borderBottom: tab === t.key ? '2px solid #2563eb' : '2px solid transparent', marginBottom: '-2px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* Genel */}
            {tab === 'genel' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                    <div className="card" style={{ padding: '1.25rem' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem' }}>Makine Bilgileri</h3>
                        {[
                            { label: 'Marka / Model', value: `${machine.brand} ${machine.model}` },
                            { label: 'Tip', value: TYPE_LABELS[machine.type] || machine.type },
                            { label: 'Plaka', value: machine.plate },
                            { label: 'Üretim Yılı', value: machine.year },
                            { label: 'Seri No', value: machine.serialNumber },
                            { label: 'Motor Saati', value: machine.totalHours ? `${Number(machine.totalHours)} saat` : null },
                            { label: 'Konum', value: machine.location },
                        ].filter(f => f.value).map(f => (
                            <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', paddingBottom: '0.5rem', borderBottom: '1px solid #f8fafc', marginBottom: '0.5rem' }}>
                                <span style={{ color: '#94a3b8' }}>{f.label}</span>
                                <span style={{ fontWeight: 600 }}>{f.value}</span>
                            </div>
                        ))}
                    </div>
                    {maintenanceSchedules.length > 0 && (
                        <div className="card" style={{ padding: '1.25rem' }}>
                            <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem' }}>🔧 Bakım Takvimleri</h3>
                            {maintenanceSchedules.map((s: any) => (
                                <div key={s.id} style={{ marginBottom: '0.75rem', padding: '0.625rem', background: s.nextDueDate && new Date(s.nextDueDate) < new Date() ? '#fee2e2' : '#f8fafc', borderRadius: '0.5rem' }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{s.maintenanceType}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Sonraki: {s.nextDueDate ? formatDate(s.nextDueDate) : '—'}</div>
                                </div>
                            ))}
                        </div>
                    )}
                    {amortization && (
                        <div className="card" style={{ padding: '1.25rem' }}>
                            <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem' }}>📉 Amortisman</h3>
                            {[
                                { label: 'Alış Fiyatı', value: formatCurrency(Number(amortization.purchasePrice)) },
                                { label: 'Alış Tarihi', value: formatDate(amortization.purchaseDate) },
                                { label: 'Kullanım Ömrü', value: `${amortization.usefulLifeYears} yıl` },
                            ].map(f => (
                                <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
                                    <span style={{ color: '#94a3b8' }}>{f.label}</span>
                                    <span style={{ fontWeight: 600 }}>{f.value}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Kiralamalar */}
            {tab === 'kiralamalar' && (
                <div className="card">
                    {rentals.length === 0 ? <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Kiralama geçmişi yok</div> : (
                        <table className="table">
                            <thead><tr><th>Müşteri</th><th>Şantiye</th><th>Süre</th><th>Gelir</th><th>Durum</th></tr></thead>
                            <tbody>
                                {rentals.map((r: any) => {
                                    const rev = r.invoices.reduce((s: number, inv: any) => s + inv.payments.reduce((s2: number, p: any) => s2 + Number(p.amount), 0), 0)
                                    return (
                                        <tr key={r.id}>
                                            <td style={{ fontWeight: 600, fontSize: '0.8rem' }}>{r.customer?.companyName}</td>
                                            <td style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.site?.name || '—'}</td>
                                            <td style={{ fontSize: '0.75rem' }}>{formatDate(r.startDate)} → {r.endDate ? formatDate(r.endDate) : '...'}</td>
                                            <td style={{ fontWeight: 700, color: '#059669', fontSize: '0.8rem' }}>{formatCurrency(rev)}</td>
                                            <td><span style={{ padding: '0.2rem 0.5rem', borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 700, background: `${STATUS_COLORS[r.status] || '#64748b'}20`, color: STATUS_COLORS[r.status] || '#64748b' }}>{r.status}</span></td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Bakım */}
            {tab === 'bakim' && (
                <div className="card">
                    {maintenances.length === 0 ? <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Bakım kaydı yok</div> : (
                        <table className="table">
                            <thead><tr><th>Tarih</th><th>Tür</th><th>Açıklama</th><th>Maliyet</th><th>Teknisyen</th></tr></thead>
                            <tbody>
                                {maintenances.map((m: any) => (
                                    <tr key={m.id}>
                                        <td style={{ fontSize: '0.8rem' }}>{formatDate(m.date)}</td>
                                        <td style={{ fontSize: '0.8rem', fontWeight: 600 }}>{m.type}</td>
                                        <td style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: 200 }}>{m.description || '—'}</td>
                                        <td style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.8rem' }}>{m.cost ? formatCurrency(Number(m.cost)) : '—'}</td>
                                        <td style={{ fontSize: '0.75rem', color: '#64748b' }}>{m.technician || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Yakıt */}
            {tab === 'yakit' && (
                <div className="card">
                    {fuelEntries.length === 0 ? <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Yakıt kaydı yok</div> : (
                        <table className="table">
                            <thead><tr><th>Tarih</th><th>Litre</th><th>Birim Fiyat</th><th>Toplam</th><th>Saat</th></tr></thead>
                            <tbody>
                                {fuelEntries.map((f: any) => (
                                    <tr key={f.id}>
                                        <td style={{ fontSize: '0.8rem' }}>{formatDate(f.date)}</td>
                                        <td style={{ fontWeight: 600 }}>{Number(f.liters).toFixed(1)} L</td>
                                        <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{f.unitPrice ? formatCurrency(Number(f.unitPrice)) : '—'}</td>
                                        <td style={{ fontWeight: 700, color: '#d97706', fontSize: '0.8rem' }}>{f.totalCost ? formatCurrency(Number(f.totalCost)) : '—'}</td>
                                        <td style={{ fontSize: '0.75rem', color: '#64748b' }}>{f.meterReading ? `${Number(f.meterReading)}s` : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Transferler */}
            {tab === 'transferler' && (
                <div className="card">
                    {transfers.length === 0 ? <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Transfer kaydı yok</div> : (
                        <table className="table">
                            <thead><tr><th>Tarih</th><th>Nereden</th><th>Nereye</th><th>Şoför</th><th>Mesafe</th><th>Maliyet</th></tr></thead>
                            <tbody>
                                {transfers.map((t: any) => (
                                    <tr key={t.id}>
                                        <td style={{ fontSize: '0.8rem' }}>{formatDate(t.transferDate)}</td>
                                        <td style={{ fontSize: '0.8rem' }}>{t.fromLocation}</td>
                                        <td style={{ fontSize: '0.8rem' }}>{t.toLocation}</td>
                                        <td style={{ fontSize: '0.75rem', color: '#64748b' }}>{t.driver || '—'}</td>
                                        <td style={{ fontSize: '0.8rem' }}>{t.distance ? `${Number(t.distance).toFixed(0)} km` : '—'}</td>
                                        <td style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.8rem' }}>{t.cost ? formatCurrency(Number(t.cost)) : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Kârlılık */}
            {tab === 'karlilık' && (
                <div>
                    {!karlilık ? (
                        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Kârlılık verisi yükleniyor...</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                            <div className="card" style={{ padding: '1.25rem', background: karlilık.netProfit >= 0 ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)' : 'linear-gradient(135deg, #fff1f2, #fee2e2)', border: `2px solid ${karlilık.netProfit >= 0 ? '#86efac' : '#fca5a5'}` }}>
                                <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem' }}>💰 Kârlılık Özeti</h3>
                                {[
                                    { label: 'Toplam Gelir', value: formatCurrency(karlilık.totalRevenue), color: '#059669' },
                                    { label: 'Bakım Gideri', value: formatCurrency(karlilık.totalMaintCost), color: '#d97706' },
                                    { label: 'Yakıt Gideri', value: formatCurrency(karlilık.totalFuelCost), color: '#ef4444' },
                                    { label: 'Amortisman', value: formatCurrency(karlilık.annualAmort), color: '#7c3aed' },
                                ].map(k => (
                                    <div key={k.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
                                        <span style={{ color: '#64748b' }}>{k.label}</span>
                                        <span style={{ fontWeight: 700, color: k.color }}>{k.value}</span>
                                    </div>
                                ))}
                                <div style={{ borderTop: '2px solid', borderColor: karlilık.netProfit >= 0 ? '#86efac' : '#fca5a5', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem' }}>
                                    <span>Net Kâr</span>
                                    <span style={{ color: karlilık.netProfit >= 0 ? '#059669' : '#dc2626' }}>{formatCurrency(karlilık.netProfit)}</span>
                                </div>
                            </div>
                            <div className="card" style={{ padding: '1.25rem' }}>
                                <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem' }}>📊 Aylık Gelir</h3>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={monthlyRevenue} margin={{ left: -20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
                                        <Tooltip formatter={(v: any) => formatCurrency(Number(v))} contentStyle={{ fontSize: '0.8rem', borderRadius: '0.5rem' }} />
                                        <Bar dataKey="gelir" fill="#2563eb" radius={[4, 4, 0, 0]} name="Gelir" />
                                    </BarChart>
                                </ResponsiveContainer>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '1rem', fontSize: '0.8rem' }}>
                                    <div style={{ background: '#f0f9ff', borderRadius: '0.5rem', padding: '0.5rem', textAlign: 'center' }}>
                                        <div style={{ fontWeight: 700, color: '#2563eb' }}>%{karlilık.occupancyRate}</div>
                                        <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Doluluk</div>
                                    </div>
                                    <div style={{ background: '#f0fdf4', borderRadius: '0.5rem', padding: '0.5rem', textAlign: 'center' }}>
                                        <div style={{ fontWeight: 700, color: '#059669' }}>{formatCurrency(karlilık.avgDailyRevenue)}</div>
                                        <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Günlük Ort.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
