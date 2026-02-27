'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Building2, MapPin, Phone } from 'lucide-react'

interface Site {
    id: string
    name: string
    address: string | null
    contactPerson: string | null
    contactPhone: string | null
    customer: { companyName: string }
}

export default function SantiyelerPage() {
    const [sites, setSites] = useState<Site[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/santiyeler')
            .then((res) => res.json())
            .then(setSites)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Şantiyeler</h1>
                    <p className="page-subtitle">{sites.length} şantiye</p>
                </div>
                <Link href="/santiyeler/yeni" className="btn btn-primary">
                    <Plus size={18} />
                    Yeni Şantiye
                </Link>
            </div>

            {loading && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '30vh' }}><div className="spinner" /></div>}

            {!loading && sites.length === 0 && (
                <div className="card"><div className="empty-state"><div className="empty-state-icon"><Building2 size={28} /></div><div className="empty-state-title">Henüz şantiye yok</div></div></div>
            )}

            {!loading && sites.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                    {sites.map((s) => (
                        <div key={s.id} className="card" style={{ padding: '1.25rem' }}>
                            <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{s.name}</div>
                            <div style={{ fontSize: '0.8125rem', color: '#2563eb', fontWeight: 500, marginBottom: '0.5rem' }}>🏢 {s.customer.companyName}</div>
                            {s.address && <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: '#64748b', marginBottom: '0.25rem' }}><MapPin size={12} />{s.address}</div>}
                            {s.contactPerson && <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>👤 {s.contactPerson}{s.contactPhone && ` · ${s.contactPhone}`}</div>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
