'use client'

import { useEffect, useState } from 'react'
import { Inbox, MapPin, Clock, CheckCircle2, Send } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const TYPES: Record<string, string> = { EKSAVATOR: 'Ekskavatör', KEPCE: 'Kepçe', VINC: 'Vinç', DOZER: 'Dozer', BEKO_LODER: 'Beko Loder', FORKLIFT: 'Forklift', GREYDER: 'Greyder', SILINDIR: 'Silindir', KAMYON: 'Kamyon', DIGER: 'Diğer' }
const PERIOD: Record<string, string> = { SAATLIK: 'saat', GUNLUK: 'gün', HAFTALIK: 'hafta', AYLIK: 'ay' }

export default function TaleplerPage() {
    const [rfqs, setRfqs] = useState<any[]>([])
    const [machines, setMachines] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [bidFor, setBidFor] = useState<string>('')
    const [form, setForm] = useState({ machineId: '', unitPrice: '', operatorIncluded: false, note: '' })

    const load = async () => { const r = await fetch('/api/talepler'); const j = await r.json(); setRfqs(j.rfqs || []); setLoading(false) }
    useEffect(() => { load(); fetch('/api/makineler').then(r => r.json()).then(d => setMachines(Array.isArray(d) ? d : [])).catch(() => { }) }, [])

    const sendBid = async (rfqId: string) => {
        if (!form.unitPrice) return
        await fetch('/api/talepler', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rfqId, ...form }) })
        setBidFor(''); setForm({ machineId: '', unitPrice: '', operatorIncluded: false, note: '' }); load()
    }

    if (loading) return <div className="spinner" style={{ margin: '3rem auto' }} />

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 36, height: 36, borderRadius: 10, background: '#2563eb20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Inbox size={20} color="#2563eb" /></span>
                        Talepler (Pazar)
                    </h1>
                    <p className="page-subtitle">Şantiyelerden gelen makine talepleri — teklif ver, yeni iş kazan</p>
                </div>
            </div>

            {rfqs.length === 0 ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    <Inbox size={40} style={{ opacity: 0.4 }} /><div style={{ marginTop: '0.75rem' }}>Şu an açık talep yok. Makinen müsaitse borsada ilanda tut, talepler buraya düşer.</div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                    {rfqs.map(r => (
                        <div key={r.id} className="card" style={{ padding: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{TYPES[r.machineType] || r.machineType || 'İş makinesi'}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{r.quantity} {PERIOD[r.periodType]}{r.operatorNeeded ? ' · operatörlü' : ''}</div>
                                </div>
                                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '0.15rem 0.5rem', borderRadius: 9999 }}>{r.bidCount} teklif</span>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.78rem', color: '#94a3b8', margin: '0.5rem 0' }}>
                                {r.city && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><MapPin size={13} /> {r.city}</span>}
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Clock size={13} /> {new Date(r.createdAt).toLocaleDateString('tr-TR')}</span>
                                {r.budget && <span>Bütçe: {formatCurrency(Number(r.budget))}</span>}
                            </div>
                            {r.description && <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '0.5rem' }}>{r.description}</p>}

                            {r.myBid ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: r.myBid.status === 'KABUL' ? '#059669' : '#2563eb', fontSize: '0.82rem', fontWeight: 700, marginTop: '0.5rem' }}>
                                    <CheckCircle2 size={15} /> Teklifin: {formatCurrency(Number(r.myBid.unitPrice))} {r.myBid.status === 'KABUL' ? '· KAZANDIN 🎉' : r.myBid.status === 'RED' ? '· kabul edilmedi' : '· beklemede'}
                                    {r.myBid.status !== 'KABUL' && <button className="btn btn-sm btn-outline" style={{ marginLeft: 'auto' }} onClick={() => { setBidFor(r.id); setForm({ ...form, unitPrice: String(r.myBid.unitPrice) }) }}>Güncelle</button>}
                                </div>
                            ) : bidFor === r.id ? null : (
                                <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} onClick={() => setBidFor(r.id)}><Send size={14} /> Teklif Ver</button>
                            )}

                            {bidFor === r.id && (
                                <div style={{ marginTop: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <select className="form-input" value={form.machineId} onChange={e => setForm({ ...form, machineId: e.target.value })}>
                                        <option value="">Makine seç (ops.)</option>
                                        {machines.filter((m: any) => !r.machineType || m.type === r.machineType).map((m: any) => <option key={m.id} value={m.id}>{m.brand} {m.model} {m.plate ? `(${m.plate})` : ''}</option>)}
                                    </select>
                                    <input type="number" className="form-input" placeholder={`Birim fiyat (₺/${PERIOD[r.periodType]})`} value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })} />
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}><input type="checkbox" checked={form.operatorIncluded} onChange={e => setForm({ ...form, operatorIncluded: e.target.checked })} /> Operatör dahil</label>
                                    <input className="form-input" placeholder="Not (ops.)" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => setBidFor('')}>İptal</button>
                                        <button className="btn btn-primary btn-sm" style={{ flex: 2, justifyContent: 'center' }} onClick={() => sendBid(r.id)}>Teklifi Gönder</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
