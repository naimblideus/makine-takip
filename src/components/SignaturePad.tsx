'use client'

// ─── İmza Bileşeni ──────────────────────────────────────────
// Canvas tabanlı; fare + dokunmatik (parmak) çizim. base64 PNG döner.
// Ekstra bağımlılık yok — saf canvas + pointer events.

import { useRef, useEffect, useState, useCallback } from 'react'
import { Eraser, PenLine } from 'lucide-react'

interface SignaturePadProps {
    onChange: (dataUrl: string | null) => void
    height?: number
    label?: string
    penColor?: string
}

export default function SignaturePad({ onChange, height = 160, label, penColor = '#1e293b' }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const drawing = useRef(false)
    const hasInk = useRef(false)
    const last = useRef<{ x: number; y: number } | null>(null)
    const [empty, setEmpty] = useState(true)

    // Canvas çözünürlüğünü konteyner genişliğine göre ayarla (retina dahil)
    const setupCanvas = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ratio = Math.max(window.devicePixelRatio || 1, 1)
        const rect = canvas.getBoundingClientRect()
        canvas.width = rect.width * ratio
        canvas.height = height * ratio
        const ctx = canvas.getContext('2d')
        if (ctx) {
            ctx.scale(ratio, ratio)
            ctx.lineWidth = 2.2
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            ctx.strokeStyle = penColor
        }
    }, [height, penColor])

    useEffect(() => {
        setupCanvas()
        const onResize = () => setupCanvas()
        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
    }, [setupCanvas])

    const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current!
        const rect = canvas.getBoundingClientRect()
        return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
        e.preventDefault()
        drawing.current = true
        last.current = pos(e)
        canvasRef.current?.setPointerCapture(e.pointerId)
    }

    const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!drawing.current) return
        e.preventDefault()
        const ctx = canvasRef.current?.getContext('2d')
        if (!ctx || !last.current) return
        const p = pos(e)
        ctx.beginPath()
        ctx.moveTo(last.current.x, last.current.y)
        ctx.lineTo(p.x, p.y)
        ctx.stroke()
        last.current = p
        if (!hasInk.current) {
            hasInk.current = true
            setEmpty(false)
        }
    }

    const end = () => {
        if (!drawing.current) return
        drawing.current = false
        last.current = null
        if (hasInk.current) {
            const dataUrl = canvasRef.current?.toDataURL('image/png') || null
            onChange(dataUrl)
        }
    }

    const clear = () => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
        hasInk.current = false
        setEmpty(true)
        onChange(null)
    }

    return (
        <div>
            {label ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <PenLine size={14} /> {label}
                    </span>
                    {!empty && (
                        <button type="button" onClick={clear}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: 'none', color: '#dc2626', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                            <Eraser size={13} /> Temizle
                        </button>
                    )}
                </div>
            ) : null}
            <div style={{ position: 'relative', border: '2px dashed #cbd5e1', borderRadius: '0.625rem', background: '#fff', overflow: 'hidden' }}>
                <canvas
                    ref={canvasRef}
                    style={{ width: '100%', height, display: 'block', touchAction: 'none', cursor: 'crosshair' }}
                    onPointerDown={start}
                    onPointerMove={move}
                    onPointerUp={end}
                    onPointerLeave={end}
                    onPointerCancel={end}
                />
                {empty && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', color: '#cbd5e1', fontSize: '0.875rem' }}>
                        Buraya parmağınız veya fareyle imzalayın
                    </div>
                )}
            </div>
        </div>
    )
}
