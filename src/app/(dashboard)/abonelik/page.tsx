'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Check, Truck, Clock, TrendingUp, Store } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { ADD_ONS, MARKETPLACE_TERMS } from '@/lib/pricing'

export default function AbonelikPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState('')

    const load = async () => {
        const res = await fetch('/api/abonelik')
        setData(await res.json())
        setLoading(false)
    }
    useEffect(() => { load() }, [])

    const changePlan = async (plan: string) => {
        setSaving(plan)
        await fetch('/api/abonelik', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan }) })
        await load()
        setSaving('')
    }

    const changeCycle = async (billingCycle: string) => {
        await fetch('/api/abonelik', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ billingCycle }) })
        await load()
    }

    if (loading) return <div className="spinner" style={{ margin: '3rem auto' }} />

    const sub = data?.subscription
    const plans = data?.plans || []
    const usagePct = sub ? Math.min(100, Math.round((sub.machineCount / sub.machineLimit) * 100)) : 0
    const statusLabel: Record<string, { t: string; c: string; b: string }> = {
        TRIAL: { t: 'Deneme', c: '#7c3aed', b: '#ede9fe' },
        ACTIVE: { t: 'Aktif', c: '#059669', b: '#d1fae5' },
        PAST_DUE: { t: 'Ödeme Bekliyor', c: '#d97706', b: '#fef3c7' },
        CANCELED: { t: 'İptal', c: '#dc2626', b: '#fee2e2' },
    }
    const sl = statusLabel[sub?.status] || statusLabel.ACTIVE

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Abonelik</h1>
                    <p className="page-subtitle">Planınız, kullanımınız ve faturalama</p>
                </div>
            </div>

            {/* Mevcut durum */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Sparkles size={20} color="#2563eb" />
                            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>{sub?.planDef?.name}</span>
                            <span style={{ padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 700, background: sl.b, color: sl.c }}>{sl.t}</span>
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>{sub?.planDef?.tagline}</div>
                        {sub?.status === 'TRIAL' && sub?.trialDaysLeft != null && (
                            <div style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: sub.trialDaysLeft < 4 ? '#dc2626' : '#7c3aed', fontWeight: 600, fontSize: '0.8125rem' }}>
                                <Clock size={14} /> {sub.trialDaysLeft >= 0 ? `Deneme bitişine ${sub.trialDaysLeft} gün` : 'Deneme süresi doldu'}
                            </div>
                        )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Tahmini aylık tutar</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669' }}>{formatCurrency(sub?.monthlyEstimate || 0)}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                            {sub?.machineCount} makine × {formatCurrency(sub?.effectivePricePerMachine || sub?.planDef?.pricePerMachine || 0)}
                            {sub?.volumeDiscountPct > 0 && <span style={{ color: '#059669', fontWeight: 700 }}> · −%{sub.volumeDiscountPct} hacim indirimi</span>}
                        </div>
                    </div>
                </div>

                {/* Kullanım çubuğu */}
                <div style={{ marginTop: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#64748b', marginBottom: '0.35rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Truck size={14} /> Makine kullanımı</span>
                        <span style={{ fontWeight: 700, color: usagePct >= 90 ? '#dc2626' : '#1e293b' }}>{sub?.machineCount} / {sub?.machineLimit}</span>
                    </div>
                    <div style={{ height: 10, background: '#f1f5f9', borderRadius: 9999, overflow: 'hidden' }}>
                        <div style={{ width: `${usagePct}%`, height: '100%', background: usagePct >= 90 ? '#dc2626' : usagePct >= 70 ? '#d97706' : '#2563eb', transition: 'width .3s' }} />
                    </div>
                    {usagePct >= 90 && <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.4rem' }}>Limite yaklaştınız — yeni makine eklemek için planı yükseltin.</div>}
                </div>
            </div>

            {/* Faturalama dönemi — aylık/yıllık */}
            <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <div style={{ fontWeight: 700 }}>Faturalama Dönemi</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        Yıllık peşinde <b style={{ color: '#059669' }}>%15 indirim</b> — {sub?.machineCount} makine için yıllık <b>{formatCurrency(sub?.annualEstimate || 0)}</b> (≈ {formatCurrency(Math.round((sub?.annualEstimate || 0) / 12))}/ay)
                    </div>
                </div>
                <div style={{ display: 'inline-flex', background: '#f1f5f9', borderRadius: 9999, padding: 3 }}>
                    {['MONTHLY', 'YEARLY'].map(cy => (
                        <button key={cy} onClick={() => changeCycle(cy)} style={{ padding: '0.45rem 1.1rem', borderRadius: 9999, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', background: sub?.billingCycle === cy ? '#2563eb' : 'transparent', color: sub?.billingCycle === cy ? '#fff' : '#64748b' }}>
                            {cy === 'MONTHLY' ? 'Aylık' : 'Yıllık · %15↓'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Planlar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                {plans.map((p: any) => {
                    const current = p.key === sub?.plan
                    const isPro = p.key === 'PRO'
                    return (
                        <div key={p.key} className="card" style={{ padding: '1.5rem', border: isPro ? '2px solid #2563eb' : '1px solid #e2e8f0', position: 'relative' }}>
                            {isPro && <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: '#2563eb', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.7rem', borderRadius: 9999 }}>EN ÇOK SATILAN</div>}
                            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1e293b' }}>{p.name}</div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', minHeight: 34, marginTop: '0.25rem' }}>{p.tagline}</div>
                            <div style={{ margin: '0.75rem 0' }}>
                                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b' }}>{formatCurrency(p.pricePerMachine)}</span>
                                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}> / makine / ay</span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.75rem' }}>{p.machineLimit >= 100000 ? 'Sınırsız makine' : `${p.machineLimit} makineye kadar`}</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.25rem' }}>
                                {p.features.map((f: string) => (
                                    <div key={f} style={{ display: 'flex', gap: '0.4rem', fontSize: '0.8125rem', color: '#475569' }}>
                                        <Check size={15} color="#059669" style={{ flexShrink: 0, marginTop: 2 }} /> {f}
                                    </div>
                                ))}
                            </div>
                            <button
                                className={current ? 'btn btn-outline' : 'btn btn-primary'}
                                disabled={current || saving === p.key}
                                onClick={() => changePlan(p.key)}
                                style={{ width: '100%', justifyContent: 'center' }}
                            >
                                {current ? 'Mevcut Plan' : saving === p.key ? 'Geçiliyor...' : 'Bu Plana Geç'}
                            </button>
                        </div>
                    )
                })}
            </div>

            {/* Eklentiler — her pakete eklenebilir */}
            <div style={{ marginTop: '1.75rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.25rem' }}>Eklentiler</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.875rem' }}>Her pakete opsiyonel eklenebilir. Karmaşık modül menüsü yok — sadece ihtiyacın olan.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                    {ADD_ONS.map(a => (
                        <div key={a.key} className="card" style={{ padding: '1rem 1.1rem' }}>
                            <div style={{ fontSize: '1.25rem' }}>{a.icon}</div>
                            <div style={{ fontWeight: 700, marginTop: '0.25rem' }}>{a.name}</div>
                            <div style={{ margin: '0.2rem 0' }}>
                                <span style={{ fontWeight: 800, color: '#2563eb' }}>{a.price}</span>
                                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}> {a.unit}</span>
                            </div>
                            <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{a.desc}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pazar — abonelikten bağımsız işlem katmanı */}
            <div className="card" style={{ marginTop: '1.25rem', padding: '1.25rem', background: 'linear-gradient(135deg,#0f172a,#1e293b)', color: '#fff', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ flex: '1 1 320px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', fontWeight: 700, background: 'rgba(37,99,235,0.3)', padding: '0.2rem 0.6rem', borderRadius: 9999 }}><Store size={13} /> Abonelikten bağımsız</div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', marginTop: '0.5rem' }}>{MARKETPLACE_TERMS.headline}</div>
                    <div style={{ fontSize: '0.82rem', opacity: 0.85, marginTop: '0.25rem' }}>{MARKETPLACE_TERMS.note}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>%{MARKETPLACE_TERMS.commissionPct}</div>
                    <a href="/borsa" style={{ display: 'inline-block', marginTop: '0.5rem', background: '#fff', color: '#0f172a', padding: '0.4rem 0.9rem', borderRadius: 9999, fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none' }}>Borsayı Aç</a>
                </div>
            </div>

            <div style={{ marginTop: '1.25rem', fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <TrendingUp size={14} /> Yıllık peşin ödemede %12-15, 2 yıllık sözleşmede %20-25 indirim. Online tahsilat (iyzico/sanal POS) yakında. Tüm paketleri <a href="/fiyatlar" target="_blank" style={{ color: '#2563eb', fontWeight: 600 }}>satış sayfasında</a> gör.
            </div>
        </div>
    )
}
