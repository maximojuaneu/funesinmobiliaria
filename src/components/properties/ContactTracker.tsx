'use client'

interface Props {
  propiedadId: string | number
  agente: string
  tipo: string        // 'venta' | 'alquiler'
  origen: string      // 'whatsapp' | 'llamada'
  direccion: string
  children: React.ReactNode
}

export default function ContactTracker({ propiedadId, agente, tipo, origen, direccion, children }: Props) {
  const track = () => {
    fetch('/api/leads/propiedad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propiedadId: String(propiedadId),
        agente,
        tipo,
        origen,
        direccion,
      }),
    }).catch(() => {})   // fire-and-forget, never block the user action
  }

  return <span onClick={track} style={{ display: 'contents' }}>{children}</span>
}
