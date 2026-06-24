'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Plus, Clock, CheckCircle, AlertTriangle, TrendingUp, Send, Download, Activity, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    TASLAK: { label: 'Taslak', color: '#64748b', bg: '#f1f5f9' },
    ONAY_BEKLIYOR: { label: 'Onay Bekliyor', color: '#d97706', bg: '#fef3c7' },
    ONAYLANDI: { label: 'Onaylandı', color: '#2563eb', bg: '#dbeafe' },
    MUSTERI_ONAY_BEKLIYOR: { label: 'Müşteri Onayı Bekliyor', color: '#7c3aed', bg: '#ede9fe' },
    MUSTERI_ONAYLADI: { label: 'Müşteri Onayladı', color: '#059669', bg: '#d1fae5' },
    FATURALANDI: { label: 'Faturalındı', color: '#0369a1', bg: '#e0f2fe' },
    REDDEDILDI: { label: 'Reddedildi', color: '#dc2626', bg: '#fee2e2' },
}

const round1 = (n: number) => Math.round(n * 10) / 10

export default function HakedisPage() {
    const router = useRouter()
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [rentals, setRentals] = useState<any[]>([])
    const [telemetry, setTelemetry] = useState<any>(null)
    const [telemLoading, setTelemLoading] = useState(false)
    const [useTelem, setUseTelem] = useState(false)
    const [form, setForm] = useState({
        rentalId: '', periodStart: '', periodEnd: '', periodLabel: '',
        totalHours: '', workingDays: '', unitPrice: '', periodType: 'GUNLUK',
        fuelCost: '', operatorCost: '', transportCost: '', discount: '', taxRate: '20', notes: '',
    })

    const load = async () => {
        setLoading(true)
        const params = new URLSearchParams()
        if (statusFilter) params.set('status', statusFilter)
        const res = await fetch(`/api/hakedis?${params}`)
        const json = await res.json()
        setData(json)
        setLoading(false)
    }

    useEffect(() => { load() }, [statusFilter])

    useEffect(() => {
        fetch('/api/kiralamalar?status=AKTIF').then(r => r.json()).then(j => setRentals(j.rentals || []))
    }, [])

    // Kiralama seçilince birim fiyat/dönem tipini otomatik doldur
    useEffect(() => {
        const r = rentals.find((x: any) => x.id === form.rentalId)
        if (r) {
            setForm(f => ({
                ...f,
                unitPrice: f.unitPrice || String(r.unitPrice ?? ''),
                periodType: r.periodType || f.periodType,
            }))
        }
    }, [form.rentalId, rentals])

    // Telemetri önizleme — kiralama + dönem seçilince motor saatini çek
    useEffect(() => {
        if (!form.rentalId || !form.periodStart || !form.periodEnd) { setTelemetry(null); return }
        setTelemLoading(true)
        const p = new URLSearchParams({
            rentalId: form.rentalId, periodStart: form.periodStart, periodEnd: form.periodEnd,
            manualHours: form.totalHours || '0',
        })
        fetch(`/api/hakedis/telemetri?${p}`)
            .then(r => r.json())
            .then(j => setTelemetry(j))
            .catch(() => setTelemetry(null))
            .finally(() => setTelemLoading(false))
    }, [form.rentalId, form.periodStart, form.periodEnd])

    // Canlı delta hesabı (saat değiştikçe yeniden fetch'siz)
    const ignition = telemetry?.summary?.hasTelemetry ? Number(telemetry.summary.ignitionHours) : null
    const unitPrice = Number(form.unitPrice || telemetry?.unitPrice || 0)
    const manualHours = Number(form.totalHours || 0)
    const delta = ignition != null ? round1(manualHours - ignition) : null
    const deltaTL = delta != null ? delta * unitPrice : null

    const applyTelemetry = () => {
        if (ignition == null) return
        setUseTelem(true)
        setForm(f => ({ ...f, totalHours: String(ignition) }))
    }

    const resetModal = () => {
        setShowModal(false)
        setTelemetry(null)
        setUseTelem(false)
        setForm({
            rentalId: '', periodStart: '', periodEnd: '', periodLabel: '',
            totalHours: '', workingDays: '', unitPrice: '', periodType: 'GUNLUK',
            fuelCost: '', operatorCost: '', transportCost: '', discount: '', taxRate: '20', notes: '',
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const res = await fetch('/api/hakedis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...form, useTelemetryHours: useTelem }),
        })
        const json = await res.json().catch(() => null)
        resetModal()
        if (json?.hakedis?.id) router.push(`/hakedis/${json.hakedis.id}`)
        else load()
    }

    const handleStatusChange = async (id: string, status: string) => {
        await fetch(`/api/hakedis/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        })
        load()
    }

    if (loading) return <div className="spinner" style={{ margin: '3rem auto' }} />

    const { hakedisler = [], stats = {} } = data || {}

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Hakedişler</h1>
                    <p className="page-subtitle">GPS-doğrulamalı dönem fatura ve onay takibi</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={16} /> Yeni Hakediş
                </button>
            </div>

            {/* Özet Kartlar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                    { label: 'Taslak', value: stats.taslak || 0, color: '#64748b', bg: '#f1f5f9', icon: <FileText size={18} /> },
                    { label: 'Onay Bekliyor', value: stats.onayBekliyor || 0, color: '#d97706', bg: '#fef3c7', icon: <Clock size={18} /> },
                    { label: 'Onaylandı', value: stats.onaylandi || 0, color: '#059669', bg: '#d1fae5', icon: <CheckCircle size={18} /> },
                    { label: 'Faturalındı', value: stats.faturalandi || 0, color: '#2563eb', bg: '#dbeafe', icon: <TrendingUp size={18} /> },
                ].map(k => (
                    <div key={k.label} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="stat-card-icon" style={{ background: k.bg, color: k.color }}>{k.icon}</div>
                        <div>
                            <div className="stat-card-value" style={{ color: k.color }}>{k.value}</div>
                            <div className="stat-card-label">{k.label}</div>
                        </div>
                    </div>
                ))}
                <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="stat-card-icon" style={{ background: '#d1fae5', color: '#059669' }}><TrendingUp size={18} /></div>
                    <div>
                        <div className="stat-card-value" style={{ color: '#059669', fontSize: '1.1rem' }}>{formatCurrency(stats.toplamTutar || 0)}</div>
                        <div className="stat-card-label">Toplam Tutar</div>
                    </div>
                </div>
            </div>

            {/* Filtre */}
            <div className="card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['', ...Object.keys(STATUS_CONFIG)].map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                        style={{
                            padding: '0.25rem 0.75rem', borderRadius: '9999px', border: 'none', cursor: 'pointer',
                            fontSize: '0.8125rem', fontWeight: 500,
                            background: statusFilter === s ? '#2563eb' : '#f1f5f9',
                            color: statusFilter === s ? '#fff' : '#64748b',
                        }}>
                        {s ? STATUS_CONFIG[s].label : 'Tümü'}
                    </button>
                ))}
            </div>

            {/* Liste */}
            <div className="card">
                {hakedisler.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                        <FileText size={40} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
                        <div>Hakediş bulunamadı</div>
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Makine</th>
                                <th>Müşteri</th>
                                <th>Dönem</th>
                                <th>Saat / Gün</th>
                                <th>Tutar</th>
                                <th>Durum</th>
                                <th>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {hakedisler.map((h: any) => {
                                const st = STATUS_CONFIG[h.status] || STATUS_CONFIG.TASLAK
                                const gps = h.gpsReport
                                const dlt = gps && gps.hasTelemetry ? Number(gps.deltaHours) : null
                                return (
                                    <tr key={h.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/hakedis/${h.id}`)}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{h.rental?.machine?.brand} {h.rental?.machine?.model}</div>
                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{h.rental?.machine?.plate}</div>
                                        </td>
                                        <td style={{ fontSize: '0.8125rem' }}>{h.rental?.customer?.companyName}</td>
                                        <td style={{ fontSize: '0.75rem', color: '#64748b' }}>{h.periodLabel}</td>
                                        <td style={{ fontSize: '0.8125rem' }}>
                                            {Number(h.totalHours) > 0 && <div>{Number(h.totalHours)}s</div>}
                                            {h.workingDays > 0 && <div style={{ color: '#94a3b8' }}>{h.workingDays} gün</div>}
                                            {dlt != null && Math.abs(dlt) > 0.05 && (
                                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: dlt > 0 ? '#dc2626' : '#059669', display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Activity size={11} /> {dlt > 0 ? '+' : ''}{dlt}s fark
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ fontWeight: 700, color: '#059669' }}>{formatCurrency(Number(h.totalAmount))}</td>
                                        <td>
                                            <span style={{ padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600, background: st.bg, color: st.color }}>
                                                {st.label}
                                            </span>
                                        </td>
                                        <td onClick={e => e.stopPropagation()}>
                                            <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                                                <a className="btn btn-sm btn-outline" href={`/api/hakedis/${h.id}/pdf`} target="_blank" rel="noopener" title="PDF">
                                                    <Download size={13} />
                                                </a>
                                                {h.status === 'TASLAK' && (
                                                    <button className="btn btn-sm btn-outline" onClick={() => handleStatusChange(h.id, 'ONAY_BEKLIYOR')}>
                                                        Onaya Gönder
                                                    </button>
                                                )}
                                                {h.status === 'ONAY_BEKLIYOR' && (
                                                    <button className="btn btn-sm btn-primary" onClick={() => handleStatusChange(h.id, 'ONAYLANDI')}>
                                                        Onayla
                                                    </button>
                                                )}
                                                {h.status === 'ONAYLANDI' && (
                                                    <button className="btn btn-sm btn-outline" onClick={() => handleStatusChange(h.id, 'MUSTERI_ONAY_BEKLIYOR')}>
                                                        <Send size={13} /> Müşteriye Gönder
                                                    </button>
                                                )}
                                                <ChevronRight size={15} color="#cbd5e1" />
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
                    <div className="card" style={{ width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto', padding: '1.5rem' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Yeni Hakediş Oluştur</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                                <label className="form-label">Kiralama</label>
                                <select className="form-input" value={form.rentalId} onChange={e => setForm({ ...form, rentalId: e.target.value })} required>
                                    <option value="">Seçin...</option>
                                    {rentals.map((r: any) => (
                                        <option key={r.id} value={r.id}>{r.machine?.brand} {r.machine?.model} — {r.customer?.companyName}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label className="form-label">Dönem Başlangıç</label>
                                    <input type="date" className="form-input" value={form.periodStart} onChange={e => setForm({ ...form, periodStart: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="form-label">Dönem Bitiş</label>
                                    <input type="date" className="form-input" value={form.periodEnd} onChange={e => setForm({ ...form, periodEnd: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="form-label">Çalışma Saati (puantaj)</label>
                                    <input type="number" step="0.1" className="form-input" placeholder="0" value={form.totalHours} onChange={e => { setForm({ ...form, totalHours: e.target.value }); setUseTelem(false) }} />
                                </div>
                                <div>
                                    <label className="form-label">Çalışma Günü</label>
                                    <input type="number" className="form-input" placeholder="0" value={form.workingDays} onChange={e => setForm({ ...form, workingDays: e.target.value })} />
                                </div>
                                <div>
                                    <label className="form-label">Birim Fiyat (₺)</label>
                                    <input type="number" className="form-input" placeholder="0" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="form-label">Dönem Tipi</label>
                                    <select className="form-input" value={form.periodType} onChange={e => setForm({ ...form, periodType: e.target.value })}>
                                        <option value="SAATLIK">Saatlik</option>
                                        <option value="GUNLUK">Günlük</option>
                                        <option value="HAFTALIK">Haftalık</option>
                                        <option value="AYLIK">Aylık</option>
                                    </select>
                                </div>
                            </div>

                            {/* ─── TELEMETRİ DOĞRULAMA PANELİ (wedge) ─── */}
                            {form.rentalId && form.periodStart && form.periodEnd && (
                                <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.625rem', padding: '0.875rem', background: '#f8fafc' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.625rem' }}>
                                        <Activity size={15} color="#2563eb" /> Çalışma Saati Doğrulaması
                                    </div>
                                    {telemLoading ? (
                                        <div style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>Motor verisi yükleniyor...</div>
                                    ) : ignition == null ? (
                                        <div style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                                            Bu kiralamada seçilen dönemde GPS/motor oturumu bulunamadı. Saat beyana göre alınacak.
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.625rem' }}>
                                                <div style={{ background: '#fff', borderRadius: '0.5rem', padding: '0.55rem', textAlign: 'center' }}>
                                                    <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Beyan (puantaj)</div>
                                                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e293b' }}>{manualHours || 0}s</div>
                                                </div>
                                                <div style={{ background: '#ecfdf5', borderRadius: '0.5rem', padding: '0.55rem', textAlign: 'center' }}>
                                                    <div style={{ fontSize: '0.65rem', color: '#059669' }}>Motor saati ✓</div>
                                                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#059669' }}>{ignition}s</div>
                                                </div>
                                                <div style={{ background: delta && delta > 0.05 ? '#fef2f2' : '#fff', borderRadius: '0.5rem', padding: '0.55rem', textAlign: 'center' }}>
                                                    <div style={{ fontSize: '0.65rem', color: delta && delta > 0.05 ? '#dc2626' : '#94a3b8' }}>Fark</div>
                                                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: delta && delta > 0.05 ? '#dc2626' : '#64748b' }}>
                                                        {delta && delta > 0 ? '+' : ''}{delta ?? 0}s
                                                    </div>
                                                </div>
                                            </div>
                                            {delta != null && Math.abs(delta) > 0.05 && (
                                                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: deltaTL && deltaTL > 0 ? '#dc2626' : '#059669', marginBottom: '0.5rem' }}>
                                                    {deltaTL && deltaTL > 0
                                                        ? `⚠ Beyan, motor saatinden ${delta}s fazla — tutar etkisi ${formatCurrency(deltaTL)}`
                                                        : `Beyan, motor saatinin altında (${formatCurrency(Math.abs(deltaTL || 0))})`}
                                                </div>
                                            )}
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: '#1e293b', cursor: 'pointer' }}>
                                                <input type="checkbox" checked={useTelem} onChange={e => { e.target.checked ? applyTelemetry() : setUseTelem(false) }} />
                                                Motor çalışma saatini ({ignition}s) faturalamada kullan
                                            </label>
                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.4rem' }}>
                                                Motor saati = kontak (ignition) verisi, <b>doğrulanmış</b>. Boşta/yakıt değerleri <b style={{ color: '#d97706' }}>tahminidir</b>.
                                                {telemetry?.summary?.unauthorizedCount > 0 && <span style={{ color: '#dc2626' }}> · {telemetry.summary.unauthorizedCount} yetkisiz oturum</span>}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label className="form-label">Yakıt (₺)</label>
                                    <input type="number" className="form-input" placeholder="0" value={form.fuelCost} onChange={e => setForm({ ...form, fuelCost: e.target.value })} />
                                </div>
                                <div>
                                    <label className="form-label">Operatör Ücreti (₺)</label>
                                    <input type="number" className="form-input" placeholder="0" value={form.operatorCost} onChange={e => setForm({ ...form, operatorCost: e.target.value })} />
                                </div>
                                <div>
                                    <label className="form-label">Nakliye (₺)</label>
                                    <input type="number" className="form-input" placeholder="0" value={form.transportCost} onChange={e => setForm({ ...form, transportCost: e.target.value })} />
                                </div>
                                <div>
                                    <label className="form-label">İndirim (₺)</label>
                                    <input type="number" className="form-input" placeholder="0" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="form-label">Notlar</label>
                                <textarea className="form-input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                <button type="button" className="btn btn-outline" onClick={resetModal}>İptal</button>
                                <button type="submit" className="btn btn-primary">Oluştur</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
