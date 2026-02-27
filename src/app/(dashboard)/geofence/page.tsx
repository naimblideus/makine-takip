'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, MapPin, Shield, AlertTriangle, Hexagon } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function GeofencePage() {
    const [geofences, setGeofences] = useState<any[]>([])
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [machines, setMachines] = useState<any[]>([])
    const [sites, setSites] = useState<any[]>([])

    // Form state
    const [formData, setFormData] = useState({
        name: '', siteId: '', actionOnBreach: 'ALERT', machineIds: [] as string[],
    })
    const [drawMode, setDrawMode] = useState(false)
    const [drawnCoords, setDrawnCoords] = useState<{ lat: number; lng: number }[]>([])

    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<any>(null)
    const drawLayerRef = useRef<any>(null)

    const fetchAll = async () => {
        try {
            const [gRes, mRes, sRes] = await Promise.all([
                fetch('/api/geofence'),
                fetch('/api/makineler?gpsOnly=true'),
                fetch('/api/santiyeler'),
            ])
            if (gRes.ok) setGeofences(await gRes.json())
            if (mRes.ok) setMachines(await mRes.json())
            if (sRes.ok) {
                const sData = await sRes.json()
                setSites(Array.isArray(sData) ? sData : sData.data || [])
            }
        } catch { /* hata */ }
        setLoading(false)
    }

    useEffect(() => { fetchAll() }, [])

    // Harita
    useEffect(() => {
        if (typeof window === 'undefined' || !containerRef.current) return
        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link')
            link.id = 'leaflet-css'
            link.rel = 'stylesheet'
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
            document.head.appendChild(link)
        }

        import('leaflet').then(L => {
            if (mapRef.current) return
            mapRef.current = L.map(containerRef.current!, { center: [39.9334, 32.8597], zoom: 7 })
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(mapRef.current)

            // Çizim modu: haritaya tıklayarak polygon noktaları ekle
            mapRef.current.on('click', (e: any) => {
                if (!drawMode) return
                setDrawnCoords(prev => [...prev, { lat: e.latlng.lat, lng: e.latlng.lng }])
            })
        })

        return () => {
            if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
        }
    }, [])

    // Geofence'leri haritada göster
    useEffect(() => {
        if (!mapRef.current) return
        import('leaflet').then(L => {
            // Mevcut layer'ları temizle
            mapRef.current.eachLayer((layer: any) => {
                if (layer._path) layer.remove()
            })

            geofences.forEach(gf => {
                const isSelected = gf.id === selectedId
                const coords = gf.coordinates as any
                const color = isSelected ? '#2563eb' : '#64748b'

                if (gf.type === 'POLYGON' && Array.isArray(coords)) {
                    L.polygon(coords.map((c: any) => [c.lat, c.lng]), {
                        color, fillColor: color, fillOpacity: isSelected ? 0.15 : 0.05, weight: isSelected ? 3 : 1.5,
                    }).addTo(mapRef.current).bindPopup(`<b>📐 ${gf.name}</b><br/>Makine: ${gf.assignedMachines?.length || 0}<br/>İhlal: ${gf._count?.breaches || 0}`)
                } else if (gf.type === 'CIRCLE' && coords?.lat) {
                    L.circle([coords.lat, coords.lng], {
                        radius: coords.radius || 500, color, fillColor: color, fillOpacity: isSelected ? 0.15 : 0.05, weight: isSelected ? 3 : 1.5,
                    }).addTo(mapRef.current).bindPopup(`<b>📐 ${gf.name}</b>`)
                }
            })

            // Çizim polygon'u
            if (drawnCoords.length > 0) {
                if (drawLayerRef.current) drawLayerRef.current.remove()
                drawLayerRef.current = L.polygon(drawnCoords.map(c => [c.lat, c.lng]), {
                    color: '#16a34a', fillColor: '#16a34a', fillOpacity: 0.1, weight: 2, dashArray: '5,5',
                }).addTo(mapRef.current)

                // Noktaları göster
                drawnCoords.forEach((c, i) => {
                    L.circleMarker([c.lat, c.lng], {
                        radius: 5, fillColor: '#16a34a', color: 'white', weight: 2, fillOpacity: 1,
                    }).addTo(mapRef.current)
                })
            }
        })
    }, [geofences, selectedId, drawnCoords])

    const handleCreate = async () => {
        if (drawnCoords.length < 3) {
            alert('En az 3 nokta çizmelisiniz')
            return
        }
        try {
            const res = await fetch('/api/geofence', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    type: 'POLYGON',
                    coordinates: drawnCoords,
                }),
            })
            if (res.ok) {
                setShowForm(false)
                setDrawMode(false)
                setDrawnCoords([])
                setFormData({ name: '', siteId: '', actionOnBreach: 'ALERT', machineIds: [] })
                fetchAll()
            }
        } catch { alert('Geofence oluşturulamadı') }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bu geofence silinsin mi?')) return
        await fetch(`/api/geofence/${id}`, { method: 'DELETE' })
        fetchAll()
    }

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
            {/* Sol Panel */}
            <div style={{
                width: 340, minWidth: 340, background: 'white', borderRight: '1px solid var(--color-border)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '1.125rem', fontWeight: 800 }}>📐 Geofence</h1>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>{geofences.length} bölge tanımlı</div>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(!showForm); setDrawMode(!showForm); if (showForm) setDrawnCoords([]) }}>
                        <Plus size={16} /> Yeni
                    </button>
                </div>

                {/* Yeni geofence formu */}
                {showForm && (
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div className="alert alert-info" style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}>
                            <MapPin size={14} /> Haritaya tıklayarak polygon noktalarını belirleyin
                        </div>
                        <input className="input" placeholder="Geofence adı" value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} />
                        <select className="input select" value={formData.siteId} onChange={e => setFormData(f => ({ ...f, siteId: e.target.value }))}>
                            <option value="">Şantiye seçin (opsiyonel)</option>
                            {sites.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <select className="input select" value={formData.actionOnBreach} onChange={e => setFormData(f => ({ ...f, actionOnBreach: e.target.value }))}>
                            <option value="ALERT">Sadece Uyar</option>
                            <option value="STOP">Motor Durdur</option>
                        </select>

                        <div>
                            <label className="label">Makineler</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxHeight: 100, overflowY: 'auto' }}>
                                {machines.map((m: any) => (
                                    <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', padding: '4px 8px', borderRadius: 6, background: formData.machineIds.includes(m.id) ? '#dbeafe' : '#f8fafc', cursor: 'pointer', border: '1px solid var(--color-border)' }}>
                                        <input type="checkbox" checked={formData.machineIds.includes(m.id)}
                                            onChange={e => setFormData(f => ({
                                                ...f, machineIds: e.target.checked ? [...f.machineIds, m.id] : f.machineIds.filter(id => id !== m.id),
                                            }))} />
                                        {m.plate || `${m.brand} ${m.model}`}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                            {drawnCoords.length} nokta çizildi
                            {drawnCoords.length > 0 && (
                                <button className="btn btn-ghost btn-sm" onClick={() => setDrawnCoords([])} style={{ marginLeft: 8 }}>Temizle</button>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-success btn-sm" onClick={handleCreate} disabled={!formData.name || drawnCoords.length < 3}>
                                Oluştur
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); setDrawMode(false); setDrawnCoords([]) }}>
                                İptal
                            </button>
                        </div>
                    </div>
                )}

                {/* Geofence listesi */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}><div className="spinner" /></div>
                    ) : geofences.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon"><Hexagon size={24} /></div>
                            <div className="empty-state-title">Geofence yok</div>
                            <div className="empty-state-text">Haritada bir geofence alanı oluşturun</div>
                        </div>
                    ) : geofences.map(gf => (
                        <div key={gf.id}
                            className={cn('card', selectedId === gf.id && 'card-interactive')}
                            onClick={() => setSelectedId(gf.id)}
                            style={{
                                padding: '0.75rem', marginBottom: '0.375rem', cursor: 'pointer',
                                borderColor: selectedId === gf.id ? 'var(--color-primary)' : undefined,
                                borderWidth: selectedId === gf.id ? 2 : 1,
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{gf.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: 2 }}>
                                        {gf.site?.name || 'Bağımsız'} • {gf.assignedMachines?.length || 0} makine
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                    {gf.actionOnBreach === 'STOP' && (
                                        <span className="badge bg-red-50 text-red-700" style={{ fontSize: '0.625rem' }}>
                                            <Shield size={10} /> Durdur
                                        </span>
                                    )}
                                    <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => { e.stopPropagation(); handleDelete(gf.id) }}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            {(gf._count?.breaches || 0) > 0 && (
                                <div style={{ fontSize: '0.6875rem', color: 'var(--color-danger)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <AlertTriangle size={11} /> {gf._count.breaches} ihlal
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Harita */}
            <div ref={containerRef} style={{ flex: 1, height: '100%', minHeight: 400, background: '#f1f5f9' }} />
        </div>
    )
}
