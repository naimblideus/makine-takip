'use client'

import { useEffect, useState } from 'react'
import { Plug, MapPin, MessageSquare, Mail, Phone, FileText, CreditCard, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

const CHANNELS = [
    { key: 'gps', label: 'GPS / Telemetri (Traccar)', icon: MapPin, c: '#2563eb', desc: 'Konum, motor saati, hız. Env: TRACCAR_URL / USERNAME / PASSWORD', envHint: 'TRACCAR_URL, TRACCAR_USERNAME, TRACCAR_PASSWORD' },
    { key: 'sms', label: 'SMS (NetGSM)', icon: MessageSquare, c: '#059669', desc: 'Hakediş/teklif/tahsilat bildirimleri', envHint: 'NETGSM_USERCODE, NETGSM_PASSWORD, NETGSM_MSGHEADER' },
    { key: 'email', label: 'E-posta (Resend)', icon: Mail, c: '#7c3aed', desc: 'Fatura/portal linkleri + bildirim', envHint: 'RESEND_API_KEY, MAIL_FROM' },
    { key: 'whatsapp', label: 'WhatsApp (Meta Cloud)', icon: Phone, c: '#16a34a', desc: 'Patron özeti + müşteri bildirimi', envHint: 'WHATSAPP_TOKEN, WHATSAPP_PHONE_ID' },
    { key: 'efatura', label: 'e-Fatura (Nilvera/Paraşüt)', icon: FileText, c: '#d97706', desc: 'GİB e-Fatura/e-Arşiv (2026 zorunlu)', envHint: 'EFATURA_PROVIDER, EFATURA_API_KEY, EFATURA_USERNAME' },
    { key: 'iyzico', label: 'Online Tahsilat (iyzico)', icon: CreditCard, c: '#dc2626', desc: 'Kredi kartı ile online ödeme', envHint: 'IYZICO_API_KEY, IYZICO_SECRET, IYZICO_URI' },
]

export default function EntegrasyonlarPage() {
    const [status, setStatus] = useState<any>({})
    const [loading, setLoading] = useState(true)
    const [testing, setTesting] = useState('')
    const [results, setResults] = useState<Record<string, { ok: boolean; info: string }>>({})

    useEffect(() => {
        fetch('/api/entegrasyon/test').then(r => r.json()).then(d => setStatus(d && !d.error ? d : {})).catch(() => { }).finally(() => setLoading(false))
    }, [])

    const test = async (key: string) => {
        setTesting(key)
        try {
            const r = await fetch('/api/entegrasyon/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ channel: key }) })
            const j = await r.json()
            setResults(p => ({ ...p, [key]: { ok: !!j.ok, info: j.info || j.error || '—' } }))
        } catch (e: any) {
            setResults(p => ({ ...p, [key]: { ok: false, info: e?.message || 'Hata' } }))
        }
        setTesting('')
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 36, height: 36, borderRadius: 10, background: '#2563eb20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plug size={20} color="#2563eb" /></span>
                        Entegrasyonlar
                    </h1>
                    <p className="page-subtitle">Dış servisler — anahtarı .env'e gir, burada test et, canlıya geç</p>
                </div>
            </div>

            <div className="card" style={{ padding: '0.875rem 1.25rem', marginBottom: '1.25rem', background: 'linear-gradient(180deg,#eff6ff,#fff)', border: '1px solid #bfdbfe', fontSize: '0.85rem', color: '#1e3a8a' }}>
                💡 Anahtar girilmemiş servisler <b>mock</b> modda çalışır (sistem akar, dış gönderim yapılmaz). İlgili env değişkenlerini girip <b>Redeploy</b> ettikten sonra burada <b>Test Et</b> ile doğrula.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '1rem' }}>
                {CHANNELS.map(ch => {
                    const Icon = ch.icon
                    const live = status[ch.key] && status[ch.key].mock === false
                    const res = results[ch.key]
                    return (
                        <div key={ch.key} className="card" style={{ padding: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
                                    <span style={{ width: 38, height: 38, borderRadius: 10, background: ch.c + '18', color: ch.c, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon size={19} /></span>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{ch.label}</div>
                                        <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>{ch.desc}</div>
                                    </div>
                                </div>
                                <span style={{ flexShrink: 0, padding: '0.2rem 0.55rem', borderRadius: 9999, fontSize: '0.66rem', fontWeight: 800, background: live ? '#d1fae5' : '#fef3c7', color: live ? '#059669' : '#d97706' }}>
                                    {loading ? '…' : live ? 'CANLI' : 'MOCK'}
                                </span>
                            </div>

                            <div style={{ fontSize: '0.68rem', color: '#cbd5e1', marginTop: '0.75rem', fontFamily: 'ui-monospace, monospace' }}>{ch.envHint}</div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginTop: '0.875rem' }}>
                                <button className="btn btn-sm btn-outline" disabled={testing === ch.key} onClick={() => test(ch.key)}>
                                    {testing === ch.key ? <><Loader2 size={14} className="spin" /> Test ediliyor…</> : 'Test Et'}
                                </button>
                                {res && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.76rem', fontWeight: 600, color: res.ok ? '#059669' : '#dc2626' }}>
                                        {res.ok ? <CheckCircle2 size={15} /> : <XCircle size={15} />} {res.info}
                                    </span>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            <style jsx>{`.spin { animation: spin 1s linear infinite } @keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
    )
}
