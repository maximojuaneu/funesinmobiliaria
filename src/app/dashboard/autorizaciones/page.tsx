import type { Metadata } from 'next'
import AutorizacionesTabs from './AutorizacionesTabs'

export const metadata: Metadata = { title: 'Documentación de Propiedades | Dashboard', robots: { index: false } }

export default function AutorizacionesPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Documentación de propiedades</h1>
        <p className="text-gray-500 text-sm mt-1">
          Gestioná autorizaciones de venta y la documentación de cada propiedad.
        </p>
      </div>
      <AutorizacionesTabs />
    </div>
  )
}
