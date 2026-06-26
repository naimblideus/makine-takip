'use client'

import { useEffect, useState } from 'react'
import { Store, Inbox, Truck, MessageCircle, ExternalLink, CheckCircle2, Star } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const MTYPE: Record<string, string> = { FORKLIFT: 'Forklift', EKSAVATOR: 'Ekskavatör', VINC: 'Vinç', DOZER: 'Dozer', KEPCE: 'Kepçe', GREYDER: 'Greyder', SILINDIR: 'Silindir', KAMYON: 'Kamyon', BEKO_LODER: 'Beko Loder', DIGER: 'Diğer' }
const LEAD_STATUS: Record<string, { t: string; c: string; b: string }> = {
    YENI: { t: 'Yeni', c: '#dc2626', b: '#fee2e2' }, ILETILDI: { t: 'İletildi', c: '#d97706', b: '#fef3c7' },
    TEKLIF_VERILDI: { t: 'Teklif Verildi', c: '#2563eb', b: '#dbeafe' }, KAPANDI: { t: 'Kapandı', c: '#059669', b: '#d1fae5' },
}

export default function BorsaPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [origin, setOrigin] = useState('')

    const load = async () => { const r = await fetch('/api/borsa'); setData(await r.json()); setLoading(false) }
    useEffect(() => { load(); setOrigin(window.location.origin) }, [])

    const toggle = async (m: any, listed: boolean) => {
        const city = listed && !m.marketplaceCity ? (prompt('Makinenin bulunduğu şehir/ilçe?') || '') : m.marketplaceCity
        await fetch('/api/borsa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ machineId: m.id, listed, city, note: m.marketplaceNote }) })
        load()
    }
    const toggleFeatured = async (m: any) => {
        if (!m.marketplaceFeatured && !confirm('Bu makineyi öne çıkar (sponsorlu) — borsada en üstte listelenir. Aylık reklam ücreti faturanıza yansır. Onaylıyor musunuz?')) return
        await fetch('/api/borsa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ machineId: m.id, featured: !m.marketplaceFeatured }) })
        load()
    }
    const setLeadStatus = async (leadId: string, status: string) => {
        await fetch('/api/borsa', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leadId, status }) })
        load()
    }

    if (loading) return <div className="spinner" style={{ margin: '3rem auto' }} />
    const { machines = [], leads = [], summary = {} } = data || {}
    const idleUnlisted = machines.filter((m: any) => !m.marketplaceListed && m.status === 'MUSAIT')

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 36, height: 36, borderRadius: 10, background: '#2563eb20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Store size={20} color="#2563eb" /></span>
                        Kiralama Borsası
                    </h1>
                    <p className="page-subtitle">Atıl makineni ilana çıkar, yeni müşterilerden talep al</p>
                </div>
                <a className="btn btn-outline" href="/pazar" target="_blank" rel="noopener"><ExternalLink size={15} /> Borsayı Gör</a>
            </div>

            <div className="stat-grid" style={{ marginBottom: '1.25rem' }}>
                {[
                    { icon: <Store size={18} />, c: '#2563eb', v: `${summary.listedCount || 0}/${summary.totalMachines || 0}`, l: 'İlanda makine' },
                    { icon: <Inbox size={18} />, c: '#dc2626', v: summary.openLeads || 0, l: 'Yeni talep' },
                    { icon: <Truck size={18} />, c: '#059669', v: summary.totalLeads || 0, l: 'Toplam talep' },
                ].map((s, i) => (
                    <div className="stat-card" key={i}>
                        <div className="stat-card-icon" style={{ background: s.c + '20', color: s.c }}>{s.icon}</div>
                        <div className="stat-card-content"><div className="stat-card-value" style={{ color: s.c }}>{s.v}</div><div className="stat-card-label">{s.l}</div></div>
                    </div>
                ))}
            </div>

            {/* Atıl makine önerisi */}
            {idleUnlisted.length > 0 && (
                <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem', border: '1px solid #bfdbfe', background: 'linear-gradient(180deg,#eff6ff,#fff)' }}>
                    <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '0.9rem' }}>💡 {idleUnlisted.length} müsait makinen ilanda değil — boşta para kaybediyorsun</div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.6rem' }}>
                        {idleUnlisted.slice(0, 6).map((m: any) => (
                            <button key={m.id} className="btn btn-sm btn-primary" onClick={() => toggle(m, true)}>{m.brand} {m.model} → İlana çıkar</button>
                        ))}
                    </div>
                </div>
            )}

            {/* Gelen talepler */}
            <div className="card" style={{ marginBottom: '1.25rem' }}>
                <div className="card-header"><h2 className="card-title"><Inbox size={17} /> Gelen Talepler</h2></div>
                {leads.length === 0 ? <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Henüz talep yok. Makinelerini ilana çıkar.</div> : (
                    <div className="table-responsive">
                        <table className="table">
                            <thead><tr><th>Talep Eden</th><th>Makine</th><th>Şehir</th><th>Mesaj</th><th>Durum</th><th>İşlem</th></tr></thead>
                            <tbody>
                                {leads.map((l: any) => {
                                    const st = LEAD_STATUS[l.status] || LEAD_STATUS.YENI
                                    const phone = (l.requesterPhone || '').replace(/\D/g, '')
                                    const intl = phone.startsWith('0') ? `90${phone.slice(1)}` : phone
                                    return (
                                        <tr key={l.id}>
                                            <td><div style={{ fontWeight: 600 }}>{l.requesterName}</div>{l.requesterPhone && <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{l.requesterPhone}</div>}</td>
                                            <td style={{ fontSize: '0.82rem' }}>{l.machineLabel}</td>
                                            <td style={{ fontSize: '0.82rem', color: '#64748b' }}>{l.requesterCity || '—'}</td>
                                            <td style={{ fontSize: '0.78rem', color: '#64748b', maxWidth: 200 }}>{l.message || '—'}</td>
                                            <td><span style={{ padding: '0.15rem 0.5rem', borderRadius: 9999, fontSize: '0.68rem', fontWeight: 700, background: st.b, color: st.c }}>{st.t}</span></td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                                                    {phone && <a href={`https://wa.me/${intl}`} target="_blank" rel="noopener" aria-label="WhatsApp ile iletişime geç" title="WhatsApp ile iletişime geç" style={{ color: '#25D366' }}><MessageCircle size={16} /></a>}
                                                    {l.status === 'YENI' && <button className="btn btn-sm btn-outline" onClick={() => setLeadStatus(l.id, 'ILETILDI')}>İletişime geçtim</button>}
                                                    {['ILETILDI', 'TEKLIF_VERILDI'].includes(l.status) && <button className="btn btn-sm btn-primary" onClick={() => setLeadStatus(l.id, 'KAPANDI')}><CheckCircle2 size={13} /> Kazandım</button>}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Makine ilan yönetimi */}
            <div className="card">
                <div className="card-header"><h2 className="card-title"><Truck size={17} /> Makinelerim ({summary.listedCount}/{summary.totalMachines} ilanda)</h2></div>
                <div className="table-responsive">
                    <table className="table">
                        <thead><tr><th>Makine</th><th>Tip</th><th>Durum</th><th>Günlük</th><th>Şehir</th><th>İlan</th><th>Öne Çıkar</th></tr></thead>
                        <tbody>
                            {machines.map((m: any) => (
                                <tr key={m.id}>
                                    <td><div style={{ fontWeight: 600 }}>{m.brand} {m.model}</div><div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{m.plate}</div></td>
                                    <td style={{ fontSize: '0.82rem' }}>{MTYPE[m.type] || m.type}</td>
                                    <td><span style={{ fontSize: '0.7rem', fontWeight: 600, color: m.status === 'MUSAIT' ? '#059669' : '#64748b' }}>{m.status === 'MUSAIT' ? 'Müsait' : m.status}</span></td>
                                    <td style={{ fontSize: '0.82rem' }}>{m.dailyRate ? formatCurrency(m.dailyRate) : '—'}</td>
                                    <td style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{m.marketplaceCity || '—'}</td>
                                    <td>
                                        <button className={m.marketplaceListed ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-outline'} onClick={() => toggle(m, !m.marketplaceListed)}>
                                            {m.marketplaceListed ? 'İlanda ✓' : 'İlana çıkar'}
                                        </button>
                                    </td>
                                    <td>
                                        {m.marketplaceListed ? (
                                            <button className="btn btn-sm" style={m.marketplaceFeatured ? { background: '#f59e0b', color: '#fff', borderColor: '#f59e0b' } : { background: '#fff', color: '#f59e0b', border: '1px solid #fcd34d' }} onClick={() => toggleFeatured(m)} title="Sponsorlu ilan — borsada en üstte">
                                                <Star size={13} fill={m.marketplaceFeatured ? '#fff' : 'none'} /> {m.marketplaceFeatured ? 'Sponsorlu' : 'Öne çıkar'}
                                            </button>
                                        ) : <span style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>—</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
