import type { Metadata } from 'next'
import TasacionForm from './TasacionForm'

export const metadata: Metadata = {
  title: 'Tasar mi propiedad',
  description: 'Solicitá una tasación profesional y gratuita para tu propiedad en Funes, Santa Fe.',
}

export default function TasacionPage() {
  return (
    <>
      <div className="page-hero">
        <div className="max-w-7xl mx-auto px-6">
          <span className="page-hero-eyebrow">Conocé el valor</span>
          <div className="flex items-center gap-4 mb-4">
            <div className="hidden sm:block flex-1 h-px bg-gray-200" />
            <h1 className="w-full text-2xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 uppercase tracking-wide sm:tracking-widest font-eurostile text-center">Tasá tu propiedad</h1>
            <div className="hidden sm:block flex-1 h-px bg-gray-200" />
          </div>
          <p className="text-center text-xs text-gray-600 tracking-widest uppercase">Completá el formulario y nuestro equipo se contactará con vos</p>
        </div>
      </div>

      <section className="max-w-6xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-14 items-start">
        <TasacionForm />

        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-4">¿Por qué tasar con nosotros?</h2>
            <ul className="space-y-3 text-gray-600">
              {[
                'Tasadores con experiencia local',
                'Te contactamos en menos de 24 horas hábiles',
                'Conocimiento profundo del mercado de Funes, Roldán, Rosario y la región',
                'Informe detallado con valores reales del mercado',
              ].map(item => (
                <li key={item} className="flex items-start gap-3">
                  <span className="text-brand-green font-bold mt-0.5">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-brand-light rounded-2xl p-6">
            <h3 className="font-bold text-brand-green mb-2">¿Cómo funciona?</h3>
            <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
              <li>Completás el formulario con los datos de tu propiedad.</li>
              <li>Nuestro equipo analiza la información.</li>
              <li>Te contactamos para ponernos a trabajar.</li>
            </ol>
          </div>
        </div>
      </section>
    </>
  )
}
