'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    Edit,
    Trash2,
    Clock,
    Calendar,
    Shield,
    FileText,
    AlertTriangle,
    Fuel,
    Wrench,
} from 'lucide-react'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import {
    MACHINE_TYPE_LABELS,
    MACHINE_STATUS_LABELS,
    MACHINE_STATUS_COLORS,
    RENTAL_STATUS_LABELS,
    RENTAL_PERIOD_LABELS,
    MAINTENANCE_TYPE_LABELS,
} from '@/lib/constants'

export default function MakineDetayPage() {
    const { id } = useParams()
    const router = useRouter()
    const [machine, setMachine] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        fetch(`/api/makineler/${id}`)
            .then((res) => res.json())
            .then(setMachine)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [id])

    async function handleDelete() {
        if (!confirm('Bu makineyi silmek istediğinize emin misiniz?')) return
        setDeleting(true)
        try {
            await fetch(`/api/makineler/${id}`, { method: 'DELETE' })
            router.push('/makineler')
        } catch (err) {
            console.error(err)
        }
        setDeleting(false)
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
                <div className="spinner" />
            </div>
        )
    }

    if (!machine) {
        return (
            <div className="alert alert-danger">Makine bulunamadı</div>
        )
    }

    const statusColor = MACHINE_STATUS_COLORS[machine.status as keyof typeof MACHINE_STATUS_COLORS]
    const now = new Date()
    const insuranceExpired = machine.insuranceExpiry && new Date(machine.insuranceExpiry) < now
    const inspectionExpired = machine.inspectionExpiry && new Date(machine.inspectionExpiry) < now

    return (
        <div>
            {/* Başlık */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Link href="/makineler" className="btn btn-ghost btn-icon btn-sm">
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <h1 className="page-title">{machine.brand} {machine.model}</h1>
                            <span className={cn('badge', statusColor?.bg, statusColor?.text)}>
                                <span className={cn('badge-dot', statusColor?.dot)} />
                                {MACHINE_STATUS_LABELS[machine.status as keyof typeof MACHINE_STATUS_LABELS]}
                            </span>
                        </div>
                        <p className="page-subtitle">
                            {MACHINE_TYPE_LABELS[machine.type as keyof typeof MACHINE_TYPE_LABELS]}
                            {machine.year && ` · ${machine.year}`}
                            {' · '}{machine.plate || machine.serialNumber}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link href={`/makineler/${id}/duzenle`} className="btn btn-outline btn-sm">
                        <Edit size={16} />
                        Düzenle
                    </Link>
                    <button onClick={handleDelete} className="btn btn-outline btn-sm" disabled={deleting} style={{ color: '#dc2626' }}>
                        <Trash2 size={16} />
                        Sil
                    </button>
                </div>
            </div>

            {/* Uyarılar */}
            {(insuranceExpired || inspectionExpired) && (
                <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {insuranceExpired && (
                        <div className="alert alert-danger">
                            <AlertTriangle size={16} />
                            <span><strong>Sigortası sona erdi!</strong> Son tarih: {formatDate(machine.insuranceExpiry)}</span>
                        </div>
                    )}
                    {inspectionExpired && (
                        <div className="alert alert-danger">
                            <AlertTriangle size={16} />
                            <span><strong>Muayenesi sona erdi!</strong> Son tarih: {formatDate(machine.inspectionExpiry)}</span>
                        </div>
                    )}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem' }}>
                {/* Sol: Bilgiler */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Fiyatlar */}
                    <div className="card" style={{ padding: '1.25rem' }}>
                        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem' }}>💰 Fiyatlar</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            {machine.hourlyRate && <PriceItem label="Saatlik" value={machine.hourlyRate} />}
                            {machine.dailyRate && <PriceItem label="Günlük" value={machine.dailyRate} />}
                            {machine.weeklyRate && <PriceItem label="Haftalık" value={machine.weeklyRate} />}
                            {machine.monthlyRate && <PriceItem label="Aylık" value={machine.monthlyRate} />}
                        </div>
                    </div>

                    {/* Belgeler */}
                    <div className="card" style={{ padding: '1.25rem' }}>
                        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem' }}>📄 Belgeler & Sayaç</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                            <InfoRow icon={<Clock size={14} />} label="Toplam Saat" value={`${parseFloat(machine.totalHours).toLocaleString('tr-TR')} saat`} />
                            <InfoRow
                                icon={<Shield size={14} />}
                                label="Sigorta Bitiş"
                                value={machine.insuranceExpiry ? formatDate(machine.insuranceExpiry) : 'Belirtilmemiş'}
                                danger={insuranceExpired}
                            />
                            <InfoRow
                                icon={<FileText size={14} />}
                                label="Muayene Bitiş"
                                value={machine.inspectionExpiry ? formatDate(machine.inspectionExpiry) : 'Belirtilmemiş'}
                                danger={inspectionExpired}
                            />
                        </div>
                    </div>

                    {/* Notlar */}
                    {machine.notes && (
                        <div className="card" style={{ padding: '1.25rem' }}>
                            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>📝 Notlar</h3>
                            <p style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.6 }}>{machine.notes}</p>
                        </div>
                    )}
                </div>

                {/* Sağ: Geçmiş */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Son Kiralamalar */}
                    <div className="card" style={{ padding: '1.25rem' }}>
                        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem' }}>📋 Kiralama Geçmişi</h3>
                        {machine.rentals.length === 0 ? (
                            <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>Henüz kiralama yok</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {machine.rentals.map((r: any) => (
                                    <Link
                                        key={r.id}
                                        href={`/kiralamalar/${r.id}`}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '0.625rem',
                                            borderRadius: '0.5rem',
                                            background: '#f8fafc',
                                            textDecoration: 'none',
                                            color: 'inherit',
                                            fontSize: '0.8125rem',
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{r.customer.companyName}</div>
                                            <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>
                                                {formatDate(r.startDate)}
                                                {r.site && ` · ${r.site.name}`}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 600 }}>{formatCurrency(r.unitPrice)}</div>
                                            <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>
                                                {RENTAL_PERIOD_LABELS[r.periodType as keyof typeof RENTAL_PERIOD_LABELS]}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Son Bakımlar */}
                    {machine.maintenances.length > 0 && (
                        <div className="card" style={{ padding: '1.25rem' }}>
                            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem' }}>🔧 Son Bakımlar</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {machine.maintenances.map((m: any) => (
                                    <div
                                        key={m.id}
                                        style={{
                                            padding: '0.625rem',
                                            borderRadius: '0.5rem',
                                            background: '#f8fafc',
                                            fontSize: '0.8125rem',
                                        }}
                                    >
                                        <div style={{ fontWeight: 600 }}>
                                            {MAINTENANCE_TYPE_LABELS[m.type as keyof typeof MAINTENANCE_TYPE_LABELS]}
                                        </div>
                                        <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: '0.125rem' }}>
                                            {formatDate(m.performedAt)}
                                            {m.cost && ` · ${formatCurrency(m.cost)}`}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Son Yakıt Girişleri */}
                    {machine.fuelEntries.length > 0 && (
                        <div className="card" style={{ padding: '1.25rem' }}>
                            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem' }}>⛽ Son Yakıt Girişleri</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {machine.fuelEntries.map((f: any) => (
                                    <div
                                        key={f.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '0.625rem',
                                            borderRadius: '0.5rem',
                                            background: '#f8fafc',
                                            fontSize: '0.8125rem',
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{parseFloat(f.liters)} Lt</div>
                                            <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>{formatDate(f.date)}</div>
                                        </div>
                                        <div style={{ fontWeight: 600 }}>{formatCurrency(f.cost)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function PriceItem({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ padding: '0.625rem', borderRadius: '0.5rem', background: '#f8fafc' }}>
            <div style={{ fontSize: '0.6875rem', color: '#94a3b8', fontWeight: 500 }}>{label}</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{formatCurrency(value)}</div>
        </div>
    )
}

function InfoRow({ icon, label, value, danger }: { icon: React.ReactNode; label: string; value: string; danger?: boolean }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
                {icon}
                {label}
            </div>
            <div style={{ fontWeight: 600, color: danger ? '#dc2626' : '#0f172a' }}>{value}</div>
        </div>
    )
}
