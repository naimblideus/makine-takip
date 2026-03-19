'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Clock, Truck, Receipt } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const STATUS_LABELS: Record<string, string> = {
    TASLAK: 'Taslak', ONAY_BEKLIYOR: 'Onay Bekliyor', ONAYLANDI: 'Onaylandı',
    MUSTERI_ONAY_BEKLIYOR: 'Onayınızı Bekliyoruz', MUSTERI_ONAYLADI: 'Onayladınız',
    FATURALANDI: 'Faturalandı', REDDEDILDI: 'Reddedildi',
}

const MACHINE_TYPE_LABELS: Record<string, string> = {
    FORKLIFT: 'Forklift', EKSAVATOR: 'Ekskavatör', VINC: 'Vinç', DOZER: 'Dozer',
    KEPCE: 'Kepçe', GREYDER: 'Greyder', SILINDIR: 'Silindir', KAMYON: 'Kamyon',
    BEKO_LODER: 'Beko Loder', DIGER: 'Diğer',
}

export default function PortalPage({ params }: { params: { token: string } }) {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [done, setDone] = useState('')

    useEffect(() => {
        fetch(`/api/portal/${params.token}`)
            .then(r => r.json())
            .then(j => {
                if (j.error) setError(j.error)
                else setData(j)
            })
            .catch(() => setError('Sayfa yüklenemedi'))
            .finally(() => setLoading(false))
    }, [params.token])

    const handleAction = async (action: 'ONAYLA' | 'REDDET') => {
        setSubmitting(true)
        const res = await fetch(`/api/portal/${params.token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action }),
        })
        const j = await res.json()
        if (j.success) setDone(action === 'ONAYLA' ? 'approved' : 'rejected')
        setSubmitting(false)
    }

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: 40, height: 40, border: '3px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
                <div style={{ color: '#64748b' }}>Yükleniyor...</div>
            </div>
        </div>
    )

    if (error) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
            <div style={{ textAlign: 'center', maxWidth: 400, padding: '2rem' }}>
                <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
                <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Link Geçersiz</h1>
                <p style={{ color: '#64748b' }}>{error}</p>
            </div>
        </div>
    )

    if (done) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
            <div style={{ textAlign: 'center', maxWidth: 400, padding: '2rem' }}>
                {done === 'approved' ? <CheckCircle size={56} color="#10b981" style={{ marginBottom: '1rem' }} /> : <XCircle size={56} color="#ef4444" style={{ marginBottom: '1rem' }} />}
                <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    {done === 'approved' ? 'Hakediş Onaylandı!' : 'Hakediş Reddedildi'}
                </h1>
                <p style={{ color: '#64748b' }}>{done === 'approved' ? 'Teşekkürler. Fatura en kısa süre içinde iletilecektir.' : 'Firmayla iletişime geçilecektir.'}</p>
            </div>
        </div>
    )

    const { hakedis, activeRentals = [], pendingInvoices = [] } = data
    const machine = hakedis.rental?.machine
    const customer = hakedis.rental?.customer
    const canApprove = hakedis.status === 'MUSTERI_ONAY_BEKLIYOR'

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '1.5rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            <div style={{ maxWidth: 680, margin: '0 auto' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#1e293b', color: '#fff', padding: '0.5rem 1.25rem', borderRadius: '9999px', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 700 }}>
                        🏗 Makine Takip — Müşteri Portalı
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>Merhaba, {customer?.companyName}</h1>
                    <p style={{ color: '#64748b', marginTop: '0.25rem' }}>Hakediş detaylarınızı aşağıda inceleyebilirsiniz</p>
                </div>

                {/* Hakediş Kartı */}
                <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Hakediş — {hakedis.periodLabel}</h2>
                            <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                                {MACHINE_TYPE_LABELS[machine?.type] || machine?.type} — {machine?.brand} {machine?.model}
                                {machine?.plate && ` (${machine.plate})`}
                            </div>
                        </div>
                        <span style={{
                            padding: '0.3rem 0.8rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700,
                            background: canApprove ? '#ede9fe' : hakedis.status === 'MUSTERI_ONAYLADI' ? '#d1fae5' : '#f1f5f9',
                            color: canApprove ? '#7c3aed' : hakedis.status === 'MUSTERI_ONAYLADI' ? '#059669' : '#64748b',
                        }}>
                            {STATUS_LABELS[hakedis.status] || hakedis.status}
                        </span>
                    </div>

                    {/* Detaylar */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        {hakedis.totalHours > 0 && (
                            <div style={{ background: '#f8fafc', borderRadius: '0.5rem', padding: '0.75rem' }}>
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Çalışma Saati</div>
                                <div style={{ fontWeight: 700, fontSize: '1.25rem', color: '#1e293b' }}>{Number(hakedis.totalHours)}s</div>
                            </div>
                        )}
                        {hakedis.workingDays > 0 && (
                            <div style={{ background: '#f8fafc', borderRadius: '0.5rem', padding: '0.75rem' }}>
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Çalışma Günü</div>
                                <div style={{ fontWeight: 700, fontSize: '1.25rem', color: '#1e293b' }}>{hakedis.workingDays} gün</div>
                            </div>
                        )}
                        <div style={{ background: '#f8fafc', borderRadius: '0.5rem', padding: '0.75rem' }}>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Birim Fiyat</div>
                            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>{formatCurrency(Number(hakedis.unitPrice))}</div>
                        </div>
                    </div>

                    {/* Fiyat tablosu */}
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                        {[
                            { label: 'Ara Toplam', value: Number(hakedis.subtotal) },
                            hakedis.fuelCost ? { label: 'Yakıt', value: Number(hakedis.fuelCost) } : null,
                            hakedis.operatorCost ? { label: 'Operatör Ücreti', value: Number(hakedis.operatorCost) } : null,
                            hakedis.transportCost ? { label: 'Nakliye', value: Number(hakedis.transportCost) } : null,
                            hakedis.discount ? { label: 'İndirim', value: -Number(hakedis.discount) } : null,
                            { label: `KDV (%${Number(hakedis.taxRate)})`, value: Number(hakedis.taxAmount) },
                        ].filter(Boolean).map((row: any) => (
                            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.4rem', color: row.label === 'İndirim' ? '#10b981' : '#64748b' }}>
                                <span>{row.label}</span>
                                <span style={{ fontWeight: 500 }}>{row.value < 0 ? `- ${formatCurrency(-row.value)}` : formatCurrency(row.value)}</span>
                            </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', borderTop: '2px solid #1e293b', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                            <span>TOPLAM</span>
                            <span style={{ color: '#2563eb' }}>{formatCurrency(Number(hakedis.totalAmount))}</span>
                        </div>
                    </div>

                    {/* Onay butonları */}
                    {canApprove && (
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                            <button onClick={() => handleAction('REDDET')} disabled={submitting}
                                style={{ flex: 1, padding: '0.75rem', border: '2px solid #ef4444', background: '#fff', color: '#ef4444', borderRadius: '0.625rem', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '0.9375rem' }}>
                                ✗ Reddet
                            </button>
                            <button onClick={() => handleAction('ONAYLA')} disabled={submitting}
                                style={{ flex: 2, padding: '0.75rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '0.625rem', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '0.9375rem' }}>
                                {submitting ? 'İşleniyor...' : '✓ Hakedişi Onayla'}
                            </button>
                        </div>
                    )}
                    {hakedis.status === 'MUSTERI_ONAYLADI' && (
                        <div style={{ marginTop: '1rem', padding: '0.875rem', background: '#d1fae5', borderRadius: '0.625rem', color: '#065f46', fontWeight: 600, textAlign: 'center', fontSize: '0.9375rem' }}>
                            ✅ Bu hakedişi onayladınız. Teşekkürler!
                        </div>
                    )}
                </div>

                {/* Aktif Kiralamalar */}
                {activeRentals.length > 0 && (
                    <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.25rem', marginBottom: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Truck size={18} color="#2563eb" /> Aktif Kiralamaların
                        </h3>
                        {activeRentals.map((r: any) => (
                            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem', background: '#f8fafc', borderRadius: '0.5rem', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{r.machine?.brand} {r.machine?.model}</div>
                                    <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{r.site?.name || 'Şantiye belirtilmedi'}</div>
                                </div>
                                <span style={{ padding: '0.2rem 0.6rem', borderRadius: '9999px', background: '#dbeafe', color: '#2563eb', fontSize: '0.7rem', fontWeight: 600 }}>AKTİF</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Bekleyen Faturalar */}
                {pendingInvoices.length > 0 && (
                    <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Receipt size={18} color="#d97706" /> Bekleyen Ödemeler
                        </h3>
                        {pendingInvoices.map((inv: any) => (
                            <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem', background: '#fef3c7', borderRadius: '0.5rem', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{inv.invoiceNumber}</div>
                                    <div style={{ color: '#92400e', fontSize: '0.75rem' }}>Vade: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('tr-TR') : '—'}</div>
                                </div>
                                <div style={{ fontWeight: 700, color: '#d97706' }}>{formatCurrency(Number(inv.totalAmount))}</div>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                    Bu sayfa Makine Takip sistemi tarafından oluşturulmuştur.
                </div>
            </div>
        </div>
    )
}
