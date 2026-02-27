'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Phone, Mail, MapPin, FileText, Ban, Edit, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { RENTAL_STATUS_LABELS, RENTAL_STATUS_COLORS, INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from '@/lib/constants'

export default function MusteriDetayPage() {
    const { id } = useParams()
    const router = useRouter()
    const [customer, setCustomer] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`/api/musteriler/${id}`)
            .then((res) => res.json())
            .then(setCustomer)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [id])

    async function handleDelete() {
        if (!confirm('Bu müşteriyi silmek istediğinize emin misiniz?')) return
        try {
            await fetch(`/api/musteriler/${id}`, { method: 'DELETE' })
            router.push('/musteriler')
        } catch (err) {
            console.error(err)
        }
    }

    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}><div className="spinner" /></div>
    if (!customer) return <div className="alert alert-danger">Müşteri bulunamadı</div>

    return (
        <div>
            {/* Başlık */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Link href="/musteriler" className="btn btn-ghost btn-icon btn-sm"><ArrowLeft size={18} /></Link>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <h1 className="page-title">{customer.companyName}</h1>
                            {customer.isBlacklisted && (
                                <span className="badge bg-red-50 text-red-700"><Ban size={12} />Kara Liste</span>
                            )}
                        </div>
                        <p className="page-subtitle">{customer._count?.rentals || 0} kiralama · {customer._count?.sites || 0} şantiye · {customer._count?.invoices || 0} fatura</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link href={`/musteriler/${id}/duzenle`} className="btn btn-outline btn-sm">
                        <Edit size={16} />
                        Düzenle
                    </Link>
                    <button onClick={handleDelete} className="btn btn-outline btn-sm" style={{ color: '#dc2626' }}>
                        <Trash2 size={16} />
                        Sil
                    </button>
                </div>
            </div>

            {customer.isBlacklisted && customer.blacklistReason && (
                <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>⚠️ Kara liste sebebi: {customer.blacklistReason}</div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                {/* İletişim */}
                <div className="card" style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem' }}>📇 İletişim Bilgileri</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.8125rem' }}>
                        {customer.contactPerson && <Row icon={<span>👤</span>} label="Yetkili" value={customer.contactPerson} />}
                        {customer.phone && <Row icon={<Phone size={14} />} label="Telefon" value={customer.phone} />}
                        {customer.email && <Row icon={<Mail size={14} />} label="E-posta" value={customer.email} />}
                        {customer.address && <Row icon={<MapPin size={14} />} label="Adres" value={customer.address} />}
                        {customer.taxOffice && <Row icon={<FileText size={14} />} label="Vergi D." value={customer.taxOffice} />}
                        {customer.taxNumber && <Row icon={<FileText size={14} />} label="Vergi No" value={customer.taxNumber} />}
                    </div>
                </div>

                {/* Şantiyeler */}
                <div className="card" style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem' }}>🏗️ Şantiyeler</h3>
                    {customer.sites.length === 0 ? (
                        <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>Şantiye yok</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {customer.sites.map((s: any) => (
                                <div key={s.id} style={{ padding: '0.625rem', borderRadius: '0.5rem', background: '#f8fafc', fontSize: '0.8125rem' }}>
                                    <div style={{ fontWeight: 600 }}>{s.name}</div>
                                    {s.address && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{s.address}</div>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Son Kiralamalar */}
                <div className="card" style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem' }}>📋 Son Kiralamalar</h3>
                    {customer.rentals.length === 0 ? (
                        <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>Kiralama yok</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {customer.rentals.map((r: any) => {
                                const sc = RENTAL_STATUS_COLORS[r.status as keyof typeof RENTAL_STATUS_COLORS]
                                return (
                                    <Link key={r.id} href={`/kiralamalar/${r.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem', borderRadius: '0.5rem', background: '#f8fafc', textDecoration: 'none', color: 'inherit', fontSize: '0.8125rem' }}>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{r.machine.brand} {r.machine.model}</div>
                                            <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>{formatDate(r.startDate)}</div>
                                        </div>
                                        <span className={cn('badge', sc?.bg, sc?.text)} style={{ fontSize: '0.625rem' }}>
                                            {RENTAL_STATUS_LABELS[r.status as keyof typeof RENTAL_STATUS_LABELS]}
                                        </span>
                                    </Link>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Son Faturalar */}
                <div className="card" style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem' }}>🧾 Son Faturalar</h3>
                    {customer.invoices.length === 0 ? (
                        <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>Fatura yok</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {customer.invoices.map((inv: any) => {
                                const ic = INVOICE_STATUS_COLORS[inv.status as keyof typeof INVOICE_STATUS_COLORS]
                                return (
                                    <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem', borderRadius: '0.5rem', background: '#f8fafc', fontSize: '0.8125rem' }}>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{inv.invoiceNumber}</div>
                                            <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>{formatDate(inv.issueDate)}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 700 }}>{formatCurrency(inv.totalAmount)}</div>
                                            <span className={cn('badge', ic?.bg, ic?.text)} style={{ fontSize: '0.625rem' }}>
                                                {INVOICE_STATUS_LABELS[inv.status as keyof typeof INVOICE_STATUS_LABELS]}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {customer.notes && (
                <div className="card" style={{ padding: '1.25rem', marginTop: '1rem' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>📝 Notlar</h3>
                    <p style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.6 }}>{customer.notes}</p>
                </div>
            )}
        </div>
    )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>{icon}{label}</div>
            <div style={{ fontWeight: 600, textAlign: 'right' }}>{value}</div>
        </div>
    )
}
