'use client'
import { useState } from 'react'
import Link from 'next/link'

const EMPTY = {
  nombre: '', edad: '', whatsapp: '', email: '', instagram: '',
  ciudad: '', corredor: '', profesion: '', comision: '', experiencia: '',
  movilidad: '', club: '', colegio: '', personalidad: '', motivacion: '',
  emprendimiento: '', fulltime: '', respaldo: '',
}

type FormData = typeof EMPTY

// ── Sub-componentes fuera del render para evitar desmontaje en cada keystroke ──

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function Input({ label, name, value, onChange, type = 'text', required = true, placeholder = '' }: {
  label: string; name: string; value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string; required?: boolean; placeholder?: string
}) {
  return (
    <Field label={label} required={required}>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="input-field"
      />
    </Field>
  )
}

function Textarea({ label, name, value, onChange, required = true, placeholder = '' }: {
  label: string; name: string; value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  required?: boolean; placeholder?: string
}) {
  return (
    <Field label={label} required={required}>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        rows={3}
        className="input-field resize-none"
      />
    </Field>
  )
}

function Radio({ label, name, value, onChange, options, required = true }: {
  label: string; name: string; value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  options: string[]; required?: boolean
}) {
  return (
    <Field label={label} required={required}>
      <div className="flex flex-col gap-2 mt-1">
        {options.map(opt => (
          <label key={opt} className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={opt}
              checked={value === opt}
              onChange={onChange}
              className="w-4 h-4 accent-brand-green"
            />
            <span className="text-sm text-gray-700">{opt}</span>
          </label>
        ))}
      </div>
    </Field>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function SumatePage() {
  const [form, setForm]       = useState<FormData>(EMPTY)
  const [sending, setSending] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  const handleChange = (k: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/leads/sumate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const j = await res.json()
        setError(j.error ?? 'Error al enviar. Intentá de nuevo.')
      } else {
        setSent(true)
      }
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    }
    setSending(false)
  }

  if (sent) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-brand-light flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">¡Gracias por postularte!</h1>
      <p className="text-gray-500 mb-8 max-w-md">Recibimos tu información. En breve nos ponemos en contacto con vos.</p>
      <Link href="/" className="btn-primary">Volver al inicio</Link>
    </div>
  )

  return (
    <>
      {/* Banner */}
      <div className="page-hero">
        <div className="max-w-2xl mx-auto text-center">
          <span className="page-hero-eyebrow">Trabajá con nosotros</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 uppercase tracking-widest font-eurostile">Sumate</h1>
          <p className="text-gray-500 mt-4">Completá el formulario y nos ponemos en contacto con vos.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-16">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Datos personales */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-5 pb-2 border-b border-gray-100 font-sans">Datos personales</h2>
            <div className="space-y-4">
              <Input label="¿Cómo te llamás?" name="nombre" value={form.nombre} onChange={handleChange('nombre')} placeholder="Nombre y apellido" />
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="¿Qué edad tenés?" name="edad" value={form.edad} onChange={handleChange('edad')} type="number" placeholder="Ej: 28" />
                <Input label="Número de WhatsApp" name="whatsapp" value={form.whatsapp} onChange={handleChange('whatsapp')} type="tel" placeholder="+54 9 341 000 0000" />
              </div>
              <Input label="Correo electrónico" name="email" value={form.email} onChange={handleChange('email')} type="email" placeholder="tu@email.com" />
              <Input label="Usuario de Instagram" name="instagram" value={form.instagram} onChange={handleChange('instagram')} required={false} placeholder="@usuario (opcional)" />
              <Input label="¿En qué ciudad y barrio vivís?" name="ciudad" value={form.ciudad} onChange={handleChange('ciudad')} placeholder="Ej: Don Mateo, Funes" />
            </div>
          </div>

          {/* Perfil profesional */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-5 pb-2 border-b border-gray-100 font-sans">Perfil profesional</h2>
            <div className="space-y-5">
              <Radio
                label="¿Sos corredor inmobiliario?"
                name="corredor"
                value={form.corredor}
                onChange={handleChange('corredor')}
                options={['Sí', 'No, pero estoy en trámite', 'No, tengo otra profesión']}
              />
              {form.corredor === 'No, tengo otra profesión' && (
                <Input label="¿Cuál es tu profesión?" name="profesion" value={form.profesion} onChange={handleChange('profesion')} placeholder="Describí tu profesión actual" />
              )}
              <Radio
                label="Esta actividad se trabaja a comisión. ¿Es lo que buscás?"
                name="comision"
                value={form.comision}
                onChange={handleChange('comision')}
                options={['Sí, es lo que estoy buscando', 'No, estoy buscando un sueldo fijo']}
              />
              <Textarea label="¿Tenés experiencia en el rubro inmobiliario?" name="experiencia" value={form.experiencia} onChange={handleChange('experiencia')} placeholder="Contanos tu experiencia (o escribí 'Sin experiencia' si es tu primer acercamiento)" />
              <Radio
                label="¿Contás con movilidad propia?"
                name="movilidad"
                value={form.movilidad}
                onChange={handleChange('movilidad')}
                options={['Sí, auto propio', 'Sí, moto', 'No, pero tengo licencia', 'No tengo movilidad']}
              />
            </div>
          </div>

          {/* Sobre vos */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-5 pb-2 border-b border-gray-100 font-sans">Sobre vos</h2>
            <div className="space-y-4">
              <Input label="¿Vas o fuiste a algún club?" name="club" value={form.club} onChange={handleChange('club')} placeholder="Ej: Náutico, Tenis, Fútbol, Rugby, etc." />
              <Input label="¿A qué colegio secundario fuiste?" name="colegio" value={form.colegio} onChange={handleChange('colegio')} placeholder="Nombre del colegio" />
              <Textarea label="¿Cómo te describirías para este rol?" name="personalidad" value={form.personalidad} onChange={handleChange('personalidad')} placeholder="Contanos cómo sos, qué te caracteriza..." />
              <Textarea label="¿Qué te motiva a trabajar de manera independiente?" name="motivacion" value={form.motivacion} onChange={handleChange('motivacion')} placeholder="¿Por qué elegís este tipo de actividad?" />
              <Textarea label="¿Emprendiste o tenés algún proyecto propio?" name="emprendimiento" value={form.emprendimiento} onChange={handleChange('emprendimiento')} placeholder="Contanos si tuviste o tenés emprendimientos propios" />
            </div>
          </div>

          {/* Disponibilidad */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-5 pb-2 border-b border-gray-100 font-sans">Disponibilidad</h2>
            <div className="space-y-5">
              <Radio
                label="Esta actividad requiere dedicación FULL TIME. ¿Podés comprometerte?"
                name="fulltime"
                value={form.fulltime}
                onChange={handleChange('fulltime')}
                options={['Sí', 'No']}
              />
              <Radio
                label="¿Contás con respaldo económico para los primeros meses mientras construís tu cartera?"
                name="respaldo"
                value={form.respaldo}
                onChange={handleChange('respaldo')}
                options={['Sí', 'No']}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={sending}
            className="btn-primary w-full text-center disabled:opacity-50 disabled:cursor-not-allowed text-base py-4"
          >
            {sending ? 'Enviando...' : 'Enviar postulación'}
          </button>

          <p className="text-xs text-gray-400 text-center">
            Los campos marcados con <span className="text-red-500">*</span> son obligatorios.
          </p>
        </form>
      </div>
    </>
  )
}
