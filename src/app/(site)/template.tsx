'use client'

import { useLayoutEffect, useEffect, useRef } from 'react'
import { registerNavigation } from '@/lib/nav-intent'

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

// Vive mientras la pestaña esté abierta: la primera vez que se monta es la carga inicial.
let hasNavigated = false

// Se vuelve a montar en cada navegación entre páginas. En la carga inicial no se anima
// (así el contenido principal aparece sin demora); en las siguientes, entra con un fundido.
export default function Template({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const decided = useRef(false)

  useIsoLayoutEffect(() => {
    if (decided.current) return
    decided.current = true
    const kind = registerNavigation(!hasNavigated)
    // Cambiar de sección con un clic siempre abre la página nueva arriba de todo. Con "atrás/adelante"
    // se respeta la posición anterior (la restaura el navegador o el propio listado).
    if (kind === 'push') window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    if (hasNavigated) ref.current?.classList.add('animate-page-enter')
    hasNavigated = true
  }, [])

  return <div ref={ref}>{children}</div>
}
