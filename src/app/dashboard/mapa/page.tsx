import type { Metadata } from 'next'
import OperationsMapClient from './OperationsMapClient'

export const metadata: Metadata = { title: 'Mapa de Operaciones Cerradas | Dashboard', robots: { index: false } }

export default function MapaPage() {
  return (
    <div className="p-4 lg:p-8 min-h-screen flex flex-col">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mapa de operaciones cerradas</h1>
          <p className="text-gray-500 text-sm mt-1">Reservas y ventas confirmadas desde enero 2025</p>
        </div>
      </div>
      <OperationsMapClient />
    </div>
  )
}
