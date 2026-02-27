'use client'

import { useState, useEffect, useRef, use } from 'react'
import { ArrowLeft, Calendar } from 'lucide-react'
import Link from 'next/link'
import { formatNumber } from '@/lib/utils'

interface RoutePoint {
    lat: number
    lng: number
    speed: number
    ignition: boolean
    time: string
}

export default function RotaPage({ params }: { params: Promise<{ machineId: string }> }) {
    const { machineId } = use(params)
    const [route, setRoute] = useState<RoutePoint[]>([])
    const [summary, setSummary] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [fromDate, setFromDate] = useState(new Date().toISOString().slice(0, 10))
    const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10))
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<any>(null)

    const fetchRoute = async () => {
        setLoading(true)
        try {
            const from = new Date(fromDate).toISOString()
            const to = new Date(toDate + 'T23:59:59').toISOString()
            const res = await fetch(`/api/gps/history/${machineId}?from=${from}&to=${to}`)
            if (res.ok) {
                const data = await res.json()
                setRoute(data.route || [])
                setSummary(data.summary || null)
            }
        } catch { /* hata */ }
        setLoading(false)
    }

    useEffect(() => { fetchRoute() }, [fromDate, toDate])

    // Harita oluştur ve rota çiz
    useEffect(() => {
        if (typeof window === 'undefined' || !containerRef.current || route.length === 0) return

        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link')
            link.id = 'leaflet-css'
            link.rel = 'stylesheet'
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
            document.head.appendChild(link)
        }

        import('leaflet').then(L => {
            if (mapRef.current) {
                mapRef.current.remove()
                mapRef.current = null
            }

            mapRef.current = L.map(containerRef.current!, {
                center: [route[0].lat, route[0].lng],
                zoom: 13,
            })

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap',
            }).addTo(mapRef.current)

            // Rota çizgisi — hıza göre renk
            for (let i = 1; i < route.length; i++) {
                const prev = route[i - 1]
                const curr = route[i]
                let color = '#16a34a' // yeşil (yavaş)
                if (curr.speed > 40) color = '#f59e0b' // turuncu
                if (curr.speed > 60) color = '#dc2626' // kırmızı

                L.polyline([[prev.lat, prev.lng], [curr.lat, curr.lng]], {
                    color, weight: 4, opacity: 0.8,
                }).addTo(mapRef.current)
            }

            // Durak noktaları (motor kapalı)
            route.filter(p => !p.ignition).forEach(p => {
                L.circleMarker([p.lat, p.lng], {
                    radius: 6, fillColor: '#dc2626', color: 'white', weight: 2, fillOpacity: 1,
                }).addTo(mapRef.current).bindPopup(
                    `<b>Motor Kapalı</b><br/>${new Date(p.time).toLocaleTimeString('tr-TR')}`
                )
            })

            // Başlangıç ve bitiş marker
            if (route.length > 1) {
                L.marker([route[0].lat, route[0].lng], {
                    icon: L.divIcon({
                        className: '', html: '<div style="background:#16a34a;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">S</div>',
                        iconSize: [28, 28], iconAnchor: [14, 14],
                    }),
                }).addTo(mapRef.current).bindPopup(`<b>Başlangıç</b><br/>${new Date(route[0].time).toLocaleTimeString('tr-TR')}`)

                const last = route[route.length - 1]
                L.marker([last.lat, last.lng], {
                    icon: L.divIcon({
                        className: '', html: '<div style="background:#dc2626;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">B</div>',
                        iconSize: [28, 28], iconAnchor: [14, 14],
                    }),
                }).addTo(mapRef.current).bindPopup(`<b>Bitiş</b><br/>${new Date(last.time).toLocaleTimeString('tr-TR')}`)
            }

            // Tüm rotayı göster
            const bounds = L.latLngBounds(route.map(r => [r.lat, r.lng]))
            mapRef.current.fitBounds(bounds, { padding: [50, 50] })
        })

        return () => {
            if (mapRef.current) {
                mapRef.current.remove()
                mapRef.current = null
            }
        }
    }, [route])

    return (
        <div>
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Link href="/takip" className="btn btn-ghost btn-icon btn-sm"><ArrowLeft size={18} /></Link>
                    <div>
                        <h1 className="page-title">Rota Geçmişi</h1>
                        <p className="page-subtitle">Makinenin gün içi rota ve durak noktaları</p>
                    </div>
                </div>
            </div>

            {/* Tarih seçici + Özet */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16, alignItems: 'flex-end' }}>
                <div>
                    <label className="label">Başlangıç</label>
                    <input type="date" className="input" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ width: 160 }} />
                </div>
                <div>
                    <label className="label">Bitiş</label>
                    <input type="date" className="input" value={toDate} onChange={e => setToDate(e.target.value)} style={{ width: 160 }} />
                </div>
                {summary && (
                    <div style={{ display: 'flex', gap: 16, marginLeft: 'auto', flexWrap: 'wrap' }}>
                        <SummaryChip label="Mesafe" value={`${summary.totalDistance > 1000 ? (summary.totalDistance / 1000).toFixed(1) + ' km' : summary.totalDistance + ' m'}`} />
                        <SummaryChip label="Maks Hız" value={`${summary.maxSpeed} km/h`} />
                        <SummaryChip label="Ort. Hız" value={`${summary.avgSpeed} km/h`} />
                        <SummaryChip label="Süre" value={`${Math.round(summary.duration / 60)} saat ${summary.duration % 60} dk`} />
                    </div>
                )}
            </div>

            {/* Harita */}
            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
                    <div className="spinner" />
                </div>
            ) : route.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><Calendar size={24} /></div>
                    <div className="empty-state-title">Rota verisi yok</div>
                    <div className="empty-state-text">Seçilen tarih aralığında rota kaydı bulunamadı</div>
                </div>
            ) : (
                <div ref={containerRef} style={{ height: 'calc(100vh - 280px)', minHeight: 400, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--color-border)' }} />
            )}
        </div>
    )
}

function SummaryChip({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ padding: '6px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid var(--color-border)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-muted)', fontWeight: 500 }}>{label}</div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{value}</div>
        </div>
    )
}
