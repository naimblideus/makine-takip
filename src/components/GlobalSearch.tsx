'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Truck, Users, CalendarRange, HardHat, X } from 'lucide-react'

interface SearchResult {
    id: string
    type: 'makine' | 'musteri' | 'kiralama' | 'operator'
    label: string
    sublabel?: string
    href: string
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
    makine: <Truck size={16} />,
    musteri: <Users size={16} />,
    kiralama: <CalendarRange size={16} />,
    operator: <HardHat size={16} />,
}

const TYPE_LABELS: Record<string, string> = {
    makine: 'Makine',
    musteri: 'Müşteri',
    kiralama: 'Kiralama',
    operator: 'Operatör',
}

export default function GlobalSearch() {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const [selected, setSelected] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    // Ctrl+K ile aç
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault()
                setOpen(true)
                setTimeout(() => inputRef.current?.focus(), 50)
            }
            if (e.key === 'Escape') setOpen(false)
        }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [])

    // Arama
    const doSearch = useCallback(async (q: string) => {
        if (!q.trim()) { setResults([]); return }
        setLoading(true)
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
            if (res.ok) {
                const data = await res.json()
                setResults(data.results || [])
                setSelected(0)
            }
        } catch { }
        setLoading(false)
    }, [])

    useEffect(() => {
        const t = setTimeout(() => doSearch(query), 300)
        return () => clearTimeout(t)
    }, [query, doSearch])

    const go = (href: string) => {
        router.push(href)
        setOpen(false)
        setQuery('')
        setResults([])
    }

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
        if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
        if (e.key === 'Enter' && results[selected]) go(results[selected].href)
    }

    if (!open) return null

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 999,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                paddingTop: '10vh', paddingLeft: '1rem', paddingRight: '1rem',
            }}
            onClick={() => setOpen(false)}
        >
            <div
                style={{
                    width: '100%', maxWidth: '560px',
                    background: 'white', borderRadius: '1rem',
                    boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
                    overflow: 'hidden',
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9' }}>
                    <Search size={20} color="#94a3b8" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKey}
                        placeholder="Makine, müşteri, kiralama ara..."
                        style={{
                            flex: 1, border: 'none', outline: 'none', fontSize: '1rem',
                            fontFamily: 'inherit', color: '#0f172a', background: 'transparent',
                        }}
                        autoFocus
                    />
                    <div style={{ display: 'flex', gap: 4 }}>
                        <kbd style={{ fontSize: '0.6875rem', padding: '2px 6px', borderRadius: 4, background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b' }}>ESC</kbd>
                    </div>
                    <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                        <X size={18} />
                    </button>
                </div>

                <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    {loading && (
                        <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                            Aranıyor...
                        </div>
                    )}
                    {!loading && query && results.length === 0 && (
                        <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                            "{query}" için sonuç bulunamadı
                        </div>
                    )}
                    {!loading && !query && (
                        <div style={{ padding: '1.25rem', color: '#94a3b8', fontSize: '0.8125rem', textAlign: 'center' }}>
                            Makine, müşteri, kiralama veya operatör arayın
                        </div>
                    )}
                    {results.length > 0 && (
                        <div style={{ padding: '0.5rem' }}>
                            {results.map((r, i) => (
                                <button
                                    key={r.id + r.type}
                                    onClick={() => go(r.href)}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                                        padding: '0.625rem 0.875rem', borderRadius: '0.5rem',
                                        border: 'none', cursor: 'pointer', textAlign: 'left',
                                        background: i === selected ? '#eff6ff' : 'transparent',
                                        color: i === selected ? '#2563eb' : '#0f172a',
                                        fontFamily: 'inherit',
                                    }}
                                    onMouseEnter={() => setSelected(i)}
                                >
                                    <span style={{
                                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: i === selected ? '#dbeafe' : '#f1f5f9',
                                        color: i === selected ? '#2563eb' : '#64748b',
                                    }}>
                                        {TYPE_ICONS[r.type]}
                                    </span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</div>
                                        {r.sublabel && <div style={{ fontSize: '0.75rem', color: i === selected ? '#3b82f6' : '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.sublabel}</div>}
                                    </div>
                                    <span style={{ fontSize: '0.6875rem', padding: '2px 8px', borderRadius: 9999, background: i === selected ? '#dbeafe' : '#f1f5f9', color: i === selected ? '#2563eb' : '#94a3b8', flexShrink: 0 }}>
                                        {TYPE_LABELS[r.type]}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '1rem', fontSize: '0.6875rem', color: '#94a3b8' }}>
                    <span><kbd style={{ padding: '1px 5px', borderRadius: 3, background: '#f1f5f9', border: '1px solid #e2e8f0' }}>↑↓</kbd> Gezin</span>
                    <span><kbd style={{ padding: '1px 5px', borderRadius: 3, background: '#f1f5f9', border: '1px solid #e2e8f0' }}>Enter</kbd> Git</span>
                    <span><kbd style={{ padding: '1px 5px', borderRadius: 3, background: '#f1f5f9', border: '1px solid #e2e8f0' }}>Ctrl+K</kbd> Aç/Kapat</span>
                </div>
            </div>
        </div>
    )
}
