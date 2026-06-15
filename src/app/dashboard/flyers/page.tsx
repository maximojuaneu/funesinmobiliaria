import type { Metadata } from 'next'
import FlyerGeneratorClient from './FlyerGeneratorClient'

export const metadata: Metadata = { title: 'Generador de Flyers | Dashboard', robots: { index: false } }

export default function FlyersPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Generador de Flyers</h1>
        <p className="text-gray-500 text-sm mt-1">Creá piezas gráficas para Instagram, Facebook y WhatsApp.</p>
      </div>
      <FlyerGeneratorClient />
    </div>
  )
}
