'use client'

import { useEffect, useState, useMemo } from 'react'
import { FileText, Plus, Send, Download, MessageCircle, CheckCircle2, Trash2, TrendingUp, Clock, Repeat } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const STATUS: Record<string, { label: string; c: string; b: string }> = {
    TASLAK: { label: 'Taslak', c: '#64748b', b: '#f1f5f9' },
    GONDERILDI: { label: 'Gönderildi', c: '#2563eb', b: '#dbeafe' },
    GORUNTULENDI: { label: 'Görüntülendi', c: '#7c3aed', b: '#ede9fe' },
    KABUL: { label: 'Kabul Edildi', c: '#059669', b: '#d1fae5' },
    RED: { label: 'Reddedildi', c: '#dc2626', b: '#fee2e2' },
    SURESI_DOLDU: { label: 'Süresi Doldu', c: '#92400e', b: '#fef3c7' },
    KIRALAMAYA_DONDU: { label: 'Kiralamaya Döndü', c: '#0369a1', b: '#e0f2fe' },
}
const PERIOD: Record<string, string> = { SAATLIK: 'saat', GUNLUK: 'gün', HAFTALIK: 'hafta', AYLIK: 'ay' }
const MTYPE: Record<string, string> = { FORKLIFT: 'Forklift', EKSAVATOR: 'Ekskavatör', VINC: 'Vinç', DOZER: 'Dozer', KEPCE: 'Kepçe', GREYDER: 'Greyder', SILINDIR: 'Silindir', KAMYON: 'Kamyon', BEKO_LODER: 'Beko Loder', DIGER: 'Diğer' }

const emptyForm = { customerName: '', customerPhone: '', machineId: '', machineType: '', periodType: 'GUNLUK', unitPrice: '', quantity: '1', operatorIncluded: false, transportCost: '', discount: '', taxRate: '20', validUntil: '', notes: '' }

export default function TekliflerPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [machines, setMachines] = useState<any[]>([])
    const [customers, setCustomers] = useState<any[]>([])
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState(emptyForm)
    const [origin, setOrigin] = useState('')

    const load = async () => {
        const res = await fetch('/api/teklifler'); setData(await res.json()); setLoading(false)
    }
    useEffect(() => { load() }, [])
    useEffect(() => {
        setOrigin(window.location.origin)
        fetch('/api/makineler').then(r => r.json()).then(d => setMachines(Array.isArray(d) ? d : [])).catch(() => { })
        fetch('/api/musteriler').then(r => r.json()).then(d => setCustomers(Array.isArray(d) ? d : (d.customers || []))).catch(() => { })
    }, [])

    const totals = useMemo(() => {
        const up = Number(form.unitPrice || 0), q = Number(form.quantity || 1), tr = Number(form.transportCost || 0), d = Number(form.discount || 0), tax = Number(form.taxRate || 20)
        const sub = Math.round((up * q + tr - d) * 100) / 100
        const taxA = Math.round(sub * tax / 100 * 100) / 100
        return { sub, taxA, total: Math.round((sub + taxA) * 100) / 100 }
    }, [form])

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        const body: any = { ...form }
        const c = customers.find((x: any) => x.id === form.machineId) // not used
        const res = await fetch('/api/teklifler', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        if (res.ok) { setShowModal(false); setForm(emptyForm); load() }
    }

    const setStatus = async (id: string, status: string) => {
        await fetch(`/api/teklifler/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
        load()
    }
    const convert = async (id: string) => {
        if (!confirm('Bu teklifi aktif kiralamaya dönüştürmek istiyor musunuz?')) return
        const res = await fetch(`/api/teklifler/${id}/convert`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
        const j = await res.json()
        if (!res.ok) { alert(j.error || 'Dönüştürülemedi'); return }
        load()
    }
    const del = async (id: string) => { if (confirm('Teklif silinsin mi?')) { await fetch(`/api/teklifler/${id}`, { method: 'DELETE' }); load() } }

    const whatsapp = (q: any) => {
        const phone = (q.customerPhone || '').replace(/\D/g, '')
        const intl = phone.startsWith('0') ? `90${phone.slice(1)}` : phone
        const url = q.token ? `${origin}/teklif/${q.token}` : ''
        const msg = `Sayın ${q.customerName}, ${q.machineLabel || MTYPE[q.machineType] || 'iş makinesi'} için fiyat teklifimiz: ${formatCurrency(Number(q.totalAmount))}. Detay ve onay: ${url}`
        return `https://wa.me/${intl}?text=${encodeURIComponent(msg)}`
    }

    if (loading) return <div className="spinner" style={{ margin: '3rem auto' }} />
    const quotes = data?.quotes || []
    const stats = data?.stats || {}

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Teklifler</h1>
                    <p className="page-subtitle">Hızlı fiyat teklifi → kiralama dönüşümü</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Hızlı Teklif</button>
            </div>

            <div className="stat-grid" style={{ marginBottom: '1.25rem' }}>
                {[
                    { icon: <FileText size={18} />, c: '#2563eb', v: stats.toplam || 0, l: 'Toplam Teklif' },
                    { icon: <Clock size={18} />, c: '#7c3aed', v: stats.acik || 0, l: 'Açık (yanıt bekliyor)' },
                    { icon: <TrendingUp size={18} />, c: '#059669', v: formatCurrency(stats.acikTutar || 0), l: 'Açık Teklif Tutarı' },
                    { icon: <Repeat size={18} />, c: '#0369a1', v: `%${stats.donusumOrani || 0}`, l: 'Dönüşüm Oranı' },
                ].map((s, i) => (
                    <div className="stat-card" key={i}>
                        <div className="stat-card-icon" style={{ background: s.c + '20', color: s.c }}>{s.icon}</div>
                        <div className="stat-card-content">
                            <div className="stat-card-value" style={{ color: s.c, fontSize: typeof s.v === 'string' && s.v.includes('₺') ? '1.05rem' : undefined }}>{s.v}</div>
                            <div className="stat-card-label">{s.l}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card">
                {quotes.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                        <FileText size={40} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
                        <div>Henüz teklif yok. İlk teklifini 30 saniyede oluştur.</div>
                    </div>
                ) : (
                    <table className="table">
                        <thead><tr><th>Müşteri</th><th>Makine</th><th>Koşul</th><th>Tutar</th><th>Durum</th><th>İşlem</th></tr></thead>
                        <tbody>
                            {quotes.map((q: any) => {
                                const st = STATUS[q.status] || STATUS.TASLAK
                                return (
                                    <tr key={q.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{q.customer?.companyName || q.customerName}</div>
                                            {q.customerPhone && <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{q.customerPhone}</div>}
                                        </td>
                                        <td style={{ fontSize: '0.82rem' }}>{q.machineLabel || MTYPE[q.machineType] || '—'}</td>
                                        <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{q.quantity} {PERIOD[q.periodType]} × {formatCurrency(Number(q.unitPrice))}</td>
                                        <td style={{ fontWeight: 700, color: '#059669' }}>{formatCurrency(Number(q.totalAmount))}</td>
                                        <td><span style={{ padding: '0.2rem 0.6rem', borderRadius: 9999, fontSize: '0.7rem', fontWeight: 700, background: st.b, color: st.c }}>{st.label}</span></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                                <a className="btn btn-sm btn-outline" href={`/api/teklifler/${q.id}/pdf`} target="_blank" rel="noopener" title="PDF"><Download size={13} /></a>
                                                {q.status === 'TASLAK' && <button className="btn btn-sm btn-primary" onClick={() => setStatus(q.id, 'GONDERILDI')}><Send size={13} /> Gönder</button>}
                                                {q.token && ['GONDERILDI', 'GORUNTULENDI', 'KABUL'].includes(q.status) && (
                                                    <a className="btn btn-sm" style={{ background: '#25D366', color: '#fff' }} href={whatsapp(q)} target="_blank" rel="noopener"><MessageCircle size={13} /> WhatsApp</a>
                                                )}
                                                {['KABUL', 'GORUNTULENDI', 'GONDERILDI'].includes(q.status) && (
                                                    <button className="btn btn-sm btn-primary" onClick={() => convert(q.id)}><Repeat size={13} /> Kiralamaya Çevir</button>
                                                )}
                                                {q.status === 'KIRALAMAYA_DONDU' && q.rentalId && (
                                                    <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}><CheckCircle2 size={13} /> Kazanıldı</span>
                                                )}
                                                {q.status !== 'KIRALAMAYA_DONDU' && <button className="btn btn-sm btn-outline" onClick={() => del(q.id)} title="Sil"><Trash2 size={13} color="#dc2626" /></button>}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
                    <div className="card" style={{ width: '100%', maxWidth: 560, maxHeight: '92vh', overflow: 'auto', padding: '1.5rem' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Hızlı Teklif Oluştur</h2>
                        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label className="form-label">Müşteri Adı *</label>
                                    <input className="form-input" list="cust-list" value={form.customerName} onChange={e => {
                                        const match = customers.find((c: any) => c.companyName === e.target.value)
                                        setForm({ ...form, customerName: e.target.value, machineId: form.machineId, customerPhone: match?.phone || form.customerPhone, ...(match ? {} : {}) })
                                    }} required placeholder="Firma / kişi" />
                                    <datalist id="cust-list">{customers.map((c: any) => <option key={c.id} value={c.companyName} />)}</datalist>
                                </div>
                                <div><label className="form-label">Telefon</label><input className="form-input" value={form.customerPhone} onChange={e => setForm({ ...form, customerPhone: e.target.value })} placeholder="0532 ..." /></div>
                                <div>
                                    <label className="form-label">Makine</label>
                                    <select className="form-input" value={form.machineId} onChange={e => {
                                        const m = machines.find((x: any) => x.id === e.target.value)
                                        setForm({ ...form, machineId: e.target.value, machineType: m?.type || form.machineType, unitPrice: form.unitPrice || String(m?.dailyRate ?? '') })
                                    }}>
                                        <option value="">Seçin (opsiyonel)</option>
                                        {machines.map((m: any) => <option key={m.id} value={m.id}>{m.brand} {m.model} {m.plate ? `(${m.plate})` : ''}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Makine Tipi</label>
                                    <select className="form-input" value={form.machineType} onChange={e => setForm({ ...form, machineType: e.target.value })}>
                                        <option value="">—</option>
                                        {Object.entries(MTYPE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Dönem</label>
                                    <select className="form-input" value={form.periodType} onChange={e => setForm({ ...form, periodType: e.target.value })}>
                                        <option value="SAATLIK">Saatlik</option><option value="GUNLUK">Günlük</option><option value="HAFTALIK">Haftalık</option><option value="AYLIK">Aylık</option>
                                    </select>
                                </div>
                                <div><label className="form-label">Miktar ({PERIOD[form.periodType]})</label><input type="number" className="form-input" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} /></div>
                                <div><label className="form-label">Birim Fiyat (₺) *</label><input type="number" className="form-input" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })} required /></div>
                                <div><label className="form-label">Nakliye (₺)</label><input type="number" className="form-input" value={form.transportCost} onChange={e => setForm({ ...form, transportCost: e.target.value })} /></div>
                                <div><label className="form-label">İndirim (₺)</label><input type="number" className="form-input" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} /></div>
                                <div><label className="form-label">Geçerlilik</label><input type="date" className="form-input" value={form.validUntil} onChange={e => setForm({ ...form, validUntil: e.target.value })} /></div>
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}>
                                <input type="checkbox" checked={form.operatorIncluded} onChange={e => setForm({ ...form, operatorIncluded: e.target.checked })} /> Operatör dahil
                            </label>
                            <div><label className="form-label">Not</label><textarea className="form-input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>

                            <div style={{ background: '#f8fafc', borderRadius: '0.5rem', padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Ara: {formatCurrency(totals.sub)} · KDV: {formatCurrency(totals.taxA)}</span>
                                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#2563eb' }}>{formatCurrency(totals.total)}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-outline" onClick={() => { setShowModal(false); setForm(emptyForm) }}>İptal</button>
                                <button type="submit" className="btn btn-primary">Teklifi Oluştur</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
