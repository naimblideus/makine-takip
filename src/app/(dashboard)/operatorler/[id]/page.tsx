'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Phone, Clock, Calendar, HardHat } from 'lucide-react'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { MACHINE_TYPE_LABELS, RENTAL_STATUS_LABELS, RENTAL_STATUS_COLORS, TIMESHEET_TYPE_LABELS } from '@/lib/constants'

export default function OperatorDetayPage() {
    const { id } = useParams()
    const [op, setOp] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`/api/operatorler/${id}`)
            .then((res) => res.json())
            .then(setOp)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [id])

    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}><div className="spinner" /></div>
    if (!op) return <div className="alert alert-danger">Operatör bulunamadı</div>

    const activeRental = op.rentals?.find((r: any) => r.status === 'AKTIF')

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Link href="/operatorler" className="btn btn-ghost btn-icon btn-sm"><ArrowLeft size={18} /></Link>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <h1 className="page-title">{op.name}</h1>
                        {activeRental && <span className="badge bg-blue-50 text-blue-700">Görevde</span>}
                    </div>
                    <p className="page-subtitle">{op._count?.rentals || 0} kiralama · {op._count?.timesheets || 0} puantaj · {op.totalHoursWorked || 0} saat</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                {/* Kişisel Bilgiler */}
                <div className="card" style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem' }}>👤 Kişisel Bilgiler</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.8125rem' }}>
                        {op.tcNumber && <Row label="TC Kimlik" value={op.tcNumber} />}
                        {op.phone && <Row label="Telefon" value={op.phone} />}
                        {op.dailyWage && <Row label="Günlük Ücret" value={formatCurrency(op.dailyWage)} />}
                        {op.licenseClass && <Row label="Ehliyet Sınıfı" value={op.licenseClass} />}
                        {op.licenseExpiry && <Row label="Ehliyet Bitiş" value={formatDate(op.licenseExpiry)} />}
                    </div>
                </div>

                {/* Makine Tipleri */}
                <div className="card" style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem' }}>🚜 Kullanabildiği Makineler</h3>
                    {op.machineTypes?.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                            {op.machineTypes.map((t: string) => (
                                <span key={t} className="badge bg-blue-50 text-blue-700" style={{ fontSize: '0.6875rem' }}>
                                    {MACHINE_TYPE_LABELS[t as keyof typeof MACHINE_TYPE_LABELS] || t}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>Belirtilmedi</p>
                    )}
                </div>

                {/* İstatistikler */}
                <div className="card" style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem' }}>📊 İstatistikler</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', textAlign: 'center' }}>
                        <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: '#dbeafe' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb' }}>{op._count?.rentals || 0}</div>
                            <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>Kiralama</div>
                        </div>
                        <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: '#d1fae5' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a' }}>{op._count?.timesheets || 0}</div>
                            <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>Puantaj</div>
                        </div>
                        <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: '#fef3c7' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ca8a04' }}>{op.totalHoursWorked}</div>
                            <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>Saat</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Aktif Görev */}
            {activeRental && (
                <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem', borderLeft: '4px solid #2563eb' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.75rem' }}>🔵 Aktif Görev</h3>
                    <Link href={`/kiralamalar/${activeRental.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                            <div>
                                <div style={{ fontWeight: 600 }}>{activeRental.machine?.brand} {activeRental.machine?.model}</div>
                                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{activeRental.customer?.companyName} · {formatDate(activeRental.startDate)}'den beri</div>
                            </div>
                            <span className="badge bg-blue-50 text-blue-700" style={{ fontSize: '0.625rem' }}>Detay →</span>
                        </div>
                    </Link>
                </div>
            )}

            {/* Son Puantajlar */}
            <div className="card" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem' }}>📋 Son Puantaj Kayıtları</h3>
                {op.timesheets?.length === 0 ? (
                    <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>Puantaj kaydı yok</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Tarih</th>
                                    <th>Makine</th>
                                    <th>Saat</th>
                                    <th>Tip</th>
                                </tr>
                            </thead>
                            <tbody>
                                {op.timesheets?.slice(0, 10).map((t: any) => (
                                    <tr key={t.id}>
                                        <td>{formatDate(t.date)}</td>
                                        <td>{t.rental?.machine?.brand} {t.rental?.machine?.model}</td>
                                        <td style={{ fontWeight: 600 }}>{parseFloat(t.hoursWorked)}h</td>
                                        <td>
                                            <span className={`badge ${t.type === 'FAZLA_MESAI' ? 'bg-amber-50 text-amber-700' : t.type === 'RESMI_TATIL' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`} style={{ fontSize: '0.625rem' }}>
                                                {TIMESHEET_TYPE_LABELS[t.type as keyof typeof TIMESHEET_TYPE_LABELS]}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b' }}>{label}</span>
            <span style={{ fontWeight: 600 }}>{value}</span>
        </div>
    )
}
