'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Construction, Store, ArrowRight } from 'lucide-react'
import { PACKAGES, ADD_ONS, MARKETPLACE_TERMS, YEARLY_DISCOUNT, VOLUME_TIERS, yearlyMonthly } from '@/lib/pricing'

const TL = (n: number) => '₺' + n.toLocaleString('tr-TR')

export default function FiyatlarPage() {
    const [yearly, setYearly] = useState(false)

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif', color: '#0f172a' }}>
            {/* Üst bar */}
            <header style={{ background: '#0f172a', color: '#fff' }}>
                <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0.9rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#fff' }}>
                        <span style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Construction size={18} color="#fff" /></span>
                        <span style={{ fontWeight: 800 }}>Makine Takip</span>
                    </Link>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <Link href="/pazar" style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>Kiralama Borsası</Link>
                        <Link href="/login" style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>Giriş</Link>
                        <Link href="/signup" style={{ background: '#2563eb', color: '#fff', padding: '0.45rem 1rem', borderRadius: 9999, fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none' }}>14 Gün Ücretsiz</Link>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e3a8a)', color: '#fff', padding: '3rem 1.5rem 2.25rem' }}>
                <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '2.1rem', fontWeight: 800, lineHeight: 1.2, margin: 0 }}>İş makineni kanıtla, parana sahip çık.</h1>
                    <p style={{ opacity: 0.85, marginTop: '0.75rem', fontSize: '1.02rem' }}>
                        GPS-doğrulamalı hakediş tek tartışmalı saatte kendini öder. Makine başına öde, filon büyüdükçe ölçekle. Kurulum yok, 14 gün ücretsiz.
                    </p>

                    {/* Aylık / Yıllık toggle */}
                    <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.1)', borderRadius: 9999, padding: 4, marginTop: '1.5rem' }}>
                        <button onClick={() => setYearly(false)} style={{ padding: '0.5rem 1.25rem', borderRadius: 9999, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', background: !yearly ? '#fff' : 'transparent', color: !yearly ? '#0f172a' : 'rgba(255,255,255,0.8)' }}>Aylık</button>
                        <button onClick={() => setYearly(true)} style={{ padding: '0.5rem 1.25rem', borderRadius: 9999, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', background: yearly ? '#fff' : 'transparent', color: yearly ? '#0f172a' : 'rgba(255,255,255,0.8)' }}>Yıllık · %{Math.round(YEARLY_DISCOUNT * 100)}↓</button>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 1.5rem' }}>
                {/* Paketler */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginTop: '-1.5rem' }}>
                    {PACKAGES.map(p => {
                        const monthly = yearly ? yearlyMonthly(p.pricePerMachine) : p.pricePerMachine
                        const rec = p.recommended
                        return (
                            <div key={p.key} style={{ background: '#fff', borderRadius: '1rem', padding: '1.75rem 1.5rem', border: rec ? '2px solid #2563eb' : '1px solid #e2e8f0', boxShadow: rec ? '0 20px 40px rgba(37,99,235,0.18)' : '0 2px 10px rgba(0,0,0,0.05)', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                                {rec && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#2563eb', color: '#fff', fontSize: '0.68rem', fontWeight: 800, padding: '0.25rem 0.85rem', borderRadius: 9999, letterSpacing: '0.03em' }}>EN ÇOK SATILAN</div>}
                                <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>{p.name}</div>
                                <div style={{ fontSize: '0.82rem', color: '#64748b', minHeight: 40, marginTop: '0.35rem' }}>{p.tagline}</div>
                                <div style={{ margin: '1rem 0 0.25rem' }}>
                                    <span style={{ fontSize: '2.2rem', fontWeight: 800 }}>{TL(monthly)}</span>
                                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}> / makine / ay</span>
                                </div>
                                <div style={{ fontSize: '0.72rem', color: yearly ? '#059669' : '#94a3b8', marginBottom: '0.5rem', fontWeight: yearly ? 700 : 400 }}>
                                    {yearly ? `Yıllık peşin · normal ${TL(p.pricePerMachine)} yerine` : 'Yıllıkta %15 indirim'}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '1rem' }}>{p.machineLimit >= 100000 ? 'Sınırsız makine' : `${p.machineLimit} makineye kadar`}</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', flex: 1 }}>
                                    {p.features.map(f => (
                                        <div key={f} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.83rem', color: '#475569' }}>
                                            <Check size={16} color="#059669" style={{ flexShrink: 0, marginTop: 1 }} /> <span>{f}</span>
                                        </div>
                                    ))}
                                </div>
                                <Link href="/signup" style={{ display: 'block', textAlign: 'center', padding: '0.7rem', borderRadius: '0.6rem', fontWeight: 700, textDecoration: 'none', background: rec ? '#2563eb' : '#fff', color: rec ? '#fff' : '#2563eb', border: rec ? 'none' : '1.5px solid #2563eb' }}>
                                    14 Gün Ücretsiz Dene
                                </Link>
                            </div>
                        )
                    })}
                </div>

                {/* Hacim indirimi */}
                <div style={{ marginTop: '1.5rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.875rem', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.92rem' }}>📉 Hacim indirimi</span>
                    {VOLUME_TIERS.map(t => (
                        <span key={t.label} style={{ fontSize: '0.84rem', color: '#475569' }}>
                            <b>{t.label}</b> → {t.discount === 0 ? 'taban fiyat' : <span style={{ color: '#059669', fontWeight: 700 }}>%{Math.round(t.discount * 100)} indirim</span>}
                        </span>
                    ))}
                    <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>· otomatik uygulanır — filon büyüdükçe makine başı düşer</span>
                </div>

                <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8', marginTop: '1rem' }}>
                    Tüm fiyatlar KDV hariç. Kredi kartı gerektirmez · İstediğin zaman iptal · 2 yıllık sözleşmede %20-25 indirim.
                </p>

                {/* Eklentiler */}
                <div style={{ marginTop: '3rem' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, textAlign: 'center' }}>Her pakete eklenebilir</h2>
                    <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.9rem', marginTop: '0.35rem' }}>İhtiyacın olan birkaç eklenti — fazlası değil. Karmaşık modül menüsü yok.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
                        {ADD_ONS.map(a => (
                            <div key={a.key} style={{ background: '#fff', borderRadius: '0.875rem', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '1.4rem' }}>{a.icon}</div>
                                <div style={{ fontWeight: 700, marginTop: '0.4rem' }}>{a.name}</div>
                                <div style={{ margin: '0.35rem 0' }}>
                                    <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#2563eb' }}>{a.price}</span>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}> {a.unit}</span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{a.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pazar — ayrı işlem katmanı */}
                <div style={{ marginTop: '3rem', background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: '1.25rem', padding: '2rem', color: '#fff', display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ flex: '1 1 380px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(37,99,235,0.25)', padding: '0.3rem 0.75rem', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 700 }}>
                            <Store size={14} /> Abonelikten bağımsız · komisyonlu
                        </div>
                        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0.75rem 0 0.5rem' }}>{MARKETPLACE_TERMS.headline}</h2>
                        <p style={{ opacity: 0.85, fontSize: '0.92rem', margin: 0 }}>{MARKETPLACE_TERMS.note}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '1rem' }}>
                            {MARKETPLACE_TERMS.points.map(pt => (
                                <div key={pt} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem', opacity: 0.92 }}>
                                    <Check size={16} color="#34d399" style={{ flexShrink: 0, marginTop: 1 }} /> <span>{pt}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1 }}>%{MARKETPLACE_TERMS.commissionPct}</div>
                        <div style={{ opacity: 0.7, fontSize: '0.8rem', marginBottom: '1rem' }}>sadece tamamlanan kiralamadan</div>
                        <Link href="/pazar" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', color: '#0f172a', padding: '0.6rem 1.25rem', borderRadius: 9999, fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}>
                            Borsaya Göz At <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>

                {/* Kapanış CTA */}
                <div style={{ textAlign: 'center', padding: '3rem 1rem 3.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>İlk GPS-doğrulamalı hakedişini 3 dakikada gör</h2>
                    <p style={{ color: '#64748b', marginTop: '0.4rem' }}>Kredi kartı yok, kurulum yok. İstersen önce demoyu incele.</p>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                        <Link href="/signup" style={{ background: '#2563eb', color: '#fff', padding: '0.75rem 1.75rem', borderRadius: '0.6rem', fontWeight: 700, textDecoration: 'none' }}>14 Gün Ücretsiz Başla</Link>
                        <Link href="/login" style={{ background: '#fff', color: '#0f172a', padding: '0.75rem 1.75rem', borderRadius: '0.6rem', fontWeight: 700, textDecoration: 'none', border: '1px solid #e2e8f0' }}>Demoyu İncele</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
