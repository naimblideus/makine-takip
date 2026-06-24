'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck, Landmark, Fuel, CheckCircle, X } from 'lucide-react'

const OFFERS = [
    { type: 'SIGORTA', icon: <ShieldCheck size={22} />, c: '#2563eb', title: 'Kasko + Hırsızlık Sigortası', desc: 'Tüm filonu tek poliçede sigortala. GPS takipli makinelere özel indirim. İş makinesi + hırsızlık teminatı.', cta: 'Sigorta Teklifi Al' },
    { type: 'LEASING', icon: <Landmark size={22} />, c: '#7c3aed', title: 'Leasing / Filo Finansmanı', desc: 'Yeni makine al, düşük peşin + uygun vade. Kullanım/doluluk verinle daha iyi koşul. Operasyonel kiralama seçeneği.', cta: 'Finansman Görüşmesi' },
    { type: 'YAKIT', icon: <Fuel size={22} />, c: '#d97706', title: 'Filo Yakıt Kartı', desc: 'Litre başı indirim, tek merkezi fatura, harcama kontrolü. Yakıt hırsızlığı takibinle entegre.', cta: 'Yakıt Kartı Başvurusu' },
]
const TYPE_LABEL: Record<string, string> = { SIGORTA: 'Sigorta', LEASING: 'Leasing', YAKIT: 'Yakıt Kartı' }
const STATUS_LABEL: Record<string, { t: string; c: string }> = { YENI: { t: 'Alındı', c: '#d97706' }, ILETILDI: { t: 'İletildi', c: '#2563eb' }, KAZANILDI: { t: 'Tamamlandı', c: '#059669' } }

export default function FinansPage() {
    const [leads, setLeads] = useState<any[]>([])
    const [modal, setModal] = useState<any>(null)
    const [form, setForm] = useState({ note: '', contact: '' })
    const [saving, setSaving] = useState(false)
    const [done, setDone] = useState(false)

    const load = () => fetch('/api/referral').then(r => r.json()).then(j => setLeads(j.leads || []))
    useEffect(() => { load() }, [])

    const submit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true)
        await fetch('/api/referral', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: modal?.type, ...form }) })
        setSaving(false); setDone(true); load()
        setTimeout(() => { setModal(null); setDone(false); setForm({ note: '', contact: '' }) }, 1600)
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Finans & Sigorta</h1>
                    <p className="page-subtitle">Filon için avantajlı sigorta, finansman ve yakıt çözümleri</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {OFFERS.map(o => (
                    <div key={o.type} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: o.c + '18', color: o.c, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.875rem' }}>{o.icon}</div>
                        <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{o.title}</div>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.5rem 0 1.25rem', flex: 1 }}>{o.desc}</p>
                        <button className="btn btn-primary" style={{ background: o.c, justifyContent: 'center' }} onClick={() => { setModal(o); setDone(false) }}>{o.cta}</button>
                    </div>
                ))}
            </div>

            {leads.length > 0 && (
                <div className="card">
                    <div className="card-header"><h2 className="card-title">Taleplerim</h2></div>
                    <div className="table-responsive">
                        <table className="table">
                            <thead><tr><th>Tür</th><th>Not</th><th>İletişim</th><th>Durum</th><th>Tarih</th></tr></thead>
                            <tbody>
                                {leads.map(l => {
                                    const st = STATUS_LABEL[l.status] || STATUS_LABEL.YENI
                                    return (
                                        <tr key={l.id}>
                                            <td style={{ fontWeight: 600 }}>{TYPE_LABEL[l.type] || l.type}</td>
                                            <td style={{ fontSize: '0.82rem', color: '#64748b' }}>{l.note || '—'}</td>
                                            <td style={{ fontSize: '0.82rem' }}>{l.contact || '—'}</td>
                                            <td><span style={{ fontWeight: 700, fontSize: '0.78rem', color: st.c }}>{st.t}</span></td>
                                            <td style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{new Date(l.createdAt).toLocaleDateString('tr-TR')}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {modal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
                    <div className="card" style={{ width: '100%', maxWidth: 440, padding: '1.5rem' }}>
                        {done ? (
                            <div style={{ textAlign: 'center', padding: '1.5rem' }}>
                                <CheckCircle size={48} color="#10b981" />
                                <h3 style={{ fontWeight: 700, marginTop: '0.75rem' }}>Talebiniz alındı!</h3>
                                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Uzman ekibimiz en kısa sürede size dönecek.</p>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h3 style={{ fontWeight: 700 }}>{modal.title}</h3>
                                    <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                                </div>
                                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div><label className="form-label">İletişim (telefon/e-posta)</label><input className="form-input" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} placeholder="Size nasıl ulaşalım?" /></div>
                                    <div><label className="form-label">Not (opsiyonel)</label><textarea className="form-input" rows={3} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="İhtiyacınızı kısaca yazın" /></div>
                                    <button type="submit" className="btn btn-primary" disabled={saving} style={{ justifyContent: 'center' }}>{saving ? 'Gönderiliyor...' : 'Talep Gönder'}</button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
