'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    ArrowLeft, Activity, Download, Send, CheckCircle, FileSignature,
    Link2, Copy, MessageCircle, AlertTriangle, Fuel, ShieldCheck,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import SignaturePad from '@/components/SignaturePad'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    TASLAK: { label: 'Taslak', color: '#64748b', bg: '#f1f5f9' },
    ONAY_BEKLIYOR: { label: 'Onay Bekliyor', color: '#d97706', bg: '#fef3c7' },
    ONAYLANDI: { label: 'Onaylandı', color: '#2563eb', bg: '#dbeafe' },
    MUSTERI_ONAY_BEKLIYOR: { label: 'Müşteri Onayı Bekliyor', color: '#7c3aed', bg: '#ede9fe' },
    MUSTERI_ONAYLADI: { label: 'Müşteri Onayladı', color: '#059669', bg: '#d1fae5' },
    FATURALANDI: { label: 'Faturalındı', color: '#0369a1', bg: '#e0f2fe' },
    REDDEDILDI: { label: 'Reddedildi', color: '#dc2626', bg: '#fee2e2' },
}

const MACHINE_TYPE_LABELS: Record<string, string> = {
    FORKLIFT: 'Forklift', EKSAVATOR: 'Ekskavatör', VINC: 'Vinç', DOZER: 'Dozer',
    KEPCE: 'Kepçe', GREYDER: 'Greyder', SILINDIR: 'Silindir', KAMYON: 'Kamyon', BEKO_LODER: 'Beko Loder', DIGER: 'Diğer',
}

export default function HakedisDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const [h, setH] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [sig, setSig] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [origin, setOrigin] = useState('')

    const load = async () => {
        const res = await fetch(`/api/hakedis/${id}`)
        const json = await res.json()
        setH(json.hakedis)
        setLoading(false)
    }
    useEffect(() => { load() }, [id])
    useEffect(() => { setOrigin(window.location.origin) }, [])

    const patch = async (body: any) => {
        setSaving(true)
        await fetch(`/api/hakedis/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        await load()
        setSaving(false)
    }

    const saveSignature = async () => {
        if (!sig) return
        await patch({ operatorSignature: sig })
        setSig(null)
    }

    if (loading) return <div className="spinner" style={{ margin: '3rem auto' }} />
    if (!h) return <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>Hakediş bulunamadı</div>

    const st = STATUS_CONFIG[h.status] || STATUS_CONFIG.TASLAK
    const gps = h.gpsReport
    const machine = h.rental?.machine
    const customer = h.rental?.customer
    const portalUrl = h.customerToken ? `${origin}/portal/${h.customerToken}` : ''

    const manualH = gps?.manualHours != null ? Number(gps.manualHours) : Number(h.totalHours || 0)
    const ignitionH = gps?.ignitionHours != null ? Number(gps.ignitionHours) : null
    const deltaH = gps?.deltaHours != null ? Number(gps.deltaHours) : null
    const deltaTL = gps?.deltaTL != null ? Number(gps.deltaTL) : null

    const copyLink = () => {
        navigator.clipboard?.writeText(portalUrl)
        setCopied(true); setTimeout(() => setCopied(false), 1800)
    }
    const whatsappLink = () => {
        const phone = (customer?.phone || '').replace(/\D/g, '')
        const intl = phone.startsWith('0') ? `90${phone.slice(1)}` : phone
        const msg = `Sayın ${customer?.companyName}, ${h.periodLabel} dönemi hakedişiniz onayınıza sunulmuştur. İnceleyip onaylamak için: ${portalUrl}`
        return `https://wa.me/${intl}?text=${encodeURIComponent(msg)}`
    }

    const costRows = [
        { label: 'Ara Toplam', value: Number(h.subtotal || 0) },
        h.fuelCost ? { label: 'Yakıt', value: Number(h.fuelCost) } : null,
        h.operatorCost ? { label: 'Operatör Ücreti', value: Number(h.operatorCost) } : null,
        h.transportCost ? { label: 'Nakliye', value: Number(h.transportCost) } : null,
        h.discount ? { label: 'İndirim', value: -Number(h.discount) } : null,
        { label: `KDV (%${Number(h.taxRate || 20)})`, value: Number(h.taxAmount || 0) },
    ].filter(Boolean) as { label: string; value: number }[]

    return (
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <button onClick={() => router.push('/hakedis')} className="btn btn-sm btn-outline" style={{ marginBottom: '1rem' }}>
                <ArrowLeft size={14} /> Hakedişler
            </button>

            {/* Başlık */}
            <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>Hakediş — {h.periodLabel}</h1>
                        <div style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                            {MACHINE_TYPE_LABELS[machine?.type] || machine?.type} · {machine?.brand} {machine?.model} {machine?.plate ? `(${machine.plate})` : ''} · {customer?.companyName}
                        </div>
                    </div>
                    <span style={{ padding: '0.3rem 0.8rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, background: st.bg, color: st.color }}>{st.label}</span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                    <a className="btn btn-sm btn-outline" href={`/api/hakedis/${id}/pdf`} target="_blank" rel="noopener"><Download size={14} /> Hakediş PDF</a>
                    <a className="btn btn-sm" style={{ background: '#7c3aed', color: '#fff' }} href={`/api/hakedis/${id}/kanit-paketi`} target="_blank" rel="noopener" title="GPS rota + motor oturumları + olaylar + imza — müşteri itiraz edemez"><ShieldCheck size={14} /> İtirazsız Delil Paketi</a>
                    {h.rentalId && <a className="btn btn-sm btn-outline" href={`/api/kiralamalar/${h.rentalId}/sozlesme-pdf`} target="_blank" rel="noopener"><Download size={14} /> Sözleşme PDF</a>}
                    {h.status === 'TASLAK' && <button className="btn btn-sm btn-primary" disabled={saving} onClick={() => patch({ status: 'ONAY_BEKLIYOR' })}>Onaya Gönder</button>}
                    {h.status === 'ONAY_BEKLIYOR' && <button className="btn btn-sm btn-primary" disabled={saving} onClick={() => patch({ status: 'ONAYLANDI' })}><CheckCircle size={14} /> Onayla</button>}
                    {h.status === 'ONAYLANDI' && <button className="btn btn-sm btn-primary" disabled={saving} onClick={() => patch({ status: 'MUSTERI_ONAY_BEKLIYOR' })}><Send size={14} /> Müşteriye Gönder</button>}
                </div>
            </div>

            {/* ─── TELEMETRİ DOĞRULAMA ─── */}
            <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.875rem' }}>
                    <Activity size={17} color="#2563eb" /> Çalışma Saati Doğrulaması
                </div>
                {ignitionH == null ? (
                    <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Bu hakediş için GPS/motor telemetrisi yok — saat beyana göre alınmıştır.</div>
                ) : (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.625rem' }}>
                            <div style={{ background: '#f8fafc', borderRadius: '0.625rem', padding: '0.75rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Beyan (puantaj)</div>
                                <div style={{ fontWeight: 800, fontSize: '1.4rem', color: '#1e293b' }}>{manualH}s</div>
                            </div>
                            <div style={{ background: '#ecfdf5', borderRadius: '0.625rem', padding: '0.75rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.7rem', color: '#059669' }}>Motor saati · doğrulanmış ✓</div>
                                <div style={{ fontWeight: 800, fontSize: '1.4rem', color: '#059669' }}>{ignitionH}s</div>
                            </div>
                            <div style={{ background: deltaH && deltaH > 0.05 ? '#fef2f2' : '#f8fafc', borderRadius: '0.625rem', padding: '0.75rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.7rem', color: deltaH && deltaH > 0.05 ? '#dc2626' : '#94a3b8' }}>Fark</div>
                                <div style={{ fontWeight: 800, fontSize: '1.4rem', color: deltaH && deltaH > 0.05 ? '#dc2626' : '#64748b' }}>{deltaH && deltaH > 0 ? '+' : ''}{deltaH ?? 0}s</div>
                                {deltaTL != null && Math.abs(deltaTL) > 1 && (
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: deltaTL > 0 ? '#dc2626' : '#059669' }}>{formatCurrency(deltaTL)}</div>
                                )}
                            </div>
                        </div>
                        {deltaH != null && deltaH > 0.05 && (
                            <div style={{ marginTop: '0.75rem', padding: '0.625rem 0.875rem', background: '#fef2f2', borderRadius: '0.5rem', color: '#991b1b', fontSize: '0.8125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <AlertTriangle size={15} /> Beyan, GPS-doğrulanmış motor saatinden {deltaH}s fazla. Tutar etkisi: {formatCurrency(deltaTL || 0)}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginTop: '0.875rem', fontSize: '0.8125rem', color: '#64748b' }}>
                            {gps?.estimatedIdleHours != null && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <Fuel size={13} /> Boşta: <b>{gps.estimatedIdleHours}s</b> <span style={{ color: '#d97706', fontWeight: 600 }}>(tahmini)</span>
                                </span>
                            )}
                            {gps?.sessionCount != null && <span>Motor oturumu: <b>{gps.sessionCount}</b></span>}
                            {gps?.unauthorizedCount > 0 && <span style={{ color: '#dc2626', fontWeight: 600 }}>Yetkisiz: {gps.unauthorizedCount}</span>}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.625rem' }}>
                            Motor saati, telemetri cihazının kontak (ignition) sinyalinden ölçülmüştür ve doğrulanmış veridir. Boşta/yakıt değerleri tahmini analizdir.
                        </div>
                    </>
                )}
            </div>

            {/* ─── Tutar ─── */}
            <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
                <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem' }}>Tutar Özeti</div>
                {costRows.map(r => (
                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.4rem', color: r.label === 'İndirim' ? '#059669' : '#64748b' }}>
                        <span>{r.label}</span>
                        <span style={{ fontWeight: 500 }}>{r.value < 0 ? `− ${formatCurrency(-r.value)}` : formatCurrency(r.value)}</span>
                    </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, borderTop: '2px solid #1e293b', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                    <span>TOPLAM</span><span style={{ color: '#2563eb' }}>{formatCurrency(Number(h.totalAmount))}</span>
                </div>
            </div>

            {/* ─── Müşteri Onay Linki ─── */}
            {h.status === 'MUSTERI_ONAY_BEKLIYOR' && portalUrl && (
                <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem', border: '1px solid #ddd6fe', background: '#faf5ff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: '#6d28d9', marginBottom: '0.625rem' }}>
                        <Link2 size={16} /> Müşteri Onay Linki
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <input readOnly value={portalUrl} className="form-input" style={{ flex: 1, minWidth: 220, fontSize: '0.8125rem' }} onFocus={e => e.target.select()} />
                        <button className="btn btn-sm btn-outline" onClick={copyLink}><Copy size={14} /> {copied ? 'Kopyalandı' : 'Kopyala'}</button>
                        <a className="btn btn-sm btn-primary" href={whatsappLink()} target="_blank" rel="noopener" style={{ background: '#25D366', borderColor: '#25D366' }}><MessageCircle size={14} /> WhatsApp</a>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.5rem' }}>Müşteri bu linkten hakedişi görüp telefonundan imzalayarak onaylayabilir.</div>
                </div>
            )}

            {/* ─── İmzalar ─── */}
            <div className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.875rem' }}>
                    <FileSignature size={16} /> İmzalar
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                    <div>
                        {h.operatorSignature ? (
                            <div>
                                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem' }}>Operatör / Hazırlayan</div>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={h.operatorSignature} alt="imza" style={{ width: '100%', maxWidth: 220, height: 90, objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: '0.5rem', background: '#fff' }} />
                            </div>
                        ) : (
                            <>
                                <SignaturePad label="Operatör / Hazırlayan İmzası" onChange={setSig} height={120} />
                                <button className="btn btn-sm btn-primary" style={{ marginTop: '0.5rem' }} disabled={!sig || saving} onClick={saveSignature}>İmzayı Kaydet</button>
                            </>
                        )}
                    </div>
                    <div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem' }}>Müşteri Onayı</div>
                        {h.customerSignature ? (
                            <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={h.customerSignature} alt="müşteri imza" style={{ width: '100%', maxWidth: 220, height: 90, objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: '0.5rem', background: '#fff' }} />
                                <div style={{ fontSize: '0.7rem', color: '#059669', marginTop: '0.3rem' }}>✓ {h.customerApprovedAt ? formatDate(h.customerApprovedAt) : 'Onaylandı'}</div>
                            </>
                        ) : (
                            <div style={{ height: 120, border: '1px dashed #cbd5e1', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: '0.8125rem', textAlign: 'center', padding: '0 1rem' }}>
                                Müşteri portal üzerinden imzalayınca burada görünecek
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
