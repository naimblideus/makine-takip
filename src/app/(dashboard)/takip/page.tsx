'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import {
    Power, PowerOff, Gauge, Fuel, Radio, Clock, MapPin,
    ChevronDown, ChevronUp, AlertTriangle, Navigation,
} from 'lucide-react'
import { cn, formatRelativeDate } from '@/lib/utils'
import { MACHINE_TYPE_LABELS } from '@/lib/constants'

const MapView = dynamic(() => import('./MapView'), { ssr: false })

interface VehiclePosition {
    machineId: string
    plate: string | null
    brand: string
    model: string
    type: string
    status: string
    speedLimit: number | null
    fuelCapacity: number | null
    fuelSensorEnabled: boolean
    idleThresholdMinutes: number
    activeRental: {
        customer: string
        operator: string | null
        site: string | null
    } | null
    position: {
        lat: number
        lng: number
        speed: number
        course: number
        ignition: boolean
        fuel: number | null
        hours: number | null
        motion: boolean
        satellites: number
        signalStrength: number | null
        fixTime: string
        valid: boolean
    } | null
    online: boolean
}

export default function TakipPage() {
    const [vehicles, setVehicles] = useState<VehiclePosition[]>([])
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [detailOpen, setDetailOpen] = useState(false)
    const [speedLimitInput, setSpeedLimitInput] = useState('')
    const [sendingCommand, setSendingCommand] = useState(false)
    const [sessions, setSessions] = useState<any[]>([])
    const [detailTab, setDetailTab] = useState<'konum' | 'kontrol' | 'oturumlar' | 'yakit'>('konum')

    const fetchPositions = useCallback(async () => {
        try {
            const res = await fetch('/api/gps/positions')
            if (res.ok) {
                const data = await res.json()
                setVehicles(data)
            }
        } catch { /* polling hata durumu */ }
        setLoading(false)
    }, [])

    useEffect(() => {
        fetchPositions()
        const interval = setInterval(fetchPositions, 10000) // 10 saniye
        return () => clearInterval(interval)
    }, [fetchPositions])

    const selected = vehicles.find(v => v.machineId === selectedId)

    useEffect(() => {
        if (selected) {
            setDetailOpen(true)
            setSpeedLimitInput(String(selected.speedLimit || ''))
            // Oturumları yükle
            fetch(`/api/gps/sessions/${selected.machineId}`)
                .then(r => r.json())
                .then(d => setSessions(d.sessions || []))
                .catch(() => { })
        }
    }, [selectedId])

    const sendCommand = async (command: 'engineStop' | 'engineResume') => {
        if (!selected) return
        if (command === 'engineStop') {
            const ok = confirm(
                selected.position?.motion
                    ? '⚠️ Bu makine hareket halinde! Motoru durdurmak istediğinizden emin misiniz?'
                    : 'Bu makinenin motorunu durdurmak istediğinizden emin misiniz?'
            )
            if (!ok) return
        }
        setSendingCommand(true)
        try {
            await fetch('/api/gps/command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ machineId: selected.machineId, command }),
            })
            alert(command === 'engineStop' ? 'Motor durdurma komutu gönderildi' : 'Motor başlatma komutu gönderildi')
        } catch { alert('Komut gönderilemedi') }
        setSendingCommand(false)
    }

    const updateSpeedLimit = async () => {
        if (!selected) return
        await fetch('/api/gps/speedlimit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ machineId: selected.machineId, speedLimit: speedLimitInput }),
        })
        fetchPositions()
    }

    const onlineCount = vehicles.filter(v => v.online).length

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
            {/* Sol Panel — Makine Listesi */}
            <div style={{
                width: 320, minWidth: 320, background: 'white', borderRight: '1px solid var(--color-border)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
                    <h1 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: 4 }}>🗺️ Canlı Takip</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--color-muted)' }}>
                        <Radio size={12} style={{ color: 'var(--color-success)' }} />
                        {onlineCount}/{vehicles.length} çevrimiçi
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
                    {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 0' }}>
                            <div className="spinner" />
                        </div>
                    ) : vehicles.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon"><MapPin size={24} /></div>
                            <div className="empty-state-title">GPS aktif makine yok</div>
                            <div className="empty-state-text">GPS özelliğini açmak için makine düzenleme sayfasından ayarlayın</div>
                        </div>
                    ) : vehicles.map(v => (
                        <div
                            key={v.machineId}
                            onClick={() => setSelectedId(v.machineId)}
                            className={cn('card', selectedId === v.machineId && 'card-interactive')}
                            style={{
                                padding: '0.75rem',
                                marginBottom: '0.375rem',
                                cursor: 'pointer',
                                borderColor: selectedId === v.machineId ? 'var(--color-primary)' : undefined,
                                borderWidth: selectedId === v.machineId ? 2 : 1,
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{v.brand} {v.model}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{v.plate || MACHINE_TYPE_LABELS[v.type as keyof typeof MACHINE_TYPE_LABELS]}</div>
                                </div>
                                <div style={{
                                    padding: '2px 8px', borderRadius: 999, fontSize: '0.6875rem', fontWeight: 700,
                                    background: v.position?.ignition ? (v.position?.motion ? '#d1fae5' : '#fef3c7') : '#fee2e2',
                                    color: v.position?.ignition ? (v.position?.motion ? '#065f46' : '#92400e') : '#991b1b',
                                }}>
                                    {v.position?.ignition ? (v.position?.motion ? 'ÇALIŞIYOR' : 'RÖLANTI') : 'KAPALI'}
                                </div>
                            </div>

                            {v.position && (
                                <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                        <Gauge size={12} /> {v.position.speed} km/h
                                    </span>
                                    {v.position.fuel !== null && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                            <Fuel size={12} /> %{v.position.fuel}
                                        </span>
                                    )}
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                        <Clock size={12} /> {formatRelativeDate(v.position.fixTime)}
                                    </span>
                                </div>
                            )}

                            {!v.online && (
                                <div style={{ fontSize: '0.6875rem', color: 'var(--color-danger)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <AlertTriangle size={11} /> Sinyal yok
                                </div>
                            )}

                            {v.activeRental && (
                                <div style={{ fontSize: '0.6875rem', color: 'var(--color-primary)', marginTop: 4 }}>
                                    📋 {v.activeRental.customer} {v.activeRental.site ? `• ${v.activeRental.site}` : ''}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Sağ: Harita + Alt Detay Panel */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ flex: detailOpen && selected ? '1 1 60%' : '1 1 100%', minHeight: 300 }}>
                    <MapView
                        vehicles={vehicles}
                        selectedId={selectedId}
                        onSelect={(id: string) => setSelectedId(id)}
                    />
                </div>

                {/* Alt Detay Panel */}
                {selected && (
                    <div style={{
                        borderTop: '1px solid var(--color-border)', background: 'white',
                        maxHeight: detailOpen ? '40%' : 42, transition: 'max-height 0.3s ease',
                        overflow: 'hidden', display: 'flex', flexDirection: 'column',
                    }}>
                        {/* Panel başlık */}
                        <div
                            onClick={() => setDetailOpen(!detailOpen)}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '0.5rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--color-border)',
                                minHeight: 42, flexShrink: 0,
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                                    {selected.brand} {selected.model} — {selected.plate || ''}
                                </span>
                            </div>
                            {detailOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                        </div>

                        {/* Sekmeler */}
                        {detailOpen && (
                            <>
                                <div className="tab-nav" style={{ paddingLeft: '1rem', flexShrink: 0 }}>
                                    {(['konum', 'kontrol', 'oturumlar', 'yakit'] as const).map(tab => (
                                        <button key={tab} onClick={() => setDetailTab(tab)}
                                            className={cn('tab-item', detailTab === tab && 'tab-item-active')}>
                                            {tab === 'konum' ? '📍 Konum' :
                                                tab === 'kontrol' ? '⚡ Kontrol' :
                                                    tab === 'oturumlar' ? '📊 Oturumlar' : '⛽ Yakıt'}
                                        </button>
                                    ))}
                                </div>

                                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                                    {/* KONUM */}
                                    {detailTab === 'konum' && selected.position && (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                                            <InfoCard label="Hız" value={`${selected.position.speed} km/h`} />
                                            <InfoCard label="Motor" value={selected.position.ignition ? 'Açık' : 'Kapalı'} />
                                            <InfoCard label="Hareket" value={selected.position.motion ? 'Evet' : 'Hayır'} />
                                            <InfoCard label="Uydu" value={`${selected.position.satellites}`} />
                                            {selected.position.fuel !== null && (
                                                <InfoCard label="Yakıt" value={`%${selected.position.fuel}`} />
                                            )}
                                            <InfoCard label="Son Güncelleme" value={formatRelativeDate(selected.position.fixTime)} />
                                            <a href={`/takip/rota/${selected.machineId}`} className="btn btn-outline btn-sm" style={{ gridColumn: 'span 2' }}>
                                                <Navigation size={14} /> Günün Rotasını Gör
                                            </a>
                                        </div>
                                    )}

                                    {/* KONTROL */}
                                    {detailTab === 'kontrol' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button className="btn btn-danger" onClick={() => sendCommand('engineStop')} disabled={sendingCommand}>
                                                    <PowerOff size={16} /> Motor Durdur
                                                </button>
                                                <button className="btn btn-success" onClick={() => sendCommand('engineResume')} disabled={sendingCommand}>
                                                    <Power size={16} /> Motor Başlat
                                                </button>
                                            </div>
                                            <div>
                                                <label className="label">Hız Sınırı (km/h)</label>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <input type="number" className="input" value={speedLimitInput}
                                                        onChange={e => setSpeedLimitInput(e.target.value)}
                                                        placeholder="Ör: 40" style={{ maxWidth: 160 }} />
                                                    <button className="btn btn-primary btn-sm" onClick={updateSpeedLimit}>Kaydet</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* OTURUMLAR */}
                                    {detailTab === 'oturumlar' && (
                                        <div>
                                            {sessions.length === 0 ? (
                                                <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>Bugün oturum kaydı yok</p>
                                            ) : (
                                                <div className="table-wrapper">
                                                    <table>
                                                        <thead>
                                                            <tr>
                                                                <th>Başlangıç</th>
                                                                <th>Bitiş</th>
                                                                <th>Süre</th>
                                                                <th>Boşta</th>
                                                                <th>Maks Hız</th>
                                                                <th>Durum</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {sessions.slice(0, 10).map((s: any) => (
                                                                <tr key={s.id}>
                                                                    <td>{new Date(s.startedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</td>
                                                                    <td>{s.endedAt ? new Date(s.endedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : 'Devam ediyor'}</td>
                                                                    <td>{s.durationMinutes ? `${s.durationMinutes} dk` : '-'}</td>
                                                                    <td>{s.idleMinutes ? `${s.idleMinutes} dk` : '-'}</td>
                                                                    <td>{s.maxSpeed ? `${Math.round(s.maxSpeed)} km/h` : '-'}</td>
                                                                    <td>
                                                                        {!s.isAuthorized && (
                                                                            <span className="badge bg-red-50 text-red-700" style={{ fontSize: '0.625rem' }}>
                                                                                Yetkisiz
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* YAKIT */}
                                    {detailTab === 'yakit' && (
                                        <div>
                                            {selected.fuelSensorEnabled && selected.position?.fuel !== null ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{
                                                            width: 100, height: 100, borderRadius: '50%',
                                                            background: `conic-gradient(${(selected.position?.fuel || 0) > 25 ? '#16a34a' : '#dc2626'} ${(selected.position?.fuel || 0) * 3.6}deg, #f1f5f9 0deg)`,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        }}>
                                                            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.25rem' }}>
                                                                %{selected.position?.fuel || 0}
                                                            </div>
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: 8 }}>Yakıt Seviyesi</div>
                                                    </div>
                                                    {selected.fuelCapacity && (
                                                        <InfoCard label="Tahmini Litre" value={`${Math.round((selected.position?.fuel || 0) * selected.fuelCapacity / 100)} L`} />
                                                    )}
                                                </div>
                                            ) : (
                                                <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>Bu makinede yakıt sensörü aktif değil</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

function InfoCard({ label, value }: { label: string; value: string }) {
    return (
        <div style={{
            padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: 8,
            border: '1px solid var(--color-border)',
        }}>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-muted)', fontWeight: 500 }}>{label}</div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 700, marginTop: 2 }}>{value}</div>
        </div>
    )
}
