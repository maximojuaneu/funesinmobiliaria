import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold tracking-widest text-brand-green uppercase mb-4">404</p>
      <h1 className="text-3xl font-bold text-gray-900 mb-3">Página no encontrada</h1>
      <p className="text-gray-500 mb-8 max-w-md">
        El enlace que seguiste no existe o expiró. Podés buscar propiedades o volver al inicio.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/venta"
          className="bg-brand-green text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-hover transition-colors"
        >
          Ver propiedades en venta
        </Link>
        <Link
          href="/"
          className="border-2 border-brand-green text-brand-green px-6 py-3 rounded-lg font-semibold hover:bg-brand-green hover:text-white transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
