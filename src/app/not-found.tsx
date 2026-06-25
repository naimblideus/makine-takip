import Link from 'next/link'
import { Compass, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background:
          'radial-gradient(1200px 600px at 50% -10%, #1e293b 0%, #0f172a 55%, #0f172a 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: '#ffffff',
          borderRadius: 20,
          boxShadow: '0 25px 60px -20px rgba(2, 6, 23, 0.6)',
          padding: '2.5rem 2rem',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            margin: '0 auto 1rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#dbeafe',
            color: '#2563eb',
          }}
        >
          <Compass size={36} strokeWidth={2} />
        </div>

        <div
          style={{
            fontSize: '3rem',
            fontWeight: 800,
            lineHeight: 1,
            color: '#0f172a',
            margin: '0 0 0.5rem',
            letterSpacing: '-0.02em',
          }}
        >
          404
        </div>

        <h1
          style={{
            fontSize: '1.35rem',
            fontWeight: 700,
            color: '#0f172a',
            margin: '0 0 0.5rem',
          }}
        >
          Sayfa bulunamadı
        </h1>

        <p
          style={{
            fontSize: '0.95rem',
            lineHeight: 1.6,
            color: '#64748b',
            margin: '0 0 1.75rem',
          }}
        >
          Aradığınız sayfa taşınmış veya hiç var olmamış olabilir. Adresi kontrol
          edip ana sayfaya dönebilirsiniz.
        </p>

        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            fontSize: '0.95rem',
            fontWeight: 600,
            color: '#ffffff',
            background: '#2563eb',
            border: 'none',
            borderRadius: 12,
            textDecoration: 'none',
            boxShadow: '0 8px 20px -8px rgba(37, 99, 235, 0.7)',
          }}
        >
          <Home size={18} />
          Ana sayfaya dön
        </Link>
      </div>
    </div>
  )
}
