'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    Truck,
    Users,
    MapPin,
    HardHat,
    Calendar,
    Clock,
    Fuel,
    CreditCard,
    RotateCcw,
    XCircle,
} from 'lucide-react'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import {
    MACHINE_TYPE_LABELS,
    RENTAL_STATUS_LABELS,
    RENTAL_STATUS_COLORS,
    RENTAL_PERIOD_LABELS,
    FUEL_LEVEL_LABELS,
} from '@/lib/constants'

export default function KiralamaDetayPage() {
    const { id } = useParams()
    const router = useRouter()
    const [rental, setRental] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [showReturn, setShowReturn] = useState(false)
    const [returnHours, setReturnHours] = useState('')
    const [returnFuel, setReturnFuel] = useState('')
    const [returnNotes, setReturnNotes] = useState('')
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        fetch(`/api/kiralamalar/${id}`)
            .then((res) => res.json())
            .then(setRental)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [id])

    async function handleReturn() {
        if (!confirm('Bu kiralama iade edilecek. Makine müsait duruma geçecektir. Devam edilsin mi?')) return
        setProcessing(true)
        try {
            const res = await fetch(`/api/kiralamalar/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'return',
                    returnHours,
                    returnFuel,
                    notes: returnNotes,
                }),
            })
            if (res.ok) {
                router.push('/kiralamalar')
                router.refresh()
            }
        } catch (err) {
            console.error(err)
        }
        setProcessing(false)
    }

    async function handleCancel() {
        if (!confirm('Bu kiralama iptal edilecek. Emin misiniz?')) return
        setProcessing(true)
        try {
            const res = await fetch(`/api/kiralamalar/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'cancel' }),
            })
            if (res.ok) {
                router.push('/kiralamalar')
                router.refresh()
            }
        } catch (err) {
            console.error(err)
        }
        setProcessing(false)
    }

    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}><div className="spinner" /></div>
    if (!rental) return <div className="alert alert-danger">Kiralama bulunamadı</div>

    const statusColor = RENTAL_STATUS_COLORS[rental.status as keyof typeof RENTAL_STATUS_COLORS]
    const days = Math.ceil((new Date(rental.endDate || Date.now()).getTime() - new Date(rental.startDate).getTime()) / 86400000)
    const isActive = rental.status === 'AKTIF'

    return (
        <div>
            {/* Başlık */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Link href="/kiralamalar" className="btn btn-ghost btn-icon btn-sm"><ArrowLeft size={18} /></Link>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <h1 className="page-title">{rental.machine.brand} {rental.machine.model}</h1>
                            <span className={cn('badge', statusColor?.bg, statusColor?.text)}>
                                <span className={cn('badge-dot', statusColor?.dot)} />
                                {RENTAL_STATUS_LABELS[rental.status as keyof typeof RENTAL_STATUS_LABELS]}
                            </span>
                        </div>
                        <p className="page-subtitle">{rental.machine.plate} · {rental.customer.companyName}</p>
                    </div>
                </div>
                {isActive && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => setShowReturn(!showReturn)} className="btn btn-primary btn-sm">
                            <RotateCcw size={16} />
                            İade Al
                        </button>
                        <button onClick={handleCancel} className="btn btn-outline btn-sm" style={{ color: '#dc2626' }} disabled={processing}>
                            <XCircle size={16} />
                            İptal
                        </button>
                    </div>
                )}
            </div>

            {/* İade Formu */}
            {showReturn && (
                <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem', border: '2px solid #2563eb' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: '#2563eb' }}>🔄 Makine İade</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label className="label">İade Saat Sayacı</label>
                            <input type="number" className="input" value={returnHours} onChange={(e) => setReturnHours(e.target.value)} placeholder={`Teslim: ${rental.deliveryHours || '?'}`} />
                        </div>
                        <div>
                            <label className="label">İade Yakıt Durumu</label>
                            <select className="input select" value={returnFuel} onChange={(e) => setReturnFuel(e.target.value)}>
                                <option value="">Seçin...</option>
                                <option value="TAM">Tam</option>
                                <option value="DORTTEUC">3/4</option>
                                <option value="YARI">Yarı</option>
                                <option value="DORTTEBIR">1/4</option>
                                <option value="BOS">Boş</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="label">İade Notu</label>
                        <textarea className="input" rows={2} value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} placeholder="Hasar, eksik vb." style={{ resize: 'vertical' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={handleReturn} className="btn btn-primary" disabled={processing}>
                            {processing ? 'İşleniyor...' : '✅ İadeyi Tamamla'}
                        </button>
                        <button onClick={() => setShowReturn(false)} className="btn btn-outline">İptal</button>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                {/* Kiralama Bilgileri */}
                <div className="card" style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem' }}>📋 Kiralama Bilgileri</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.8125rem' }}>
                        <InfoRow icon={<Calendar size={14} />} label="Başlangıç" value={formatDate(rental.startDate)} />
                        {rental.endDate && <InfoRow icon={<Calendar size={14} />} label="Bitiş" value={formatDate(rental.endDate)} />}
                        <InfoRow icon={<Clock size={14} />} label="Süre" value={`${days} gün`} />
                        <InfoRow icon={<CreditCard size={14} />} label="Birim Fiyat" value={`${formatCurrency(rental.unitPrice)} / ${RENTAL_PERIOD_LABELS[rental.periodType as keyof typeof RENTAL_PERIOD_LABELS]}`} />
                        {rental.deposit && <InfoRow icon={<CreditCard size={14} />} label="Depozito" value={formatCurrency(rental.deposit)} />}
                        <InfoRow icon={<HardHat size={14} />} label="Operatör Dahil" value={rental.operatorIncluded ? 'Evet' : 'Hayır'} />
                    </div>
                </div>

                {/* Müşteri & Şantiye */}
                <div className="card" style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem' }}>🏢 Müşteri & Konum</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.8125rem' }}>
                        <InfoRow icon={<Users size={14} />} label="Müşteri" value={rental.customer.companyName} />
                        {rental.customer.contactPerson && <InfoRow icon={<Users size={14} />} label="Yetkili" value={rental.customer.contactPerson} />}
                        {rental.customer.phone && <InfoRow icon={<Users size={14} />} label="Telefon" value={rental.customer.phone} />}
                        {rental.site && <InfoRow icon={<MapPin size={14} />} label="Şantiye" value={rental.site.name} />}
                        {rental.operator && <InfoRow icon={<HardHat size={14} />} label="Operatör" value={rental.operator.name} />}
                    </div>
                </div>

                {/* Teslim Bilgileri */}
                <div className="card" style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem' }}>🚛 Teslim / İade</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: '#f0fdf4' }}>
                            <div style={{ fontSize: '0.6875rem', color: '#166534', fontWeight: 600, marginBottom: '0.375rem' }}>TESLİM</div>
                            {rental.deliveryHours && <div style={{ fontSize: '0.8125rem' }}>⏱ {rental.deliveryHours} saat</div>}
                            {rental.deliveryFuel && <div style={{ fontSize: '0.8125rem' }}>⛽ {FUEL_LEVEL_LABELS[rental.deliveryFuel as keyof typeof FUEL_LEVEL_LABELS] || rental.deliveryFuel}</div>}
                        </div>
                        <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: rental.returnHours ? '#eff6ff' : '#f8fafc' }}>
                            <div style={{ fontSize: '0.6875rem', color: rental.returnHours ? '#1e40af' : '#94a3b8', fontWeight: 600, marginBottom: '0.375rem' }}>İADE</div>
                            {rental.returnHours ? (
                                <>
                                    <div style={{ fontSize: '0.8125rem' }}>⏱ {rental.returnHours} saat</div>
                                    {rental.returnFuel && <div style={{ fontSize: '0.8125rem' }}>⛽ {FUEL_LEVEL_LABELS[rental.returnFuel as keyof typeof FUEL_LEVEL_LABELS] || rental.returnFuel}</div>}
                                </>
                            ) : (
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Henüz iade edilmedi</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Makine Bilgisi */}
                <div className="card" style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem' }}>🚜 Makine</h3>
                    <Link href={`/makineler/${rental.machine.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: '#f8fafc' }}>
                            <div style={{ fontSize: '1rem', fontWeight: 700 }}>{rental.machine.brand} {rental.machine.model}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                {MACHINE_TYPE_LABELS[rental.machine.type as keyof typeof MACHINE_TYPE_LABELS]}
                                {rental.machine.year && ` · ${rental.machine.year}`}
                                {' · '}{rental.machine.plate}
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Notlar */}
            {rental.notes && (
                <div className="card" style={{ padding: '1.25rem', marginTop: '1rem' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>📝 Notlar</h3>
                    <p style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{rental.notes}</p>
                </div>
            )}
        </div>
    )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>{icon}{label}</div>
            <div style={{ fontWeight: 600 }}>{value}</div>
        </div>
    )
}
