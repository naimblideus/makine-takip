'use client'

import { useEffect, useState } from 'react'
import { Trophy, Star, Award, Plus, TrendingUp } from 'lucide-react'

const BADGE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    ALTIN: { label: 'Altın', color: '#92400e', bg: '#fef3c7', icon: '🥇' },
    GUMUS: { label: 'Gümüş', color: '#475569', bg: '#f1f5f9', icon: '🥈' },
    BRONZ: { label: 'Bronz', color: '#7c2d12', bg: '#fef3c7', icon: '🥉' },
}

export default function OperatorPerformancePage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7))
    const [showModal, setShowModal] = useState(false)
    const [selectedOp, setSelectedOp] = useState<any>(null)
    const [form, setForm] = useState({ operatorId: '', period: '', attendanceScore: '0', safetyScore: '0', efficiencyScore: '0', maintenanceScore: '0', notes: '' })

    const load = async () => {
        setLoading(true)
        const res = await fetch(`/api/operatorler/skor?period=${period}`)
        setData(await res.json())
        setLoading(false)
    }

    useEffect(() => { load() }, [period])

    const handleScore = async (e: React.FormEvent) => {
        e.preventDefault()
        await fetch('/api/operatorler/skor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...form, period }),
        })
        setShowModal(false)
        load()
    }

    if (loading) return <div className="spinner" style={{ margin: '3rem auto' }} />
    const { scores = [], operators = [] } = data || {}

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Operatör Performansı</h1>
                    <p className="page-subtitle">Aylık liderlik tablosu ve rozet sistemi</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input type="month" value={period} onChange={e => setPeriod(e.target.value)}
                        style={{ padding: '0.375rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.875rem' }} />
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Skor Gir</button>
                </div>
            </div>

            {/* Podyum */}
            {scores.length >= 3 && (
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', justifyContent: 'center' }}>
                    {[scores[1], scores[0], scores[2]].map((s, i) => {
                        const podiums = ['🥈', '🥇', '🥉']
                        const sizes = ['1rem', '1.2rem', '0.95rem']
                        const heights = ['100px', '130px', '90px']
                        if (!s) return <div key={i} />
                        return (
                            <div key={s.id} style={{
                                flex: 1, maxWidth: 180, textAlign: 'center', display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'flex-end',
                            }}>
                                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{podiums[i]}</div>
                                <div style={{ fontWeight: 700, fontSize: sizes[i] }}>{s.operator?.name}</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563eb' }}>{s.totalScore}</div>
                                <div style={{ background: i === 1 ? '#fde68a' : i === 0 ? '#e2e8f0' : '#fed7aa', height: heights[i], width: '100%', borderRadius: '0.5rem 0.5rem 0 0', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                                    {i + 1 === 1 ? '2.' : i + 1 === 2 ? '1.' : '3.'} Sıra
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Liderlik Tablosu */}
            <div className="card" style={{ marginBottom: '1rem' }}>
                <table className="table">
                    <thead>
                        <tr><th>#</th><th>Operatör</th><th>Devam</th><th>Güvenlik</th><th>Verimlilik</th><th>Bakım Özeni</th><th>Toplam</th><th>Rozet</th></tr>
                    </thead>
                    <tbody>
                        {scores.map((s: any, i: number) => {
                            const badge = s.badge ? BADGE_CONFIG[s.badge] : null
                            return (
                                <tr key={s.id}>
                                    <td style={{ fontWeight: 700, color: i === 0 ? '#d97706' : '#64748b', fontSize: '1rem' }}>{i + 1}</td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{s.operator?.name}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{s.operator?.licenseClass}</div>
                                    </td>
                                    {[s.attendanceScore, s.safetyScore, s.efficiencyScore, s.maintenanceScore].map((score, si) => (
                                        <td key={si} style={{ fontSize: '0.85rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ height: '6px', borderRadius: '9999px', background: '#f1f5f9', flex: 1, overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', borderRadius: '9999px', background: score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444', width: `${score}%` }} />
                                                </div>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, minWidth: 24 }}>{score}</span>
                                            </div>
                                        </td>
                                    ))}
                                    <td style={{ fontWeight: 800, fontSize: '1rem', color: '#2563eb' }}>{s.totalScore}</td>
                                    <td>
                                        {badge ? (
                                            <span style={{ padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, background: badge.bg, color: badge.color }}>
                                                {badge.icon} {badge.label}
                                            </span>
                                        ) : '—'}
                                    </td>
                                </tr>
                            )
                        })}
                        {scores.length === 0 && (
                            <tr><td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>Bu dönem için skor girilmemiş</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
                    <div className="card" style={{ width: '100%', maxWidth: 440, padding: '1.5rem' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Performans Skoru Gir</h2>
                        <form onSubmit={handleScore} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                                <label className="form-label">Operatör</label>
                                <select className="form-input" value={form.operatorId} onChange={e => setForm({ ...form, operatorId: e.target.value })} required>
                                    <option value="">Seçin...</option>
                                    {operators.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
                                </select>
                            </div>
                            {[
                                { key: 'attendanceScore', label: 'Devam Puanı (0-100)', desc: 'Dakiklik, devamsızlık' },
                                { key: 'safetyScore', label: 'Güvenlik Puanı (0-100)', desc: 'Hız ihlali, geofence' },
                                { key: 'efficiencyScore', label: 'Verimlilik Puanı (0-100)', desc: 'Boşta çalışma süresi' },
                                { key: 'maintenanceScore', label: 'Bakım Özeni (0-100)', desc: 'Günlük kontroller' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="form-label">{f.label} <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>({f.desc})</span></label>
                                    <input type="range" min="0" max="100" className="form-input" style={{ padding: '0.25rem 0', cursor: 'pointer' }}
                                        value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                                    <div style={{ textAlign: 'right', fontSize: '0.8rem', fontWeight: 700, color: '#2563eb' }}>{(form as any)[f.key]}</div>
                                </div>
                            ))}
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>İptal</button>
                                <button type="submit" className="btn btn-primary">Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
