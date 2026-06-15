'use client'
import { useState } from 'react'
import { gtagEvent } from '@/lib/gtag'

export default function ContactForm() {
  const [status, setStatus] = useState<'idle'|'loading'|'ok'|'error'>('idle')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('loading')
    const data = Object.fromEntries(new FormData(e.currentTarget) as any)
    try {
      const res = await fetch('/api/leads/contacto', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (!res.ok) throw new Error()
      gtagEvent('contact_form_submit', { consulta: data.consulta ?? '' })
      setStatus('ok')
      e.currentTarget.reset()
    } catch { setStatus('error') }
  }

  if (status === 'ok') return (
    <div className="bg-brand-light rounded-2xl p-10 text-center">
      <p className="text-4xl mb-4">✅</p>
      <h3 className="text-xl font-bold text-brand-green mb-2">¡Mensaje enviado!</h3>
      <p className="text-gray-600">Te respondemos a la brevedad.</p>
      <button onClick={() => setStatus('idle')} className="mt-6 btn-outline">Enviar otra consulta</button>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre *</label>
          <input name="nombre" required className="input-field" placeholder="Tu nombre" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Teléfono *</label>
          <input name="telefono" required type="tel" className="input-field" placeholder="341 000-0000" />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email *</label>
        <input name="email" required type="email" className="input-field" placeholder="tu@email.com" />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo de consulta</label>
        <select name="consulta" className="input-field">
          <option value="">Seleccionar</option>
          {['Comprar una propiedad','Alquilar una propiedad','Vender / Tasar mi propiedad','Emprendimientos','Otro'].map(o => <option key={o}>{o}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mensaje</label>
        <textarea name="mensaje" rows={4} className="input-field resize-none" placeholder="¿En qué te podemos ayudar?" />
      </div>
      <button type="submit" disabled={status === 'loading'} className="btn-primary w-full text-center py-4 text-base">
        {status === 'loading' ? 'Enviando...' : 'Enviar mensaje'}
      </button>
      {status === 'error' && <p className="text-red-500 text-sm text-center">Hubo un error. Intentá nuevamente.</p>}
    </form>
  )
}
