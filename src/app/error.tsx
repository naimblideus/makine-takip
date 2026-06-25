'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Hatayi konsola yaz (uretimde gozlemlenebilirlik icin)
    console.error('Route hatasi:', error)
  }, [error])

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
            margin: '0 auto 1.25rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fee2e2',
            color: '#dc2626',
          }}
        >
          <AlertTriangle size={36} strokeWidth={2} />
        </div>

        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#0f172a',
            margin: '0 0 0.5rem',
          }}
        >
          Bir sorun oluştu
        </h1>

        <p
          style={{
            fontSize: '0.95rem',
            lineHeight: 1.6,
            color: '#64748b',
            margin: '0 0 1.75rem',
          }}
        >
          Beklenmeyen bir hata nedeniyle bu sayfa görüntülenemedi. Lütfen tekrar
          deneyin; sorun devam ederse bizimle iletişime geçin.
        </p>

        {error?.digest && (
          <p
            style={{
              fontSize: '0.75rem',
              color: '#94a3b8',
              margin: '0 0 1.5rem',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}
          >
            Hata kodu: {error.digest}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            justifyContent: 'center',
          }}
        >
          <button
            type="button"
            onClick={() => reset()}
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
              cursor: 'pointer',
              boxShadow: '0 8px 20px -8px rgba(37, 99, 235, 0.7)',
            }}
          >
            <RotateCcw size={18} />
            Tekrar dene
          </button>

          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              fontSize: '0.95rem',
              fontWeight: 600,
              color: '#0f172a',
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              textDecoration: 'none',
            }}
          >
            <Home size={18} />
            Ana sayfaya dön
          </Link>
        </div>
      </div>
    </div>
  )
}
