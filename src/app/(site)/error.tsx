'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold tracking-widest text-brand-green uppercase mb-4">Error</p>
      <h1 className="text-3xl font-bold text-gray-900 mb-3">Algo salió mal</h1>
      <p className="text-gray-500 mb-8 max-w-md">
        Ocurrió un error al cargar esta página. Podés intentarlo de nuevo o volver al inicio.
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="bg-brand-green text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-hover transition-colors"
        >
          Reintentar
        </button>
        <Link href="/" className="border-2 border-brand-green text-brand-green px-6 py-3 rounded-lg font-semibold hover:bg-brand-green hover:text-white transition-colors">
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
