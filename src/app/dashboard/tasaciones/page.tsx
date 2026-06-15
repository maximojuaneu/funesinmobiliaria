import type { Metadata } from 'next'
import TasacionClient from './TasacionClient'

export const metadata: Metadata = { title: 'Informe de Tasación | Dashboard', robots: { index: false } }

export default function TasacionPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Informe de Tasación</h1>
        <p className="text-gray-500 text-sm mt-1">Completá los datos y generá el informe en PDF listo para entregar.</p>
      </div>
      <TasacionClient />
    </div>
  )
}
