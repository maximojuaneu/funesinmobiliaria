'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="es">
      <body style={{ fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', margin: 0, textAlign: 'center', padding: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px' }}>Algo salió mal</h1>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>Ocurrió un error inesperado.</p>
        <button
          onClick={reset}
          style={{ background: '#067148', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
        >
          Reintentar
        </button>
      </body>
    </html>
  )
}
