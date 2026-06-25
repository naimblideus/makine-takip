export default function Loading() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        padding: '2rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div className="spinner" style={{ width: '2.25rem', height: '2.25rem' }} />
      <p
        style={{
          fontSize: '0.9rem',
          fontWeight: 500,
          color: '#64748b',
          margin: 0,
        }}
      >
        Yükleniyor…
      </p>
    </div>
  )
}
