'use client'

import { useEffect, useRef } from 'react'

interface VehiclePosition {
    machineId: string
    plate: string | null
    brand: string
    model: string
    type: string
    speedLimit: number | null
    activeRental: { customer: string; operator: string | null; site: string | null } | null
    position: {
        lat: number; lng: number; speed: number; course: number
        ignition: boolean; fuel: number | null; motion: boolean
        satellites: number; fixTime: string; valid: boolean
    } | null
    online: boolean
}

interface MapViewProps {
    vehicles: VehiclePosition[]
    selectedId: string | null
    onSelect: (id: string) => void
    geofences?: Array<{ coordinates: any; name: string; type: string }>
}

// Makine tipine göre emoji ikon
const MACHINE_ICONS: Record<string, string> = {
    EKSAVATOR: '🏗️', VINC: '🏗️', DOZER: '🚜', KEPCE: '🚜',
    GREYDER: '🚜', SILINDIR: '🚜', KAMYON: '🚛', BEKO_LODER: '🚜',
    FORKLIFT: '🏭', DIGER: '⚙️',
}

export default function MapView({ vehicles, selectedId, onSelect, geofences }: MapViewProps) {
    const mapRef = useRef<any>(null)
    const markersRef = useRef<any[]>([])
    const containerRef = useRef<HTMLDivElement>(null)
    const geofenceLayersRef = useRef<any[]>([])

    // Harita ilk oluşturma
    useEffect(() => {
        if (typeof window === 'undefined' || !containerRef.current) return

        // Leaflet CSS
        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link')
            link.id = 'leaflet-css'
            link.rel = 'stylesheet'
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
            document.head.appendChild(link)
        }

        import('leaflet').then(L => {
            if (mapRef.current) return

            mapRef.current = L.map(containerRef.current!, {
                center: [39.9334, 32.8597], // Türkiye merkezi
                zoom: 7,
            })

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap',
            }).addTo(mapRef.current)
        })

        return () => {
            if (mapRef.current) {
                mapRef.current.remove()
                mapRef.current = null
            }
        }
    }, [])

    // Marker güncelleme
    useEffect(() => {
        if (!mapRef.current) return

        import('leaflet').then(L => {
            // Eski marker'ları temizle
            markersRef.current.forEach(m => m.remove())
            markersRef.current = []

            vehicles.forEach(v => {
                if (!v.position) return

                const isSelected = v.machineId === selectedId
                const emoji = MACHINE_ICONS[v.type] || '⚙️'

                // Renk: yeşil (motor açık + hareket), turuncu (motor açık + durgun), kırmızı (motor kapalı), gri (sinyal yok)
                let bgColor = '#9CA3AF' // gri
                if (v.online && v.position.valid) {
                    if (v.position.ignition) {
                        bgColor = v.position.motion ? '#16a34a' : '#f59e0b'
                    } else {
                        bgColor = '#dc2626'
                    }
                }

                // Hız ihlali: parlak kırmızı
                if (v.speedLimit && v.position.speed > v.speedLimit) {
                    bgColor = '#7c2d12'
                }

                const size = isSelected ? 44 : 36

                const icon = L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="
                        background:${bgColor};
                        width:${size}px;
                        height:${size}px;
                        border-radius:50%;
                        border:3px solid white;
                        box-shadow:0 2px 10px rgba(0,0,0,0.35);
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        font-size:${isSelected ? 18 : 14}px;
                        color:white;
                        transition:all 0.2s;
                        cursor:pointer;
                    ">${emoji}</div>`,
                    iconSize: [size, size],
                    iconAnchor: [size / 2, size / 2],
                })

                const marker = L.marker([v.position.lat, v.position.lng], { icon })
                    .addTo(mapRef.current)
                    .bindPopup(`
                        <div style="font-size:13px;min-width:180px">
                            <strong>${v.plate || `${v.brand} ${v.model}`}</strong><br/>
                            <span style="color:#666">${v.brand} ${v.model}</span><br/>
                            <div style="margin-top:8px;display:flex;flex-direction:column;gap:4px">
                                <div>🏎️ <b>${v.position.speed} km/h</b>${v.speedLimit ? ` (limit: ${v.speedLimit})` : ''}</div>
                                <div>${v.position.ignition ? '🟢 Motor Açık' : '🔴 Motor Kapalı'}</div>
                                ${v.position.fuel !== null ? `<div>⛽ Yakıt: %${v.position.fuel}</div>` : ''}
                                ${v.activeRental ? `<div>📋 ${v.activeRental.customer}</div>` : ''}
                            </div>
                        </div>
                    `)
                    .on('click', () => onSelect(v.machineId))

                markersRef.current.push(marker)

                if (isSelected) {
                    mapRef.current.setView([v.position.lat, v.position.lng], 14, { animate: true })
                }
            })
        })
    }, [vehicles, selectedId, onSelect])

    // Geofence çizimi
    useEffect(() => {
        if (!mapRef.current || !geofences) return

        import('leaflet').then(L => {
            geofenceLayersRef.current.forEach(l => l.remove())
            geofenceLayersRef.current = []

            geofences.forEach(gf => {
                if (gf.type === 'POLYGON' && Array.isArray(gf.coordinates)) {
                    const latlngs = gf.coordinates.map((c: any) => [c.lat, c.lng])
                    const polygon = L.polygon(latlngs, {
                        color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 2,
                    }).addTo(mapRef.current)
                    polygon.bindPopup(`<b>📐 ${gf.name}</b>`)
                    geofenceLayersRef.current.push(polygon)
                } else if (gf.type === 'CIRCLE' && gf.coordinates?.lat) {
                    const circle = L.circle([gf.coordinates.lat, gf.coordinates.lng], {
                        radius: gf.coordinates.radius || 500,
                        color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 2,
                    }).addTo(mapRef.current)
                    circle.bindPopup(`<b>📐 ${gf.name}</b>`)
                    geofenceLayersRef.current.push(circle)
                }
            })
        })
    }, [geofences])

    return <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: 400, background: '#f1f5f9' }} />
}
