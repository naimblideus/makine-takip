'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Copy, Send } from 'lucide-react'

const TYPES: Record<string, string> = { EKSAVATOR: 'Ekskavatör', KEPCE: 'Kepçe', VINC: 'Vinç', DOZER: 'Dozer', BEKO_LODER: 'Beko Loder', FORKLIFT: 'Forklift', GREYDER: 'Greyder', SILINDIR: 'Silindir', KAMYON: 'Kamyon', DIGER: 'Diğer' }

export default function TalepVerPage() {
    const [form, setForm] = useState({ requesterName: '', requesterPhone: '', city: '', machineType: 'EKSAVATOR', periodType: 'GUNLUK', quantity: '7', neededFrom: '', operatorNeeded: true, description: '', budget: '' })
    const [token, setToken] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [copied, setCopied] = useState(false)

    const submit = async (e: React.FormEvent) => {
        e.preventDefault(); setSubmitting(true); setError('')
        const res = await fetch('/api/talep/olustur', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        const j = await res.json()
        if (j.token) setToken(j.token); else setError(j.error || 'Gönderilemedi')
        setSubmitting(false)
    }

    const link = token ? `${typeof window !== 'undefined' ? window.location.origin : ''}/talep/${token}` : ''

    const wrap = (c: React.ReactNode) => <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'system-ui, sans-serif', padding: '1.5rem' }}>{c}</div>

    if (token) return wrap(
        <div style={{ maxWidth: 520, margin: '2rem auto', background: '#fff', borderRadius: '1rem', padding: '2rem', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
            <CheckCircle size={56} color="#10b981" />
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '1rem 0 0.5rem' }}>Talebiniz yayınlandı!</h1>
            <p style={{ color: '#64748b', marginBottom: '1.25rem' }}>Kiralama firmaları teklif vermeye başlayacak. Teklifleri bu linkten takip edip karşılaştırın:</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input readOnly value={link} style={{ flex: 1, padding: '0.625rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', fontSize: '0.8rem' }} onFocus={e => e.target.select()} />
                <button onClick={() => { navigator.clipboard?.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500) }} className="btn btn-outline"><Copy size={15} /> {copied ? 'Kopyalandı' : 'Kopyala'}</button>
            </div>
            <Link href={`/talep/${token}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Teklifleri Gör →</Link>
        </div>
    )

    return wrap(
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b' }}>İş Makinesi Talebi Ver</h1>
                <p style={{ color: '#64748b' }}>İhtiyacını yaz, <b>birden çok firmadan teklif al</b>, en uygununu seç. Ücretsiz.</p>
            </div>
            <form onSubmit={submit} style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.6rem', borderRadius: '0.5rem', fontSize: '0.82rem', marginBottom: '0.875rem' }}>{error}</div>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div><label className="form-label">Ad / Firma *</label><input className="form-input" value={form.requesterName} onChange={e => setForm({ ...form, requesterName: e.target.value })} required /></div>
                    <div><label className="form-label">Telefon</label><input className="form-input" value={form.requesterPhone} onChange={e => setForm({ ...form, requesterPhone: e.target.value })} placeholder="0532 ..." /></div>
                    <div><label className="form-label">Makine Tipi</label><select className="form-input" value={form.machineType} onChange={e => setForm({ ...form, machineType: e.target.value })}>{Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
                    <div><label className="form-label">Şehir / Şantiye</label><input className="form-input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Ankara, Çankaya" /></div>
                    <div><label className="form-label">Dönem</label><select className="form-input" value={form.periodType} onChange={e => setForm({ ...form, periodType: e.target.value })}><option value="SAATLIK">Saatlik</option><option value="GUNLUK">Günlük</option><option value="HAFTALIK">Haftalık</option><option value="AYLIK">Aylık</option></select></div>
                    <div><label className="form-label">Miktar (gün/saat...)</label><input type="number" className="form-input" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} /></div>
                    <div><label className="form-label">Ne zaman</label><input type="date" className="form-input" value={form.neededFrom} onChange={e => setForm({ ...form, neededFrom: e.target.value })} /></div>
                    <div><label className="form-label">Bütçe (₺, ops.)</label><input type="number" className="form-input" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} /></div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', margin: '0.75rem 0' }}>
                    <input type="checkbox" checked={form.operatorNeeded} onChange={e => setForm({ ...form, operatorNeeded: e.target.checked })} /> Operatör dahil olsun
                </label>
                <div><label className="form-label">Açıklama</label><textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="İş tanımı, ek istekler..." /></div>
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}><Send size={16} /> {submitting ? 'Yayınlanıyor...' : 'Talebi Yayınla — Teklif Al'}</button>
            </form>
        </div>
    )
}
