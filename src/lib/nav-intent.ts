// Distingue cómo se llegó a una página: con "atrás/adelante" del navegador (conviene volver a la
// posición que tenía el usuario) o con un clic normal en un enlace (la página nueva debe abrir
// arriba de todo). Solo existe en el navegador.

type Kind = 'initial' | 'push' | 'pop'

let popPending = false
let current: Kind = 'initial'

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => { popPending = true })
  // Un clic nuevo del usuario es una navegación nueva: descarta un "atrás" que no llegó a aplicarse
  // (por ejemplo, volver entre filtros de la misma página).
  document.addEventListener('click', () => { popPending = false }, true)
}

export function registerNavigation(isFirst: boolean): Kind {
  current = isFirst ? 'initial' : popPending ? 'pop' : 'push'
  popPending = false
  return current
}

export const isPopNavigation = () => current === 'pop'
