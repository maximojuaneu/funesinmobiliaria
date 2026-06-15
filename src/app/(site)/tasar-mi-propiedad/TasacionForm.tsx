'use client'
import { useState } from 'react'
import { gtagEvent } from '@/lib/gtag'

const MOTIVOS = [
  'Quiero vender mi propiedad',
  'Quiero alquilar mi propiedad',
  'Quiero conocer el valor de mi propiedad',
]

const TIPOS = ['Casa', 'Departamento', 'Terreno', 'Oficina / Local', 'Otro']

export default function TasacionForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('loading')
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form) as any)
    try {
      const res = await fetch('/api/leads/tasacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      gtagEvent('tasacion_submit', { motivo: data.motivo ?? '', tipo: data.tipo ?? '' })
      setStatus('ok')
      form.reset()
    } catch {
      setStatus('error')
    }
  }

  if (status === 'ok') {
    return (
      <div className="bg-brand-light rounded-2xl p-10 text-center">
        <h3 className="text-xl font-bold text-brand-green mb-2">¡Solicitud recibida!</h3>
        <p className="text-gray-600">Nuestro equipo te contactará en menos de 24 hs.</p>
        <button onClick={() => setStatus('idle')} className="mt-6 btn-outline">
          Enviar otra consulta
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Nombre Completo */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Nombre Completo <span className="text-red-500">*</span>
        </label>
        <input
          name="nombre"
          required
          className="input-field"
          placeholder="Tu nombre completo"
        />
      </div>

      {/* Motivo de tasación */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Motivo de tasación <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {MOTIVOS.map(m => (
            <label key={m} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="motivo"
                value={m}
                required
                className="w-4 h-4 accent-brand-green"
              />
              <span className="text-sm text-gray-700 group-hover:text-brand-green transition-colors">
                {m}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Tipo de propiedad */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Tipo de propiedad <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {TIPOS.map(t => (
            <label key={t} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="tipo"
                value={t}
                required
                className="w-4 h-4 accent-brand-green"
              />
              <span className="text-sm text-gray-700 group-hover:text-brand-green transition-colors">
                {t}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Dirección del inmueble y ciudad */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Dirección del inmueble y ciudad <span className="text-red-500">*</span>
        </label>
        <input
          name="direccion"
          required
          className="input-field"
          placeholder="Ej: Av. San Martín 1234, Funes"
        />
      </div>

      {/* Telefono de contacto */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Telefono de contacto <span className="text-red-500">*</span>
        </label>
        <input
          name="telefono"
          required
          type="tel"
          className="input-field"
          placeholder="341 000-0000"
        />
      </div>

      {/* Dirección de email */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Dirección de email <span className="text-red-500">*</span>
        </label>
        <input
          name="email"
          required
          type="email"
          className="input-field"
          placeholder="tu@email.com"
        />
      </div>

      {/* Detalles adicionales / observaciones */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Detalles adicionales / observaciones
        </label>
        <textarea
          name="detalles"
          rows={4}
          className="input-field resize-none"
          placeholder="Superficie, ambientes, estado del inmueble..."
        />
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="btn-primary w-full text-center py-4 text-base"
      >
        {status === 'loading' ? 'Enviando...' : 'Solicitar tasación'}
      </button>

      {status === 'error' && (
        <p className="text-red-500 text-sm text-center">
          Hubo un error. Intentá nuevamente.
        </p>
      )}
    </form>
  )
}
