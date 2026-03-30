'use client'

import { useEffect, useState } from 'react'
import { Users, Star, AlertTriangle, Shield, TrendingUp, Phone, Mail, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    VIP: { label: 'VIP', color: '#7c3aed', bg: '#ede9fe', icon: '💎' },
    PREMIUM: { label: 'Premium', color: '#2563eb', bg: '#dbeafe', icon: '⭐' },
    STANDART: { label: 'Standart', color: '#64748b', bg: '#f1f5f9', icon: '👤' },
    RISKLI: { label: 'Riskli', color: '#dc2626', bg: '#fee2e2', icon: '⚠️' },
}

const INTERACTION_TYPES = [
    { value: 'ARAMA', label: 'Telefon' },
    { value: 'ZIYARET', label: 'Ziyaret' },
    { value: 'EMAIL', label: 'E-posta' },
    { value: 'WHATSAPP', label: 'WhatsApp' },
    { value: 'SIKAYET', label: 'Şikayet' },
    { value: 'TEKLIF', label: 'Teklif' },
]

export default function MusteriCRMPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('ALL')
    const [search, setSearch] = useState('')
    const [expanded, setExpanded] = useState<string | null>(null)
    const [tierModal, setTierModal] = useState<any>(null)

    const load = async () => {
        setLoading(true)
        const res = await fetch('/api/musteri-crm')
        setData(await res.json())
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    const updateTier = async (customerId: string, tier: string) => {
        await fetch('/api/musteri-crm', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerId, tier }),
        })
        setTierModal(null)
        load()
    }

    if (loading) return <div className="spinner" style={{ margin: '3rem auto' }} />
    if (!data) return <div className="alert alert-danger">Veriler yüklenemedi</div>

    const { customers = [], tierCounts = {}, topCustomers = [] } = data

    const filtered = customers.filter((c: any) => {
        if (filter !== 'ALL' && c.tier !== filter) return false
        if (search && !c.companyName.toLowerCase().includes(search.toLowerCase()) &&
            !(c.contactPerson || '').toLowerCase().includes(search.toLowerCase())) return false
        return true
    })

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Users size={22} color="#7c3aed" /> Müşteri CRM
                    </h1>
                    <p className="page-subtitle">Müşteri segmentasyonu, risk analizi ve etkileşim takibi</p>
                </div>
            </div>

            {/* Tier Kartları */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {Object.entries(TIER_CONFIG).map(([key, cfg]) => (
                    <div key={key} className="card" style={{
                        padding: '1rem', textAlign: 'center', cursor: 'pointer',
                        border: filter === key ? `2px solid ${cfg.color}` : '2px solid transparent',
                        transition: 'border 0.2s',
                    }} onClick={() => setFilter(filter === key ? 'ALL' : key)}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{cfg.icon}</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: cfg.color }}>{tierCounts[key] || 0}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{cfg.label}</div>
                    </div>
                ))}
            </div>

            {/* Arama */}
            <div style={{ marginBottom: '1rem' }}>
                <input
                    type="text"
                    className="form-input"
                    placeholder="Müşteri ara (firma adı veya yetkili)..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ maxWidth: 400 }}
                />
            </div>

            {/* Top Müşteriler + Liste */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                {/* Top 10 */}
                <div className="card" style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>🏆 En Yüksek Cirolu Müşteriler</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        {topCustomers.map((c: any, i: number) => {
                            const tc = TIER_CONFIG[c.tier] || TIER_CONFIG.STANDART
                            return (
                                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.625rem', borderRadius: '0.375rem', background: i < 3 ? '#fffbeb' : '#f8fafc' }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: i === 0 ? '#d97706' : '#94a3b8', minWidth: 20 }}>{i + 1}.</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{c.companyName}</div>
                                        <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>{c.totalRentals} kiralama</div>
                                    </div>
                                    <span style={{ padding: '0.1rem 0.4rem', borderRadius: '9999px', fontSize: '0.6rem', fontWeight: 700, background: tc.bg, color: tc.color }}>{tc.label}</span>
                                    <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#16a34a' }}>{formatCurrency(c.totalRevenue)}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Risk Dağılımı */}
                <div className="card" style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '1rem' }}>📊 Segment Dağılımı</h3>
                    {Object.entries(TIER_CONFIG).map(([key, cfg]) => {
                        const count = tierCounts[key] || 0
                        const pct = data.totalCustomers > 0 ? (count / data.totalCustomers) * 100 : 0
                        return (
                            <div key={key} style={{ marginBottom: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                                    <span style={{ fontWeight: 600 }}>{cfg.icon} {cfg.label}</span>
                                    <span style={{ color: '#64748b' }}>{count} ({pct.toFixed(0)}%)</span>
                                </div>
                                <div style={{ height: 8, borderRadius: '9999px', background: '#f1f5f9', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', borderRadius: '9999px', background: cfg.color, width: `${pct}%`, transition: 'width 0.5s ease' }} />
                                </div>
                            </div>
                        )
                    })}
                    <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
                        Toplam {data.totalCustomers} müşteri
                    </div>
                </div>
            </div>

            {/* Müşteri Listesi */}
            <div className="card">
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontSize: '0.9375rem' }}>
                    Müşteriler {filter !== 'ALL' && `— ${TIER_CONFIG[filter]?.label || filter}`} ({filtered.length})
                </div>
                {filtered.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                        <Users size={36} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                        <div>Sonuç bulunamadı</div>
                    </div>
                ) : (
                    <div>
                        {filtered.map((c: any) => {
                            const tc = TIER_CONFIG[c.tier] || TIER_CONFIG.STANDART
                            const isExpanded = expanded === c.id
                            return (
                                <div key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <div
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.25rem', cursor: 'pointer' }}
                                        onClick={() => setExpanded(isExpanded ? null : c.id)}
                                    >
                                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: tc.bg, color: tc.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                                            {tc.icon}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                                {c.companyName}
                                                {c.isBlacklisted && <span style={{ color: '#dc2626', fontSize: '0.7rem', marginLeft: '0.5rem' }}>🚫 Kara Liste</span>}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', gap: '0.75rem', marginTop: '0.125rem' }}>
                                                {c.contactPerson && <span>{c.contactPerson}</span>}
                                                {c.phone && <span><Phone size={10} /> {c.phone}</span>}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', minWidth: 100 }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#16a34a' }}>{formatCurrency(c.totalRevenue)}</div>
                                            <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{c.totalRentals} kiralama</div>
                                        </div>
                                        <span style={{ padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 700, background: tc.bg, color: tc.color }}>
                                            {tc.label}
                                        </span>
                                        {isExpanded ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
                                    </div>

                                    {/* Detay */}
                                    {isExpanded && (
                                        <div style={{ padding: '0 1.25rem 1rem', background: '#fafbfc' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.625rem', marginBottom: '0.75rem' }}>
                                                <ScoreBadge label="Ödeme Skoru" value={c.paymentScore} />
                                                <ScoreBadge label="Sadakat Skoru" value={c.loyaltyScore} />
                                                <ScoreBadge label="Risk Skoru" value={c.riskScore} reverse />
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                    Aktif: <strong>{c.activeRentals}</strong> | Gecikmiş Fatura: <strong style={{ color: c.overdueInvoices > 0 ? '#dc2626' : '#16a34a' }}>{c.overdueInvoices}</strong>
                                                </span>
                                            </div>
                                            {c.lastInteraction && (
                                                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#475569', background: '#fff', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}>
                                                    <MessageSquare size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                                    <strong>{c.lastInteraction.type}:</strong> {c.lastInteraction.title}
                                                    <span style={{ color: '#94a3b8', marginLeft: '0.5rem' }}>{new Date(c.lastInteraction.createdAt).toLocaleDateString('tr-TR')}</span>
                                                </div>
                                            )}
                                            <div style={{ marginTop: '0.625rem', display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                                                {Object.entries(TIER_CONFIG).map(([key, cfg]) => (
                                                    <button
                                                        key={key}
                                                        className="btn btn-sm"
                                                        style={{
                                                            background: c.tier === key ? cfg.color : cfg.bg,
                                                            color: c.tier === key ? '#fff' : cfg.color,
                                                            border: 'none', fontSize: '0.65rem', padding: '0.2rem 0.6rem',
                                                        }}
                                                        onClick={() => updateTier(c.id, key)}
                                                    >
                                                        {cfg.icon} {cfg.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

function ScoreBadge({ label, value, reverse }: { label: string; value: number; reverse?: boolean }) {
    const color = reverse
        ? (value >= 70 ? '#dc2626' : value >= 40 ? '#f59e0b' : '#10b981')
        : (value >= 70 ? '#10b981' : value >= 40 ? '#f59e0b' : '#dc2626')
    return (
        <div style={{ background: '#fff', borderRadius: '0.5rem', padding: '0.5rem', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '0.625rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.25rem' }}>{label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', justifyContent: 'center' }}>
                <div style={{ height: 6, borderRadius: '9999px', background: '#f1f5f9', flex: 1, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '9999px', background: color, width: `${value}%` }} />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color, minWidth: 20 }}>{value}</span>
            </div>
        </div>
    )
}
